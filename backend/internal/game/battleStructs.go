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

type SimBuilding struct {
	VillageBuildingID int64
	BuildingType      string
	CenterX           float64
	CentreY           float64
	CurrentHP         int
	DPS               int
	Range             float64
	SplashRad         float64
	Destroyed         bool
}

type SimTroop struct {
	InstanceID int
	TroopID    int64
	TroopType  string
	X          float64
	Y          float64
	CurrentHP  int
	Damage     int
	Speed      float64
	Dead       bool
}

type BattleState struct {
	CurrentTime float64
	Buildings   []SimBuilding
	Troops      []SimTroop
}

type EventType string

const (
	EventTroopMoved        EventType = "troop_moved"
	EventTroopDamaged      EventType = "troop_damaged"
	EventTroopDied         EventType = "troop_died"
	EventBuildingDamaged   EventType = "building_damaged"
	EventBuildingDestroyed EventType = "building_destroyed"
)

type BattleEvent struct {
	Time              float64   `json:"t"`
	Type              EventType `json:"type"`
	TroopInstanceID   int       `json:"troop_instance_id,omitempty"`
	ToX               float64   `json:"to_x,omitempty"`
	ToY               float64   `json:"to_y,omitempty"`
	VillageBuildingID int64     `json:"village_building_id,omitempty"`
	Damage            int       `json:"damage,omitempty"`
	HPLefft           int       `json:"hp_left,omitempty"`
}
