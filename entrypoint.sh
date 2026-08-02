#!/bin/bash
set -e

echo "Waiting for Postgres to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
    sleep 1
done

echo "Running migrations..."
migrate -path ./db/migrations -database "$DATABASE_URL" up

echo "Checking if seed data is needed..."
ROW_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM village_building;")
if [ "$ROW_COUNT" -eq 0 ]; then
  echo "Seeding game data..."
  psql "$DATABASE_URL" -f ./db/seeds/game_test_seed_data1.sql
else
  echo "Seed data already present, skipping."
fi

echo "Starting server..."
exec ./server