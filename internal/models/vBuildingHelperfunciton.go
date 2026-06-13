package models

import (
	"context"
	"fmt"
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
