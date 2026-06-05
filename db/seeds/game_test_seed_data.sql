-- db/seeds/initial_game_data.sql

-- ============================================================================
-- PHASE 1: STATIC GAME BALANCE DATA (BLUEPRINTS)
-- ============================================================================

-- Base Catalog of Buildings (Excluding Town Hall / Keep)
INSERT INTO "building" ("id", "building_name", "size_x", "size_y", "max_no_allowed", "type") VALUES
(1, 'Iron Mine',                   2, 2, 4, 'producer'),
(2, 'Alchemist Laboratory',         2, 2, 2, 'producer'),
(3, 'Barracks',                     3, 3, 2, 'producer'), 
(4, 'Armory (Upgrade Lab)',         3, 3, 1, 'storage'),  
(5, 'Army Camp',                    4, 4, 3, 'storage'),  
(6, 'Scorpion Bolt Launcher',       2, 2, 4, 'defense'),
(7, 'Wildfire Catapult',            3, 3, 2, 'defense')
ON CONFLICT ("id") DO NOTHING;

-- Base Catalog of Troops (Foot Variants)
INSERT INTO "troop" ("id", "type", "speed", "housing_space", "cost_gold", "cost_iron", "cost_wildfire", "dismounted_form_id") VALUES
(1, 'Unsullied Footman (Spear, Unarmored)',   14, 1, 60,  20,  0,  NULL),
(2, 'Unsullied Veteran (Spear, Armored)',     12, 1, 80,  60,  0,  NULL),
(3, 'Dothraki Foot-Screamer (Sword)',          18, 1, 50,  20,  0,  NULL),
(4, 'Dothraki Foot-Archer (Bow)',              18, 1, 55,  30,  0,  NULL),
(5, 'Westerosi Man-at-Arms (Sword, Unarmored)',12, 1, 40,  15,  0,  NULL),
(6, 'Westerosi Knight-Footman (Sword, Armored)',10, 1, 60,  50,  0,  NULL),
(7, 'Westerosi Archer (Bow, Unarmored)',       12, 1, 45,  25,  0,  NULL),
(8, 'Westerosi Marksman (Bow, Armored)',       10, 1, 65,  55,  0,  NULL),
(9, 'Grand Pyromancer (Staff, Unarmored)',     10, 2, 90,  10,  40, NULL),
(10, 'Battle Mage (Staff, Armored)',            8,  2, 110, 45,  50, NULL)
ON CONFLICT ("id") DO NOTHING;

-- Base Catalog of Troops (Mounted Variants linking to Dismounted Counterparts)
INSERT INTO "troop" ("id", "type", "speed", "housing_space", "cost_gold", "cost_iron", "cost_wildfire", "dismounted_form_id") VALUES
(11, 'Dothraki Vanguard (Sword, Mounted)',     24, 3, 100, 40,  0,  3), 
(12, 'Dothraki Horse-Archer (Bow, Mounted)',   24, 3, 110, 50,  0,  4), 
(13, 'Westerosi Raider (Sword, Mounted)',      20, 3, 90,  35,  0,  5), 
(14, 'Westerosi Cataphract (Sword, Mounted/Armored)', 16, 4, 140, 95,  0,  6), 
(15, 'Westerosi Mounted Bowman (Bow, Mounted)', 20, 3, 95,  45,  0,  7), 
(16, 'Westerosi Outrider (Staff, Mounted)',    18, 4, 150, 40,  60, 9)  
ON CONFLICT ("id") DO NOTHING;

