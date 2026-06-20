// Auth
export interface AuthResponse {
  token: string;
  player_id: number;
  username: string;
}

// Village
export interface Village {
  id: number;
  gold: number;
  iron: number;
  wildfire: number;
  level: number;
}

export interface VillageBuilding {
  id: number;
  village_id: number;
  building_id: number;
  building_name: string;
  size_x: number;
  size_y: number;
  max_no_allowed: number;
  type: "defense" | "storage" | "producer";
  level: number;
  x_cor: number;
  y_cor: number;
  current_hp: number;
  upgrade_cost: number;
  upgrade_started: string | null;
  upgrade_time: string;
}

export interface DefenseBuilding extends VillageBuilding {
  damage_per_sec: number;
  splash_rad: number;
  range: number;
}

export interface StorageBuilding extends VillageBuilding {
  resource_type: "gold" | "iron" | "wildfire" | "none";
  capacity: number;
}

export interface ProducerBuilding extends VillageBuilding {
  resource_type: "gold" | "iron" | "wildfire" | "none";
  production_rate: number;
  production_cap: number;
  last_collected: string | null;
}

export interface VillageResponse {
  village: Village;
  defense_building: DefenseBuilding[];
  storage_building: StorageBuilding[];
  producer_building: ProducerBuilding[];
}

export interface BuildPlacement {
  village_building_id: number;
  x_cor: number;
  y_cor: number;
}

// Army
export interface FightingTroop {
  id: number;
  type: string;
  speed: number;
  level: number;
  hp: number;
  damage: number;
  dismounted_form_id: number | null;
}

export interface ArmyEntry {
  troop: FightingTroop;
  quantity: number;
}

export interface RecruitResult {
  troop_id: number;
  troop_type: string;
  quantity: number;
  recruit_level: number;
}

// Resources
export interface CollectResult {
  resource_type: "gold" | "iron" | "wildfire";
  collected: number;
  new_total: number;
}

export interface TroopTemplate {
  id: number;
  type: string;
  speed: number;
  housing_space: number;
  cost_gold: number;
  cost_iron: number;
  cost_wildfire: number;
  dismounted_form_id: number | null;
  level: number;
  hp: number;
  damage: number;
  unlocks_at_building_level: number;
}

// Battle

export interface OpponentPreview {
    player_id: number
    username:  string
    trophies:  number
}

export interface OpponentBuilding {
    village_building_id: number
    building_name:       string
    building_type:       string
    x_cor:                number
    y_cor:                number
    size_x:               number
    size_y:               number
    current_hp:           number
    damage_per_sec:       number
    range:                number
    splash_rad:           number
}

export interface DeployedTroop {
    troop_id:   number
    troop_type: string
    quantity:   number
    x:          number
    y:          number
    hp:         number
    damage:     number
    speed:      number
}

export interface BattleInput {
    defender_snapshot:   OpponentBuilding[]
    attacker_deployment: DeployedTroop[]
}

export type BattleEventType =
    | "troop_moved"
    | "troop_damaged"
    | "troop_died"
    | "building_damaged"
    | "building_destroyed"

export interface BattleEvent {
    t:                    number
    type:                 BattleEventType
    troop_instance_id?:   number
    to_x?:                number
    to_y?:                number
    village_building_id?: number
    damage?:              number
    hp_left?:             number
}

export interface BattleResponse {
    battle_id:       number
    stars_earned:    number
    trophies_gained: number
    gold_looted:     number
    iron_looted:     number
    wildfire_looted: number
    events:          BattleEvent[]
    replay_input:    BattleInput
}

export interface DeploymentRequest {
    troop_id: number
    quantity: number
    x:        number
    y:        number
}