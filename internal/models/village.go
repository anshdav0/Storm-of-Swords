package models

import (
	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
)

type Village struct {
	ID       int64  `json:"id"`
	Gold     int    `json:"gold"`
	Iron     int    `json:"iron"`
	Wildfire int    `json:"wildfire"`
	Level    int    `json:"level"`
	Layout   []byte `json:"layout"`
}

type VillageStore struct {
	store *db.Store
}

func NewVillageStore(store *db.Store) *VillageStore {
	return &VillageStore{store: store}
}

/*
func (vs *VillageStore) CreateVillage(ctx context.Context, playerID int64) (*Village, error) {
	query := `
	INSERT INTO village (id, gold, iron, wildfire, level,layout)
	VALUES ($1,0,0,0,1, '{}')
	RETURNING id, gold, iron, wildfire, level, layout
	`
	village := &Village{}
	err := vs.store.Pool.QueryRow(ctx, query, playerID).Scan(
		&village.ID,
		&village.Gold,
		&village.Iron,
		&village.Wildfire,
		&village.Level,
		&village.Layout,
	)
	if err != nil {
		return nil, fmt.Errorf("CreateVillage: %w", err)
	}
	return village, nil
}
*/
