package models

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/game"
)

type DeploymentRequest struct {
	TroopID  int64   `json:"troop_id"`
	Quantity int     `json:"quantity"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
}

type BattleResponse struct {
	BattleID       int64              `json:"battle_id"`
	StarsEarned    int                `json:"stars_earned"`
	TrophiesGained int                `json:"trophies_gained"`
	GoldLooted     int                `json:"gold_looted"`
	IronLooted     int                `json:"iron_looted"`
	WildfireLooted int                `json:"wildfire_looted"`
	Events         []game.BattleEvent `json:"events"`
	ReplayInput    game.BattleInput   `json:"replay_input"`
}

func (bs *BattleStore) Attack(ctx context.Context, attackerID int64, defenderID int64, deployRequests []DeploymentRequest, ts *TroopStore, vs *VillageStore) (*BattleResponse, error) {

	if attackerID == defenderID {
		return nil, fmt.Errorf("cannot attack yourself")
	}

	//load both players' trophy counts
	var attackerTrophies, defenderTrophies int
	if err := bs.store.Pool.QueryRow(ctx,
		`SELECT trophies FROM player WHERE id = $1`, attackerID,
	).Scan(&attackerTrophies); err != nil {
		return nil, fmt.Errorf("Attack fetch attacker: %w", err)
	}
	if err := bs.store.Pool.QueryRow(ctx,
		`SELECT trophies FROM player WHERE id = $1`, defenderID,
	).Scan(&defenderTrophies); err != nil {
		return nil, fmt.Errorf("Attack fetch defender: %w", err)
	}

	//getting defender's resources
	var cost Cost
	if err := bs.store.Pool.QueryRow(ctx,
		`SELECT gold, iron, wildfire FROM village WHERE id = $1`, defenderID,
	).Scan(&cost.Gold, &cost.Iron, &cost.Wildfire); err != nil {
		return nil, fmt.Errorf("Attack fetch defender resources: %w", err)
	}

	snapshot, err := bs.LoadDefenderSnapshot(ctx, defenderID)
	if err != nil {
		return nil, err
	}

	deployment, err := bs.BuildDeployment(ctx, attackerID, deployRequests, ts)
	if err != nil {
		return nil, err
	}

	input := game.BattleInput{
		DefenderSnapshot:   snapshot,
		AttackerDeployment: deployment,
	}

	events, result := game.StartBattle(input)

	// extra logic for extra star as there was no accounting for the main building destroyed or not
	finalStateofDefender := game.GiveFinalState(input)
	mainCastleID := findMainCastleID(snapshot)
	mainCastleDestroyed := false
	for _, b := range finalStateofDefender.Buildings {
		if b.VillageBuildingID == mainCastleID && b.Destroyed {
			mainCastleDestroyed = true
		}
	}

	stars := result.StarsEarned
	if mainCastleDestroyed {
		stars++
	}

	trophiesGained := computeTrophies(attackerTrophies, defenderTrophies, stars)
	Loot := computeLoot(cost, stars)

	replayJSON, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("Attack Marshal replay: %w", err)
	}

	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("Attack begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var battleID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO battles (attacker_id, defender_id, trophies_gained, star_earned, gold_looted, iron_looted, wildfire_looted, replay_data)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, attackerID, defenderID, trophiesGained, stars, Loot.Gold, Loot.Iron, Loot.Wildfire, replayJSON,
	).Scan(&battleID)
	if err != nil {
		return nil, fmt.Errorf("Attack insert battle: %w", err)
	}

	// Trophies updation
	if _, err := tx.Exec(ctx,
		`UPDATE player SET trophies = trophies + $1 WHERE id = $2`,
		trophiesGained, attackerID,
	); err != nil {
		return nil, fmt.Errorf("Attack update attacker trophies: %w", err)
	}
	if _, err := tx.Exec(ctx,
		`UPDATE player SET trophies = GREATEST(0, trophies - $1) WHERE id = $2`,
		trophiesGained, defenderID,
	); err != nil {
		return nil, fmt.Errorf("Attack update defender trophies: %w", err)
	}

	// deleting army
	if _, err := tx.Exec(ctx, `DELETE FROM army WHERE village_id = $1`, attackerID); err != nil {
		return nil, fmt.Errorf("Attack wipe army: %w", err)
	}

	// balancing loot
	if _, err := tx.Exec(ctx, `
		UPDATE village
		SET gold     = GREATEST(0, gold - $1),
		    iron     = GREATEST(0, iron - $2),
		    wildfire = GREATEST(0, wildfire - $3)
		WHERE id = $4
	`, Loot.Gold, Loot.Iron, Loot.Wildfire, defenderID); err != nil {
		return nil, fmt.Errorf("Attack deduct defender resources: %w", err)
	}

	Loot.Gold = -Loot.Gold
	Loot.Iron = -Loot.Iron
	Loot.Wildfire = -Loot.Wildfire
	if paid, err := vs.Purchase(ctx, tx, attackerID, cost, nil); !paid || err != nil {
		return nil, fmt.Errorf("Attack add gold loot: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("Attack commit: %w", err)
	}

	return &BattleResponse{
		BattleID:       battleID,
		StarsEarned:    stars,
		TrophiesGained: trophiesGained,
		GoldLooted:     -Loot.Gold,
		IronLooted:     -Loot.Iron,
		WildfireLooted: -Loot.Wildfire,
		Events:         events,
		ReplayInput:    input,
	}, nil

}

func findMainCastleID(snapshot []game.OpponentBuilding) int64 {
	for _, b := range snapshot {
		if b.BuildingName == "Main Castle" {
			return b.VillageBuildingID
		}
	}
	return -1
}
