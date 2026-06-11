package models

import (
	"context"
	"fmt"

	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
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

type VillageStore struct {
	store *db.Store
}

func NewVillageStore(store *db.Store) *VillageStore {
	return &VillageStore{store: store}
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

func (vs *VillageStore) Purchase(ctx context.Context, tx pgx.Tx, villageID int64, cost Cost) (bool, error) {
	var gold, iron, wildfire int

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

	if gold < cost.Gold || iron < cost.Iron || wildfire < cost.Wildfire {
		return false, fmt.Errorf("not enough resources")
	}

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
