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
