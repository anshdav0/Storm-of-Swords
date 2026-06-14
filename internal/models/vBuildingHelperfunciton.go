package models

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// helper function that finds upgrade and building cost
func (bs *BuildingStore) FindCostBuilding(ctx context.Context, btype string, buildingID int64, level int) (Cost, error) {

	var upgradeCost int
	var err error
	switch btype {
	case "defense":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM defense_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	case "storage":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM storage_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	case "producer":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM producer_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	}
	if err != nil {
		return Cost{}, fmt.Errorf("UpgradeBuild cost fetch: %w", err)
	}

	cost := Cost{}
	switch btype {
	case "defense":
		cost.Gold = upgradeCost
	}
	cost.Iron = upgradeCost

	return cost, nil
}

// Just a hepler function to get the hp of currently build building
func (bs *BuildingStore) FindHP(ctx context.Context, btype string, buildingID int64, level int) (int, error) {
	var Hp int
	var err error
	switch btype {
	case "defense":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT hp FROM defense_building
			WHERE id = $1 AND level = $2
		`, buildingID, level).Scan(&Hp)
	case "storage":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT hp FROM storage_building
			WHERE id = $1 AND level = $2
		`, buildingID, level).Scan(&Hp)
	case "producer":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT hp FROM producer_building
			WHERE id = $1 AND level = $2
		`, buildingID, level).Scan(&Hp)
	}
	if err != nil {
		return 0, fmt.Errorf("Cant get HP data")
	}
	return Hp, nil
}

func (bs *BuildingStore) GetBuildLevelName(ctx context.Context, villageID int64, buildingID int64) (int, string, error) {
	// 1. Only select the exact columns you intend to scan!
	query := `
        SELECT
            vb.level, 
            b.building_name
        FROM village_building vb
        JOIN building b ON b.id = vb.building_id
        WHERE vb.village_id = $1 AND vb.building_id = $2
    `

	var level int
	var name string

	// 2. QueryRow executes and Scans inline. No rows.Close() needed.
	err := bs.store.Pool.QueryRow(ctx, query, villageID, buildingID).Scan(&level, &name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Clean, user-facing error message instead of a server crash
			return 0, "", fmt.Errorf("you must build an Armoury before recruiting troops")
		}
		return 0, "", fmt.Errorf("GetBuildLevelName failed: %w", err)
	}

	return level, name, nil
}
