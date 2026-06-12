package models

import (
	"context"
	"fmt"
)

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

func (bs *BuildingStore) UpgradeBuild(ctx context.Context, villageID int64, villageBuildingID int64, vs *VillageStore) error {
	var level int
	var buildingID int64
	var btype string

	err := bs.store.Pool.QueryRow(ctx, `
		SELECT vb.level, vb.building_id, b.type
		FROM village_building vb
		JOIN building b ON b.id = vb.building_id
		WHERE vb.id = $1 AND vb.village_id = $2
	`, villageBuildingID, villageID).Scan(&level, &buildingID, &btype)
	if err != nil {
		return fmt.Errorf("UpgradeBuild fetch: %w", err)
	}
	if level >= 3 {
		return fmt.Errorf("already at max level")
	}

	var upgradeCost int
	switch btype {
	case "defense":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM defense_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	case "storage":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM storage_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	case "producer":
		err = bs.store.Pool.QueryRow(ctx, `
			SELECT upgrade_cost FROM producer_building
			WHERE id = $1 AND level = $2
		`, buildingID, level+1).Scan(&upgradeCost)
	}
	if err != nil {
		return fmt.Errorf("UpgradeBuild cost fetch: %w", err)
	}

	cost := Cost{}
	switch btype {
	case "defense":
		cost.Gold = upgradeCost
	}
	cost.Iron = upgradeCost

	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("UpgradeBuild begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if a, err := vs.Purchase(ctx, tx, villageID, cost); !a {
		return err
	}

	_, err = tx.Exec(ctx, `
		UPDATE village_building
		SET upgrade_started = NOW()
		WHERE id = $1
	`, villageBuildingID)
	if err != nil {
		return fmt.Errorf("UpgradeBuild update: %w", err)
	}
	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("UpgradeBuild commit: %w", err)
	}

	return nil
}

func (bs *BuildingStore) MoveBuilding(ctx context.Context, playerID int64, placements []BuildPlacement) (*BuildPlacement, error) {
	const MapSize = 20
	var grid [MapSize][MapSize]bool

	for i := 8; i < 12; i++ {
		for j := 8; j < 12; j++ {
			grid[i][j] = true
		}
	}

	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start layout transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, p := range placements {
		var sizeX, sizeY int

		query := `
			SELECT b.size_x, b.size_y
			FROM village_building vb
			JOIN building b ON b.id = vb.building_id
			WHERE vb.id = $1 AND vb.village_id = $2
		`
		err := tx.QueryRow(ctx, query, p.VillageBuildingID, playerID).Scan(&sizeX, &sizeY)
		if err != nil {
			return nil, fmt.Errorf("building ID %d not found", p.VillageBuildingID)
		}

		if p.XCor < 0 || (p.XCor+sizeX) > MapSize || p.YCor < 0 || (p.YCor+sizeY) > MapSize {
			return &p, fmt.Errorf("layout rejected: building ID %d overflows the map", p.VillageBuildingID)
		}

		for i := p.XCor; i < p.XCor+sizeX; i++ {
			for j := p.YCor; j < p.YCor+sizeY; j++ {
				if grid[i][j] {
					return &p, fmt.Errorf("layout rejected: building ID %d overlaps", p.VillageBuildingID)
				}
				grid[i][j] = true
			}
		}

		_, err = tx.Exec(ctx, `
			UPDATE village_building
			SET x_cor = $1, y_cor = $2
			WHERE id = $3 AND village_id = $4
		`, p.XCor, p.YCor, p.VillageBuildingID, playerID)
		if err != nil {
			return nil, fmt.Errorf("failed to store the building new cordinates: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil, nil
}
