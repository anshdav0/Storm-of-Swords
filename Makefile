.PHONY: up down test build seed logs clean

up:
	docker compose up --build

down:
	docker compose down

test:
	go test ./... -v

build:
	go build -o ./bin/server ./cmd/server

seed:
	psql "$(DATABASE_URL)" -f ./db/seeds/initial_game_data.sql

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf ./bin ./tmp