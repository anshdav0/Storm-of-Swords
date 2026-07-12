# Storm of Swords

A Clash of Clans-style village builder and battle game set in the world of A Song of Ice and Fire. Go backend, React + TypeScript frontend, PostgreSQL.

## How to install and run

You should have Docker and Docker Compose installed.

1. Clone the repo

```
git clone https://github.com/anshdav0/Storm-of-Swords
cd Storm-of-Swords
```

2. Start everything

```
docker compose up --build
```
or

```
make up
```

This builds and starts three containers — Postgres, the Go backend, and the React frontend. Migrations and seed data run automatically on startup, you don't need to do anything else.

3. Open a browser to `http://localhost:3000`

The API runs on `http://localhost:8080`.

In case you get an error about ports not being available, make sure `localhost:3000`, `:8080`, and `:5432` are free on your machine before starting.

### Stopping

```
docker compose down
```

To wipe the database and start fresh:

```
docker compose down -v
```
or

```
make clean
```

### Running tests

```
go test ./... -v
```

or

```
make test
```

## Tech stack

Backend: Go, gorilla/mux, pgx/v5, JWT auth, bcrypt, golang-migrate
Frontend: React, TypeScript, Vite, TanStack Query, Zustand, Axios
Database: PostgreSQL
Infra: Docker, Docker Compose

## Project structure backend

```
backend/
  cmd/server/        — entry point
  internal/
    models/           — data access + business logic
    controller/        — HTTP handlers
    middleware/         — JWT auth
    game/               — battle simulation engine (pure, no DB)
  db/
    migrations/         — schema migrations
    seeds/              — initial game data
```

## Notes

The battle engine is fully deterministic — given the same starting conditions it always produces the same outcome, so only the initial deployment + village snapshot get stored per battle, not the full event log. The frontend replays a battle by re-running the same data it already received.

Troops and buildings each run their own independent behavior each simulated tick (move toward nearest target, attack, retarget if destroyed) rather than a single function deciding the outcome.

Some premade users are One, Beat, Bee, How, Indiana, Gum, Wow
The password is same as username for all.