-- Sub-Category: Producers
INSERT INTO "producer_building" ("id", "level", "resource_type", "production_rate", "production_cap", "hp", "upgrade_cost", "upgrade_time") VALUES
(1, 1, 'iron',     200,  600,   300,  150,  '1 minute'),
(1, 2, 'iron',     420,  1500,  360,  400,  '5 minutes'),
(1, 3, 'iron',     750,  3500,  430,  1200, '20 minutes'),
(1, 4, 'iron',     1200, 8000,  520,  3500, '1 hour'),
(2, 1, 'wildfire', 50,   150,   250,  300,  '3 minutes'),
(2, 2, 'wildfire', 120,  400,   310,  800,  '15 minutes'),
(2, 3, 'wildfire', 250,  1000,  380,  2000, '45 minutes'),
(2, 4, 'wildfire', 500,  2500,  460,  5000, '2 hours'),
(3, 1, 'none',       NULL, NULL,  400,  200,  '2 minutes'),
(3, 2, 'none',       NULL, NULL,  480,  600,  '10 minutes'),
(3, 3, 'none',       NULL, NULL,  570,  1500, '30 minutes'),
(3, 4, 'none',       NULL, NULL,  680,  4000, '1 hour'),
(4, 1, NULL,         0,    0,     500,  500,   '5 minutes'),
(4, 2, NULL,         0,    0,     620,  1500,  '30 minutes'),
(4, 3, NULL,         0,    0,     780,  4000,  '2 hours'),
(4, 4, NULL,         0,    0,     950,  12000, '6 hours')
ON CONFLICT ("id", "level") DO NOTHING;

-- Sub-Category: Storage
INSERT INTO "storage_building" ("id", "level", "resource_type", "capacity", "hp", "upgrade_cost", "upgrade_time") VALUES

(5, 1, 'none',       20,    350,  250,   '4 minutes'),
(5, 2, 'none',       30,    420,  750,   '15 minutes'),
(5, 3, 'none',       45,    500,  2000,  '1 hour'),
(5, 4, 'none',       60,    600,  5000,  '3 hours')
ON CONFLICT ("id", "level") DO NOTHING;

-- Sub-Category: Defenses
INSERT INTO "defense_building" ("id", "level", "damage_per_sec", "splash_rad", "range", "hp", "upgrade_cost", "upgrade_time") VALUES
(6, 1, 25,   NULL, 12,   450,  400,  '5 minutes'),
(6, 2, 40,   NULL, 12,   520,  1000, '15 minutes'),
(6, 3, 65,   NULL, 13,   610,  2500, '45 minutes'),
(6, 4, 95,   3,    14,   720,  6000, '2 hours'),
(7, 1, 35,   4,    10,   600,  1200, '20 minutes'),
(7, 2, 55,   4,    10,   690,  3000, '1 hour'),
(7, 3, 80,   5,    11,   800,  7000, '3 hours'),
(7, 4, 120,  5,    12,   950,  15000,'8 hours')
ON CONFLICT ("id", "level") DO NOTHING;

-- Troop Combat Stats & Unlocks
INSERT INTO "troop_level_stat" ("troop_id", "level", "hp", "damage", "cost_to_upgrade_gold", "cost_to_upgrade_iron", "cost_to_upgrade_wildfire", "unlocks_at_building_level") VALUES
(1,  1, 100, 15, 0,    0,    0,    1),
(1,  2, 120, 22, 500,  100,  0,    1),
(2,  1, 180, 28, 0,    0,    0,    2),
(2,  2, 220, 36, 1500, 500,  0,    3),
(3,  1, 90,  20, 0,    0,    0,    1),
(3,  2, 110, 28, 600,  150,  0,    2),
(4,  1, 85,  18, 0,    0,    0,    2),
(5,  1, 110, 14, 0,    0,    0,    1),
(6,  1, 190, 22, 0,    0,    0,    2),
(7,  1, 95,  18, 0,    0,    0,    2),
(8,  1, 150, 25, 0,    0,    0,    3),
(9,  1, 80,  40, 0,    0,    0,    3),
(10, 1, 140, 55, 0,    0,    0,    4),
(11, 1, 210, 35, 0,    0,    0,    3),
(11, 2, 260, 48, 4000, 1200, 0,    4),
(12, 1, 190, 30, 0,    0,    0,    3),
(13, 1, 230, 25, 0,    0,    0,    3),
(14, 1, 350, 42, 0,    0,    0,    4),
(15, 1, 210, 28, 0,    0,    0,    4),
(16, 1, 180, 65, 0,    0,    0,    4)
ON CONFLICT ("troop_id", "level") DO NOTHING;


