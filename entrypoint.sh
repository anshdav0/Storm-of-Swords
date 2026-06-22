#!/bin/sh
# The line above tells Linux "run this file using the sh program."
# Without this exact first line, the file wouldn't be recognized
# as an executable script at all.

# "set -e" means: if ANY command in this script fails (returns an
# error), stop immediately instead of continuing on blindly. This
# prevents the server from starting against a half-broken database.
set -e

echo "Waiting for Postgres to be ready..."
# pg_isready checks "is the database actually accepting connections
# yet?" Postgres takes a few seconds to fully start up — without this
# loop, your Go server might try to connect before Postgres is ready
# and crash immediately on startup.
# $DB_HOST, $DB_PORT, $DB_USER are environment variables — values
# that get INJECTED from docker-compose.yml when the container starts,
# not hardcoded here. This is how the same script works whether the
# database happens to be at a different address.
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
    sleep 1
done

echo "Running migrations..."
# Applies every .sql file in db/migrations, in order, to bring the
# database schema up to date. $DATABASE_URL is another environment
# variable injected by docker-compose.yml.
migrate -path ./db/migrations -database "$DATABASE_URL" up

echo "Seeding game data..."
# Runs your seed file. Since your seed file uses
# "ON CONFLICT ... DO NOTHING" everywhere, running this repeatedly
# on every container restart is completely safe — it won't create
# duplicate rows.
psql "$DATABASE_URL" -f ./db/seeds/initial_game_data.sql

echo "Starting server..."
# "exec" replaces THIS script process with the server process
# entirely, rather than running it as a sub-process. This matters
# because it means Docker's stop/restart signals go directly to your
# actual Go server, not to this shell script wrapping it.
exec ./server