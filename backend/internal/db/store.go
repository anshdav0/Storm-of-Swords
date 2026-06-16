package db

import "github.com/jackc/pgx/v5/pgxpool"

// creating a struct. so I can use the pool as a struct
type Store struct {
	Pool *pgxpool.Pool
}

// constructor of Store
func MakeStore(pool *pgxpool.Pool) *Store {
	return &Store{Pool: pool}
}
