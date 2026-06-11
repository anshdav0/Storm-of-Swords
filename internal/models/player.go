package models

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
)

// Struct corresponding to player table
type Player struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	PassHash  string    `json:"-"`
	Trophies  int       `json:"trophies"`
	CreatedAt time.Time `json:"created_at"`
}

type PlayerStore struct {
	store *db.Store
}

func NewPlayerStore(store *db.Store) *PlayerStore {
	return &PlayerStore{store: store}
}

// create a player and a village simultaneously as a transaction as one cant exist without other
func (ps *PlayerStore) CreatePlayerandVillage(ctx context.Context, username, passhash string) (*Player, *Village, error) {

	tx, err := ps.store.Pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("began transaction: %w", err)
	}

	defer tx.Rollback(ctx) //ends at the end
	//player creation
	query := `
	INSERT INTO player (username, pass_hash)
	VALUES ($1, $2)
	RETURNING id, username, pass_hash, trophies, created_at
	`

	player := &Player{}
	village := &Village{}
	err = tx.QueryRow(ctx, query, username, passhash).Scan(
		&player.ID,
		&player.Username,
		&player.PassHash,
		&player.Trophies,
		&player.CreatedAt,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("CreatePlayer: %w", err)
	}

	//village creation
	query = `
	INSERT INTO village (id, gold, iron, wildfire, level,layout)
	VALUES ($1,0,0,0,1, '{}')
	RETURNING id, gold, iron, wildfire, level
	`
	err = tx.QueryRow(ctx, query, player.ID).Scan(
		&village.ID,
		&village.Gold,
		&village.Iron,
		&village.Wildfire,
		&village.Level,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("CreateVillage: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, nil, fmt.Errorf("commit transaction: %w", err)
	}

	return player, village, nil
}

func (ps *PlayerStore) FindUser(ctx context.Context, username string) (*Player, bool, error) {
	query := `
	SELECT id, username, pass_hash, trophies, created_at
	FROM player
	WHERE username = $1
	`
	player := &Player{}
	err := ps.store.Pool.QueryRow(ctx, query, username).Scan(
		&player.ID,
		&player.Username,
		&player.PassHash,
		&player.Trophies,
		&player.CreatedAt,
	)

	exists := true
	if err != nil {
		if err == pgx.ErrNoRows {
			exists = false
			return nil, exists, nil
		}
		return nil, exists, fmt.Errorf("FindUser: %w", err)
	}
	return player, exists, nil
}
