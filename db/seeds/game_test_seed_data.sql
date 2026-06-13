-- db/seeds/initial_game_data.sql

-- ============================================================================
-- PHASE 1: STATIC GAME BALANCE DATA (BLUEPRINTS)
-- ============================================================================

-- Base Catalog of Buildings (Excluding Town Hall / Keep)
INSERT INTO "building" ("id", "building_name", "size_x", "size_y", "max_no_allowed", "type") VALUES
(1, 'Iron Mine',                    2, 2, 2, 'producer'),
(2, 'Alchemist Laboratory',         2, 2, 1, 'producer'),
(3, 'Barracks',                     3, 3, 1, 'producer'),
(4, 'Armory (Upgrade Lab)',         3, 3, 1, 'storage'),
(5, 'Army Camp',                    4, 4, 3, 'storage'),
(6, 'Scorpion Bolt Launcher',       2, 2, 3, 'defense'),
(7, 'Wildfire Catapult',            3, 3, 2, 'defense'),
(8, 'Gold Mine',                    2, 2, 2, 'producer'),
(9, 'Gold Storage',                 2, 2, 2, 'storage'),
(10,'Iron Storage',                 2, 2, 2, 'storage'),
(11,'Wildfire Storage',             2, 2, 1, 'storage'),
(12, 'Main Castle',                 4, 4, 1, 'storage')
ON CONFLICT ("id") DO NOTHING;


-- Sub-Category: Producers
INSERT INTO "producer_building" ("id", "level", "resource_type", "production_rate", "production_cap", "hp", "upgrade_cost", "upgrade_time") VALUES
(1, 1, 'iron',      200,   600,   300,  150,  '1 minute'),
(1, 2, 'iron',      420,   1500,  360,  400,  '5 minutes'),
(1, 3, 'iron',      750,   3500,  430,  1200, '20 minutes'),
(8, 1, 'gold',      200,   600,   300,  150,  '1 minute'),
(8, 2, 'gold',      420,   1500,  360,  400,  '5 minutes'),
(8, 3, 'gold',      750,   3500,  430,  1200, '20 minutes'),
(2, 1, 'wildfire',  50,    150,   250,  300,  '3 minutes'),
(2, 2, 'wildfire',  120,   400,   310,  800,  '15 minutes'),
(2, 3, 'wildfire',  250,   1000,  380,  2000, '45 minutes'),
(3, 1, 'none',       NULL, NULL,  400,  200,  '2 minutes'),
(3, 2, 'none',       NULL, NULL,  480,  600,  '10 minutes'),
(3, 3, 'none',       NULL, NULL,  570,  1500, '30 minutes'),
(4, 1, NULL,         0,    0,     500,  500,   '5 minutes'),
(4, 2, NULL,         0,    0,     620,  1500,  '30 minutes'),
(4, 3, NULL,         0,    0,     780,  4000,  '2 hours')
ON CONFLICT ("id", "level") DO NOTHING;

-- Sub-Category: Storage
INSERT INTO "storage_building" ("id", "level", "resource_type", "capacity", "hp", "upgrade_cost", "upgrade_time") VALUES

(5,  1, 'none',           20,    350,  250,   '1 minutes'),
(5,  2, 'none',           30,    420,  750,   '5 minutes'),
(5,  3, 'none',           45,    500,  2000,  '10 minutes'),
(9,  1, 'gold',           100,   350,  250,   '1 minutes'),
(9,  2, 'gold',           150,   420,  750,   '5 minutes'),
(9,  3, 'gold',           175,   500,  2000,  '10 minutes'),
(10, 1, 'iron',           100,   350,  250,   '1 minutes'),
(10, 2, 'iron',           150,   420,  750,   '5 minutes'),
(10, 3, 'iron',           175,   500,  2000,  '10 minutes'),
(11, 1, 'wildfire',       100,   350,  250,   '1 minutes'),
(11, 2, 'wildfire',       150,   420,  750,   '5 minutes'),
(11, 3, 'wildfire',       175,   500,  2000,  '10 minutes'),
(12, 1, 'iron',           900,   700,  0,  '0 minutes'),
(12, 2, 'iron',           1500,  800,  2000,  '5 minutes'),
(12, 3, 'iron',           2000,  1000, 2500,  '10 minutes')
ON CONFLICT ("id", "level") DO NOTHING;

