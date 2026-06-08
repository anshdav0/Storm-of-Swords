package models

import (
	"context"
	"fmt"
	"time"

	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
	"github.com/jackc/pgx/v5"
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

func (ps *PlayerStore) CreatePlayer(ctx context.Context, username, passhash string) (*Player, error) {
	query := `
	INSERT INTO player (username, pass_hash)
	VALUES ($1, $2)
	RETURNING id, username, pass_hash, trophies, created_at
	`

	player := &Player{}
	err := ps.store.Pool.QueryRow(ctx, query, username, passhash).Scan(
		&player.ID,
		&player.Username,
		&player.PassHash,
		&player.Trophies,
		&player.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("CreatePlayer: %w", err)
	}
	return player, nil
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
