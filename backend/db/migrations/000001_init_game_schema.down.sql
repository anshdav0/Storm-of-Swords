
DROP TABLE IF EXISTS "army" CASCADE;
DROP TABLE IF EXISTS "troop_level_stat" CASCADE;
DROP TABLE IF EXISTS "village_building" CASCADE;
DROP TABLE IF EXISTS "battles" CASCADE;

--Drop building specialization tables
DROP TABLE IF EXISTS "producer_building" CASCADE;
DROP TABLE IF EXISTS "storage_building" CASCADE;
DROP TABLE IF EXISTS "defense_building" CASCADE;

--Drop base master tables (Parent tables)
DROP TABLE IF EXISTS "troop" CASCADE;
DROP TABLE IF EXISTS "building" CASCADE;
DROP TABLE IF EXISTS "village" CASCADE;
DROP TABLE IF EXISTS "player" CASCADE;

--Remove custom enumerated types
DROP TYPE IF EXISTS "resource_type";
DROP TYPE IF EXISTS "building_type";