-- Sub-Category: Defenses
INSERT INTO "defense_building" ("id", "level", "damage_per_sec", "splash_rad", "range", "hp", "upgrade_cost", "upgrade_time") VALUES
(6, 1, 25,   NULL, 12,   450,  400,  '5 minutes'),
(6, 2, 40,   NULL, 12,   520,  1000, '15 minutes'),
(6, 3, 65,   3,    13,   610,  2500, '45 minutes'),
(7, 1, 35,   4,    10,   600,  1200, '20 minutes'),
(7, 2, 55,   4,    10,   690,  3000, '1 hour'),
(7, 3, 80,   5,    11,   800,  7000, '3 hours')
ON CONFLICT ("id", "level") DO NOTHING;



-- Base Catalog of Troops (Foot Variants)
INSERT INTO "troop" ("id", "type", "speed", "housing_space", "cost_gold", "cost_iron", "cost_wildfire", "dismounted_form_id") VALUES
(1, 'Unsullied Footman (Spear, Unarmored)',    14, 1, 60,  20,  0,  NULL),
(2, 'Unsullied Veteran (Spear, Armored)',      12, 1, 80,  60,  0,  NULL),
(3, 'Dothraki Foot-Screamer (Sword)',          18, 1, 50,  20,  0,  NULL),
(5, 'Westerosi Man-at-Arms (Sword, Unarmored)',12, 1, 40,  15,  0,  NULL),
(7, 'Westerosi Archer (Bow, Unarmored)',       12, 1, 45,  25,  0,  NULL),
(8, 'Westerosi Marksman (Bow, Armored)',       10, 1, 65,  55,  0,  NULL),
(9, 'Grand Pyromancer (Staff, Unarmored)',     10, 2, 90,  10,  40, NULL),
(10, 'Battle Mage (Staff, Armored)',            8,  2, 110, 45,  50, NULL)
ON CONFLICT ("id") DO NOTHING;

-- Base Catalog of Troops (Mounted Variants linking to Dismounted Counterparts)
INSERT INTO "troop" ("id", "type", "speed", "housing_space", "cost_gold", "cost_iron", "cost_wildfire", "dismounted_form_id") VALUES
(11, 'Dothraki Vanguard (Sword, Mounted)',     24, 3, 100, 40,  0,  3), 
(13, 'Westerosi Raider (Sword, Mounted)',      20, 3, 90,  35,  0,  5), 
(14, 'Westerosi Cataphract (Sword, Mounted/Armored)', 16, 4, 140, 95,  0,  5), 
(16, 'Westerosi Outrider (Staff, Mounted)',    18, 4, 150, 40,  60, 9)  
ON CONFLICT ("id") DO NOTHING;


-- Troop Combat Stats & Unlocks
INSERT INTO "troop_level_stat" ("troop_id", "level", "hp", "damage", "unlocks_at_building_level") VALUES
(1,  1, 100, 15,  1),
(1,  2, 120, 22,  2),
(2,  1, 180, 28,  2),
(2,  2, 220, 36,  3),
(3,  1, 90,  20,  2),
(3,  2, 110, 28,  2),
(5,  1, 110, 14,  1),
(5,  2, 115, 18,  2),
(7,  1, 95,  18,  2),
(8,  1, 150, 25,  2),
(9,  1, 80,  40,  2),
(10, 1, 140, 55,  2),
(11, 1, 210, 35,  3),
(11, 2, 260, 48,  3),
(13, 1, 230, 25,  3),
(14, 1, 350, 42,  3),
(16, 1, 180, 65,  3)
ON CONFLICT ("troop_id", "level") DO NOTHING;
