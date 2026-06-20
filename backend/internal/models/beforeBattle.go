package models

import (
	"context"
	"fmt"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/game"
)

type OpponentPreview struct {
	PlayerID int64  `json:"player_id"`
	Username string `json:"username"`
	Trophies int    `json:"trophies"`
}

func (bs *BattleStore) FindOpponent(ctx context.Context, attackerID int64) (*OpponentPreview, error) {
	var attackerTrophies int
	err := bs.store.Pool.QueryRow(ctx, `SELECT trophies FROM player WHERE id = $1`, attackerID).Scan(&attackerTrophies)
	if err != nil {
		return nil, fmt.Errorf("Find Opponent fetch failed: %w", err)
	}

	opponent := &OpponentPreview{}
	err = bs.store.Pool.QueryRow(ctx, `
		SELECT p.id, p.username, p.trophies
		FROM player p
		WHERE p.id != $1
			AND p.trophies BETWEEN $2 - 200 AND $2 +200
			AND EXISTS (
				SELECT 1 FROM village_building vb WHERE vb.village_id = p.id
			)
		ORDER BY RANDOM()
		limit 1
	`, attackerID, attackerTrophies).Scan(&opponent.PlayerID, &opponent.Username, &opponent.Trophies)
	if err != nil {
		return nil, fmt.Errorf("no suitable opponents found")
	}

	return opponent, nil
}

func (bs *BattleStore) LoadDefenderSnapshot(ctx context.Context, defenderID int64) ([]game.OpponentBuilding, error) {
	rows, err := bs.store.Pool.Query(ctx, `
		SELECT
			vb.id, b.building_name, b.type,
			vb.x_cor, vb.y_cor, b.size_x, b.size_y,
			vb.current_hp,
			COALESCE(db.damage_per_sec, 0),
			COALESCE(db.range, 0),
			COALESCE(db.splash_rad, 0)
		FROM village_building vb
		JOIN building b ON b.id = vb.building_id
		LEFT JOIN defense_building db
			ON db.id = vb.building_id AND db.level = vb.level
		WHERE vb.village_id = $1
		  AND vb.x_cor IS NOT NULL
		  AND vb.y_cor IS NOT NULL
	`, defenderID)
	if err != nil {
		return nil, fmt.Errorf("LoadDefenderSnapshot: %w", err)
	}
	defer rows.Close()

	var snapshot []game.OpponentBuilding
	for rows.Next() {
		var sb game.OpponentBuilding
		if err := rows.Scan(
			&sb.VillageBuildingID, &sb.BuildingName, &sb.BuildingType,
			&sb.XCor, &sb.YCor, &sb.SizeX, &sb.SizeY,
			&sb.CurrentHP, &sb.DPS, &sb.Range, &sb.SplashRad,
		); err != nil {
			return nil, fmt.Errorf("LoadDefenderSnapshot scan: %w", err)
		}
		snapshot = append(snapshot, sb)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("LoadDefenderSnapshot rows: %w", rows.Err())
	}

	if len(snapshot) == 0 {
		return nil, fmt.Errorf("defender has no buildings placed")
	}

	return snapshot, nil
}

func (bs *BattleStore) BuildDeployment(ctx context.Context, villageID int64, requests []DeploymentRequest, ts *TroopStore) ([]game.DeployedTroop, error) {

	if len(requests) == 0 {
		return nil, fmt.Errorf("must deploy at least one troop")
	}

	var deployment []game.DeployedTroop

	for _, req := range requests {
		if req.Quantity <= 0 {
			return nil, fmt.Errorf("quantity must be positive for troop %d", req.TroopID)
		}

		var level, available int
		err := bs.store.Pool.QueryRow(ctx,
			`SELECT level, quantity FROM army WHERE village_id = $1 AND troop_id = $2`,
			villageID, req.TroopID,
		).Scan(&level, &available)
		if err != nil {
			return nil, fmt.Errorf("you don't have troop %d in your army", req.TroopID)
		}

		if available < req.Quantity {
			return nil, fmt.Errorf(
				"not enough troop %d (have %d, trying to deploy %d)",
				req.TroopID, available, req.Quantity,
			)
		}

		troop, err := ts.GetTroop(ctx, req.TroopID, level)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch troop %d stats: %w", req.TroopID, err)
		}

		deployment = append(deployment, game.DeployedTroop{
			TroopID:   troop.ID,
			TroopType: troop.Type,
			Quantity:  req.Quantity,
			X:         int(req.X),
			Y:         int(req.Y),
			HP:        troop.HP,
			Damage:    troop.Damage,
			Speed:     float64(troop.Speed),
		})
	}

	return deployment, nil
}
