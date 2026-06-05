
--ENUMS
CREATE TYPE "building_type" AS ENUM (
  'defense',
  'storage',
  'producer'
);

CREATE TYPE "resource_type" AS ENUM (
  'gold',
  'iron',
  'wildfire'
  'none'
);


--Main data about player
CREATE TABLE "player" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(64) UNIQUE NOT NULL,
  "pass_hash" VARCHAR(255) NOT NULL,
  "trophies" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT (NOW())
);

CREATE TABLE "village" (
  "id" BIGSERIAL PRIMARY KEY,
  "gold" INT NOT NULL DEFAULT 0,
  "iron" INT NOT NULL DEFAULT 0,
  "wildfire" INT NOT NULL DEFAULT 0,
  "level" INT NOT NULL DEFAULT 1,
  "layout" JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE "battles" (
  "id" BIGSERIAL PRIMARY KEY,
  "attacker_id" BIGINT NOT NULL,
  "defender_id" BIGINT NOT NULL,
  "trophies_gained" INT NOT NULL DEFAULT 0,
  "star_earned" INT NOT NULL DEFAULT 0,
  "gold_looted" INT NOT NULL DEFAULT 0,
  "iron_looted" INT NOT NULL DEFAULT 0,
  "took_place" TIMESTAMPTZ NOT NULL DEFAULT (NOW()),
  "replay_data" JSONB
);


--Building static data
CREATE TABLE "building" (
  "id" BIGSERIAL PRIMARY KEY,
  "building_name" VARCHAR(64) NOT NULL,
  "size_x" INT NOT NULL,
  "size_y" INT NOT NULL,
  "max_no_allowed" INT NOT NULL,
  "type" building_type NOT NULL
);

CREATE TABLE "defense_building" (
  "id" BIGINT,
  "level" INT,
  "damage_per_sec" INT NOT NULL,
  "splash_rad" INT,
  "range" INT NOT NULL,
  "hp" INT NOT NULL,
  "upgrade_cost" INT,
  "upgrade_time" interval,
  PRIMARY KEY ("id", "level")
);

CREATE TABLE "storage_building" (
  "id" BIGINT,
  "level" INT,
  "resource_type" resource_type NOT NULL,
  "capacity" INT NOT NULL,
  "hp" INT NOT NULL,
  "upgrade_cost" INT,
  "upgrade_time" interval,
  PRIMARY KEY ("id", "level")
);

CREATE TABLE "producer_building" (
  "id" BIGINT,
  "level" INT,
  "resource_type" resource_type NOT NULL,
  "production_rate" INT NOT NULL,
  "production_cap" INT NOT NULL,
  "hp" INT NOT NULL,
  "upgrade_cost" INT,
  "upgrade_time" interval,
  PRIMARY KEY ("id", "level")
);


--Building player specific data
CREATE TABLE "village_building" (
  "id" BIGSERIAL PRIMARY KEY,
  "village_id" BIGINT NOT NULL,
  "building_id" BIGINT NOT NULL,
  "level" INT NOT NULL DEFAULT 1,
  "current_hp" INT NOT NULL,
  "last_collected" TIMESTAMPTZ,
  "upgrade_started" TIMESTAMPTZ
);


--Troop static data
CREATE TABLE "troop" (
  "id" BIGSERIAL PRIMARY KEY,
  "type" VARCHAR(64) NOT NULL,
  "speed" INT NOT NULL,
  "housing_space" INT NOT NULL,
  "cost_gold" INT NOT NULL,
  "cost_iron" INT NOT NULL,
  "cost_wildfire" INT NOT NULL,
  "dismounted_form_id" BIGINT
);

CREATE TABLE "troop_level_stat" (
  "troop_id" BIGINT NOT NULL,
  "level" INT NOT NULL,
  "hp" INT NOT NULL,
  "damage" INT NOT NULL,
  "cost_to_upgrade_gold" INT NOT NULL,
  "cost_to_upgrade_iron" INT NOT NULL,
  "cost_to_upgrade_wildfire" INT NOT NULL,
  "unlocks_at_building_level" INT NOT NULL,
  PRIMARY KEY ("troop_id", "level")
);


--Troop player specific data
CREATE TABLE "army" (
  "village_id" BIGINT NOT NULL,
  "troop_id" BIGINT NOT NULL,
  "quantity" INT NOT NULL DEFAULT 0,
  "level" INT NOT NULL DEFAULT 1,
  PRIMARY KEY ("village_id", "troop_id")
);

CREATE INDEX "idx_battles_attacker" ON "battles" ("attacker_id");

CREATE INDEX "idx_battles_defender" ON "battles" ("defender_id");

CREATE INDEX "idx_village_building_vid" ON "village_building" ("village_id");

CREATE INDEX "idx_village_building_bid" ON "village_building" ("building_id");

CREATE INDEX "idx_troop_dismounted" ON "troop" ("dismounted_form_id");

CREATE INDEX "idx_army_village" ON "army" ("village_id");

CREATE INDEX "idx_army_troop" ON "army" ("troop_id");

ALTER TABLE "village" ADD FOREIGN KEY ("id") REFERENCES "player" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "battles" ADD FOREIGN KEY ("attacker_id") REFERENCES "player" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "battles" ADD FOREIGN KEY ("defender_id") REFERENCES "player" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "defense_building" ADD FOREIGN KEY ("id") REFERENCES "building" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "storage_building" ADD FOREIGN KEY ("id") REFERENCES "building" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "producer_building" ADD FOREIGN KEY ("id") REFERENCES "building" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "village_building" ADD FOREIGN KEY ("village_id") REFERENCES "village" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "village_building" ADD FOREIGN KEY ("building_id") REFERENCES "building" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "troop" ADD FOREIGN KEY ("dismounted_form_id") REFERENCES "troop" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "troop_level_stat" ADD FOREIGN KEY ("troop_id") REFERENCES "troop" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "army" ADD FOREIGN KEY ("village_id") REFERENCES "village" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "army" ADD FOREIGN KEY ("troop_id") REFERENCES "troop" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;