-- ============================================================================
-- PHASE 2: INSTANCE VARIABLE MOCK DATA (PLAYER DEPENDENT)
-- ============================================================================

-- 1. Create Active Players
-- Note: Raw strings used for pass_hash (mock bcrypt indicators for local sandbox testing)
INSERT INTO "player" ("id", "username", "pass_hash", "trophies") VALUES
(1, 'JonSnow_99',    'mock_hash_stark_long_string_value_abc123', 1250),
(2, 'Lannister_Gold', 'mock_hash_lannister_long_string_value_xyz789', 2400),
(3, 'Daenerys_Storm', 'mock_hash_targaryen_long_string_value_def456', 850)
ON CONFLICT ("id") DO NOTHING;

-- 2. Create Corresponding Player Villages
-- Fixed Townhall Level parameter managed here. Layout references grid coordinates.
INSERT INTO "village" ("id", "gold", "iron", "wildfire", "level", "layout") VALUES
(1, 4500, 2500, 300, 3, '{
  "townhall": {"x": 20, "y": 20},
  "placement_matrix": [
    {"building_instance_id": 1, "x": 10, "y": 12},
    {"building_instance_id": 2, "x": 15, "y": 15}
  ]
}'),
(2, 95000, 40000, 8000, 4, '{
  "townhall": {"x": 20, "y": 20},
  "placement_matrix": [
    {"building_instance_id": 3, "x": 8, "y": 9},
    {"building_instance_id": 4, "x": 14, "y": 2}
  ]
}'),
(3, 1200, 800, 1500, 1, '{
  "townhall": {"x": 20, "y": 20},
  "placement_matrix": []
}')
ON CONFLICT ("id") DO NOTHING;

-- 3. Populate Structures Owned by Villages (village_building)
INSERT INTO "village_building" ("id", "village_id", "building_id", "level", "current_hp", "last_collected", "upgrade_started") VALUES
-- Jon Snow's Village Assets
(1, 1, 2, 2, 360, NOW() - INTERVAL '2 hours', NULL), -- Lvl 2 Iron mine, partially filled
(2, 1, 7, 1, 450, NULL,                        NULL), -- Lvl 1 Scorpion Launcher guarding perimeter

-- Lannister Player Assets
(3, 2, 2, 4, 520, NOW() - INTERVAL '15 minutes', NULL), -- Max Lvl 4 Iron Mine
(4, 2, 7, 3, 800, NULL,                          NOW() - INTERVAL '10 minutes') -- Catapult actively upgrading
ON CONFLICT ("id") DO NOTHING;

-- 4. Seed Standing Active Armies
INSERT INTO "army" ("village_id", "troop_id", "quantity", "level") VALUES
-- Jon Snow has 15 Base Unsullied and 5 Mounted Dothraki Screamer Outriders ready
(1, 1,  15, 1),
(1, 11, 5,  1),
(2, 2,  40, 2), -- 40 Armored Veteran Unsullied
(2, 14, 10, 1)  -- 10 Heavy Mounted Cataphract Knights
ON CONFLICT ("village_id", "troop_id") DO NOTHING;

-- 5. Seed Historical Combat Records
INSERT INTO "battles" ("id", "attacker_id", "defender_id", "trophies_gained", "star_earned", "gold_looted", "iron_looted", "took_place", "replay_data") VALUES
(1, 2, 1, 24, 3, 3500, 1200, NOW() - INTERVAL '1 day', '{
  "deployment_sequence": [
    {"timestamp": 4, "troop_id": 14, "grid_x": 5, "grid_y": 10},
    {"timestamp": 12, "troop_id": 2, "grid_x": 6, "grid_y": 10}
  ],
  "outcome_summary": "Complete eradication of defensive lines via heavy cavalry shock tactics."
}')
ON CONFLICT ("id") DO NOTHING;