package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectDB initializes a connection pool with pgdb using its url
func ConnectDB(DBURL string) (*pgxpool.Pool, error) {
	// Context with timeout made
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel() //cancel it at the end

	// Parse the url string in config
	config, err := pgxpool.ParseConfig(DBURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database url: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnIdleTime = 12 * time.Minute

	// Establish the connection pool
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	log.Println("Successfully connected to the database and initialized connection pool")
	return pool, nil
}
