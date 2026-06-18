export interface BuildingLevelStat {
  level: number;
  hp: number;
  upgrade_cost: number;
  upgrade_time: string;
  damage_per_sec?: number;
  splash_rad?: number;
  range?: number;
  capacity?: number;
  resource_type?: string;
  production_rate?: number;
  production_cap?: number;
}

export interface BuildingStatic {
  building_id: number;
  building_name: string;
  type: "defense" | "storage" | "producer";
  size_x: number;
  size_y: number;
  max_no_allowed: number;
  levels: BuildingLevelStat[];
}

export interface TroopLevelStat {
  level: number;
  hp: number;
  damage: number;
  unlocks_at_building_level: number;
}

export interface TroopStatic {
  troop_id: number;
  type: string;
  speed: number;
  housing_space: number;
  cost_gold: number;
  cost_iron: number;
  cost_wildfire: number;
  dismounted_form_id: number | null;
  levels: TroopLevelStat[];
}

export interface GameData {
  buildings: BuildingStatic[];
  troops: TroopStatic[];
}
