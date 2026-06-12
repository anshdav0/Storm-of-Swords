package models

import (
	"time"

	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
)

type VillageBuilding struct {
	ID           int64  `json:"id"`
	VillageID    int64  `json:"village_id"`
	BuildingID   int64  `json:"building_id"`
	BuildingName string `json:"building_name"`
	SizeX        int    `json:"size_x"`
	SizeY        int    `json:"size_y"`
	MaxNoAllowed int    `json:"max_no_allowed"`
	Type         string `json:"type"`

	Level          int           `json:"level"`
	XCor           *int          `json:"x_cor"`
	YCor           *int          `json:"y_cor"`
	CurrentHP      int           `json:"current_hp"`
	UpgradeCost    int           `json:"upgrade_cost"`
	UpgradeStarted *time.Time    `json:"upgrade_started"`
	UpgradeTime    time.Duration `json:"upgrade_time"`
}

type ProducerBuilding struct {
	VillageBuilding
	ResourceType   string     `json:"resource_type"`
	ProductionRate int        `json:"production_rate"`
	ProductionCap  int        `json:"production_cap"`
	LastCollected  *time.Time `json:"last_collected"`
}

type DefenseBuilding struct {
	VillageBuilding
	DPS       int `json:"damage_per_sec"`
	SplashRad int `json:"splash_rad"`
	Range     int `json:"range"`
}

type StorageBuilding struct {
	VillageBuilding
	ResourceType string `json:"resource_type"`
	Capacity     int    `json:"capacity"`
}

type BuildPlacement struct {
	VillageBuildingID int64 `json:"village_building_id"`
	XCor              int   `json:"x_cor"`
	YCor              int   `json:"y_cor"`
}

type SaveLayoutRequest struct {
	Placements []BuildPlacement `json:"placements"`
}

type BuildingStore struct {
	store *db.Store
}

func NewBuildingStore(store *db.Store) *BuildingStore {
	return &BuildingStore{store: store}
}
