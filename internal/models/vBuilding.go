package models

import (
	"context"
	"fmt"
	"time"
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

func (bs *BuildingStore) GetDefBuilds(ctx context.Context, villageID int64) ([]DefenseBuilding, error) {
	query := `
		SELECT
			vb.id, vb.village_id, vb.building_id, vb.level, vb.x_cor, vb.y_cor, vb.current_hp, vb.upgrade_started, b.building_name, b.size_x, b.size_y, b.max_no_allowed, b.type, db.damage_per_sec, db.splash_rad, db.range, db.upgrade_cost, db.upgrade_time
		FROM village_building vb
		JOIN building b on b.id = vb.building_id
		JOIN defense_building db ON db.id = vb.building_id AND db.level = vb.level
		WHERE vb.village_id = $1
		AND b.type = 'defense'
	`
	rows, err := bs.store.Pool.Query(ctx, query, villageID)
	if err != nil {
		return nil, fmt.Errorf("GetDefBuilds: %w", err)
	}
	defer rows.Close()

	buildings := make([]DefenseBuilding, 0)
	for rows.Next() {
		var d DefenseBuilding
		err := rows.Scan(&d.ID, &d.VillageID, &d.BuildingID, &d.Level, &d.XCor, &d.YCor, &d.CurrentHP, &d.UpgradeStarted, &d.BuildingName, &d.SizeX, &d.SizeY, &d.MaxNoAllowed, &d.Type, &d.DPS, &d.SplashRad, &d.Range, &d.UpgradeCost, &d.UpgradeTime)
		if err != nil {
			return nil, fmt.Errorf("GetDefBuilds scan: %w", err)
		}
		buildings = append(buildings, d)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("GetDefBuilds rows: %w", rows.Err())
	}
	return buildings, nil
}

func (bs *BuildingStore) GetStorBuilds(ctx context.Context, villageID int64) ([]StorageBuilding, error) {
	query := `
		SELECT
			vb.id, vb.village_id, vb.building_id, vb.level, vb.x_cor, vb.y_cor, vb.current_hp, vb.upgrade_started, b.building_name, b.size_x, b.size_y, b.max_no_allowed, b.type, sb.resource_type, sb.capacity, sb.upgrade_cost, sb.upgrade_time
		FROM village_building vb
		JOIN building b ON b.id = vb.building_id
		JOIN storage_building sb ON sb.id = vb.building_id AND sb.level = vb.level
		WHERE vb.village_id = $1
		AND b.type = 'storage'
	`
	rows, err := bs.store.Pool.Query(ctx, query, villageID)
	if err != nil {
		return nil, fmt.Errorf("GetStorBuilds: %w", err)
	}
	defer rows.Close()

	buildings := make([]StorageBuilding, 0)
	for rows.Next() {
		var s StorageBuilding
		err := rows.Scan(&s.ID, &s.VillageID, &s.BuildingID, &s.Level, &s.XCor, &s.YCor, &s.CurrentHP, &s.UpgradeStarted, &s.BuildingName, &s.SizeX, &s.SizeY, &s.MaxNoAllowed, &s.Type, &s.ResourceType, &s.Capacity, &s.UpgradeCost, &s.UpgradeTime)
		if err != nil {
			return nil, fmt.Errorf("GetStorBuilds scan: %w", err)
		}
		buildings = append(buildings, s)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("GetStorBuilds rows: %w", rows.Err())
	}
	return buildings, nil
}

func (bs *BuildingStore) GetProdBuilds(ctx context.Context, villageID int64) ([]ProducerBuilding, error) {
	query := `
		SELECT
			vb.id, vb.village_id, vb.building_id, vb.level, vb.x_cor, vb.y_cor, vb.current_hp, vb.upgrade_started, b.building_name, b.size_x, b.size_y, b.max_no_allowed, b.type, pb.resource_type, pb.production_rate, pb.production_cap, pb.upgrade_cost, pb.upgrade_time
		FROM village_building vb
		JOIN building b ON b.id = vb.building_id
		JOIN producer_building pb ON pb.id = vb.building_id AND pb.level = vb.level
		WHERE vb.village_id = $1
		AND b.type = 'producer'
	`
	rows, err := bs.store.Pool.Query(ctx, query, villageID)
	if err != nil {
		return nil, fmt.Errorf("GetProdBuilds: %w", err)
	}
	defer rows.Close()

	buildings := make([]ProducerBuilding, 0)
	for rows.Next() {
		var p ProducerBuilding
		err := rows.Scan(&p.ID, &p.VillageID, &p.BuildingID, &p.Level, &p.XCor, &p.YCor, &p.CurrentHP, &p.UpgradeStarted, &p.BuildingName, &p.SizeX, &p.SizeY, &p.MaxNoAllowed, &p.Type, &p.ResourceType, &p.ProductionRate, &p.ProductionCap, &p.UpgradeCost, &p.UpgradeTime)
		if err != nil {
			return nil, fmt.Errorf("GetProdBuilds scan: %w", err)
		}
		buildings = append(buildings, p)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("GetProdBuilds rows: %w", rows.Err())
	}
	return buildings, nil
}
