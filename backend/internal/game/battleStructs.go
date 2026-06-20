package game

type DeployedTroop struct {
	TroopID   int64   `json:"troop_id"`
	TroopType string  `json:"troop_type"`
	Quantity  int     `json:"quantity"`
	X         int     `json:"x"`
	Y         int     `json:"y"`
	HP        int     `json:"hp"`
	Damage    int     `json:"damage"`
	Speed     float64 `json:"speed"`
}

type OpponentBuilding struct {
	VillageBuildingID int64   `json:"village_building_id"`
	BuildingName      string  `json:"building_name"`
	BuildingType      string  `json:"building_type"`
	XCor              int     `json:"x_cor"`
	YCor              int     `json:"y_cor"`
	SizeX             int     `json:"size_x"`
	SizeY             int     `json:"size_y"`
	CurrentHP         int     `json:"current_hp"`
	DPS               int     `json:"damage_per_sec"`
	Range             float64 `json:"range"`
	SplashRad         float64 `json:"splash_rad"`
}

type BattleInput struct {
	DefenderSnapshot   []OpponentBuilding `json:"opponent_building"`
	AttackerDeployment []DeployedTroop    `json:"attacker_deployment"`
}
