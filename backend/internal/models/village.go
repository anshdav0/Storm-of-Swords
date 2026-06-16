package models

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

type Village struct {
	ID       int64 `json:"id"`
	Gold     int   `json:"gold"`
	Iron     int   `json:"iron"`
	Wildfire int   `json:"wildfire"`
	Level    int   `json:"level"`
}

type Cost struct {
	Gold     int
	Iron     int
	Wildfire int
}

func (vs VillageStore) GetVillage(ctx context.Context, playerID int64) (*Village, error) {
	query := `
		SELECT id, gold, iron, wildfire, level
		FROM village
		WHERE id = $1
	`
	village := &Village{}
	err := vs.store.Pool.QueryRow(ctx, query, playerID).Scan(
		&village.ID,
		&village.Gold,
		&village.Iron,
		&village.Wildfire,
		&village.Level,
	)
	if err != nil {
		return nil, fmt.Errorf("GetVillage: %w", err)
	}
	return village, nil
}

// function which will do any purchase done as a part of previously existing transaction or as a new one as needed at that time
func (vs *VillageStore) Purchase(ctx context.Context, tx pgx.Tx, villageID int64, cost Cost, bs *BuildingStore) (bool, error) {
	var gold, iron, wildfire int

	//get the data of available resources
	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, `
			SELECT gold, iron, wildfire FROM village WHERE id = $1
			`, villageID).Scan(&gold, &iron, &wildfire)
	} else {
		err = vs.store.Pool.QueryRow(ctx, `
			SELECT gold, iron, wildfire FROM village WHERE id = $1
			`, villageID).Scan(&gold, &iron, &wildfire)
	}
	if err != nil {
		return false, fmt.Errorf("Purchase fetch: %w", err)
	}

	//compare it with the cost of purchase
	if bs != nil {
		capacity, err := vs.FindLimit(ctx, villageID, bs)
		if gold-cost.Gold > capacity.Gold {
			cost.Gold = gold - capacity.Gold
		}
		if iron-cost.Iron > capacity.Iron {
			cost.Iron = iron - capacity.Iron
		}
		if wildfire-cost.Wildfire > capacity.Wildfire {
			cost.Wildfire = wildfire - capacity.Wildfire
		}
		if err != nil {
			return false, fmt.Errorf("%w", err)
		}
	} else {
		if gold < cost.Gold || iron < cost.Iron || wildfire < cost.Wildfire {
			return false, fmt.Errorf("not enough resources")
		}
	}

	//do the actual purchase
	if tx != nil {
		_, err = tx.Exec(ctx, `
			UPDATE village
			SET gold     = gold     - $1,
			    iron     = iron     - $2,
			    wildfire = wildfire - $3
			WHERE id = $4
		`, cost.Gold, cost.Iron, cost.Wildfire, villageID)
	} else {
		_, err = vs.store.Pool.Exec(ctx, `
			UPDATE village
			SET gold     = gold     - $1,
			    iron     = iron     - $2,
			    wildfire = wildfire - $3
			WHERE id = $4
		`, cost.Gold, cost.Iron, cost.Wildfire, villageID)
	}
	if err != nil {
		return false, fmt.Errorf("DeductResources deduct: %w", err)
	}

	return true, nil
}

func (vs *VillageStore) FindLimit(ctx context.Context, villageID int64, bs *BuildingStore) (*Cost, error) {
	var building []StorageBuilding
	building, err := bs.GetStorBuilds(ctx, villageID)
	if err != nil {
		return nil, fmt.Errorf("Failed ot fetch total storage data: %w", err)
	}

	var cost Cost

	for _, name := range building {
		switch name.ResourceType {
		case "gold":
			cost.Gold += name.Capacity
		case "iron":
			cost.Iron += name.Capacity
		case "wildfire":
			cost.Wildfire += name.Capacity
		}
	}

	return &cost, nil
}
