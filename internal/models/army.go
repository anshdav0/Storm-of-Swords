package models

import (
	"context"
	"fmt"
)

type RecruitResult struct {
	TroopID      int64  `json:"troop_id"`
	TroopType    string `json:"troop_type"`
	Quantity     int    `json:"quantity"`
	RecruitLevel int    `json:"recruit_level"`
}

type FightingTroop struct {
	ID    int64  `json:"id"`
	Type  string `json:"type"`
	Speed int    `json:"speed"`

	Level  int `json:"level"`
	HP     int `json:"hp"`
	Damage int `json:"damage"`

	DismountedFormID *int64 `json:"dismounted_form_id,omitempty"`
}

type ArmyEntry struct {
	Troop    FightingTroop `json:"troop"`
	Quantity int           `json:"quantity"`
}

// Gives army details with the necessary troop requirement for a battle
func (ts *TroopStore) GetArmy(ctx context.Context, villageID int64) ([]ArmyEntry, error) {
	rows, err := ts.store.Pool.Query(ctx, `
		SELECT t.id, t.type, t.speed, t.dismounted_form_id, tls.level, tls.hp, tls.damage, a.quantity
		FROM army a
		JOIN troop t
			ON t.id = a.troop_id
		JOIN troop_level_stat tls
			ON tls.troop_id = a.troop_id
		   AND tls.level = a.level
		WHERE a.village_id = $1
		ORDER BY t.id
	`, villageID)
	if err != nil {
		return nil, fmt.Errorf("GetArmy: %w", err)
	}
	defer rows.Close()

	entries := make([]ArmyEntry, 0)
	for rows.Next() {
		var e ArmyEntry
		err := rows.Scan(&e.Troop.ID, &e.Troop.Type, &e.Troop.Speed, &e.Troop.DismountedFormID, &e.Troop.Level, &e.Troop.HP, &e.Troop.Damage, &e.Quantity)
		if err != nil {
			return nil, fmt.Errorf("GetArmy scan: %w", err)
		}
		entries = append(entries, e)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("GetArmy rows: %w", rows.Err())
	}

	return entries, nil
}

// Adds troops to the army
func (ts *TroopStore) RecruitTroop(ctx context.Context, villageID int64, troopID int64, quantity int, vs *VillageStore, bs *BuildingStore) (*RecruitResult, error) {

	troop, err := ts.GetTroopAtMaxUnlockedLevel(ctx, troopID, villageID, bs)
	if err != nil {
		return nil, err
	}

	//checks if the current capacity is able to handle the number of troops
	var currentUsage int
	err = ts.store.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(a.quantity * t.housing_space), 0)
		FROM army a
		JOIN troop t ON t.id = a.troop_id
		WHERE a.village_id = $1
	`, villageID).Scan(&currentUsage)
	if err != nil {
		return nil, fmt.Errorf("RecruitTroop fetch housing usage: %w", err)
	}

	var totalCapacity int
	err = ts.store.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(sb.capacity), 0)
		FROM village_building vb
		JOIN storage_building sb
			ON sb.id = vb.building_id
		   AND sb.level = vb.level
		WHERE vb.village_id = $1 AND vb.building_id = 5
	`, villageID).Scan(&totalCapacity)
	if err != nil {
		return nil, fmt.Errorf("RecruitTroop fetch camp capacity: %w", err)
	}

	if totalCapacity == 0 {
		return nil, fmt.Errorf("you must build an Army Camp before recruiting troops")
	}

	incoming := quantity * troop.HousingSpace
	if currentUsage+incoming > totalCapacity {
		available := (totalCapacity - currentUsage) / troop.HousingSpace
		return nil, fmt.Errorf(
			"not enough housing space — you can recruit at most %d more of this troop (housing space: %d each)",
			available, troop.HousingSpace,
		)
	}

	//begins the transaction of buying the troops
	tx, err := ts.store.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("RecruitTroop begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	paid, err := vs.Purchase(ctx, tx, villageID, Cost{
		Gold:     troop.CostGold * quantity,
		Iron:     troop.CostIron * quantity,
		Wildfire: troop.CostWildfire * quantity,
	}, nil)
	if !paid {
		return nil, fmt.Errorf("not enough resources: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO army (village_id, troop_id, quantity, level)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (village_id, troop_id)
		DO UPDATE SET
			quantity = army.quantity + EXCLUDED.quantity,
			level    = GREATEST(army.level, EXCLUDED.level)
	`, villageID, troopID, quantity, troop.Level)
	if err != nil {
		return nil, fmt.Errorf("RecruitTroop upsert army: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("RecruitTroop commit: %w", err)
	}

	finalarmy := RecruitResult{
		TroopID:      troop.ID,
		TroopType:    troop.Type,
		Quantity:     quantity,
		RecruitLevel: troop.Level,
	}

	return &finalarmy, nil
}
