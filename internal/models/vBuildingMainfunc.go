package models

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

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

	cost := Cost{}
	cost, err = bs.FindCostBuilding(ctx, btype, buildingID, level)
	if err != nil {
		return fmt.Errorf("UpgradeBuild cost fetch: %w", err)
	}

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

func (bs *BuildingStore) MoveBuildingTx(ctx context.Context, tx pgx.Tx, playerID int64, placements []BuildPlacement) (*BuildPlacement, error) {
	const MapSize = 20
	var grid [MapSize][MapSize]bool

	// for i := 8; i < 12; i++ {
	// 	for j := 8; j < 12; j++ {
	// 		grid[i][j] = true
	// 	}
	// }

	// tx, err := bs.store.Pool.Begin(ctx)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to start layout transaction: %w", err)
	// }
	// defer tx.Rollback(ctx)

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

	return nil, nil
}

// The main function above is also used when new building is created
func (bs *BuildingStore) MoveBuilding(ctx context.Context, playerID int64, placements []BuildPlacement) (*BuildPlacement, error) {
	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start layout transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delegate processing straight to the core execution engine
	failedPlacement, err := bs.MoveBuildingTx(ctx, tx, playerID, placements)
	if err != nil {
		return failedPlacement, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit layout changes: %w", err)
	}

	return nil, nil
}

// first we add building to village_building in db, perform payment and then check correct coordinates using movebuildingtx function
func (bs *BuildingStore) AddBuilding(ctx context.Context, playerID int64, buildingID int64, XCor int, YCor int, placements []BuildPlacement, vs *VillageStore) error {

	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("began transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var maxQuantity int
	var typeBuilding string
	err = tx.QueryRow(ctx, "SELECT max_no_allowed, type FROM building WHERE id = $1", buildingID).Scan(&maxQuantity, &typeBuilding)
	if err != nil {
		return fmt.Errorf("building catalog template missing: %w", err)
	}

	var currentCount int
	err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM village_building WHERE village_id = $1 AND building_id = $2", playerID, buildingID).Scan(&currentCount)
	if err != nil {
		return fmt.Errorf("failed to check current count: %w", err)
	}

	if currentCount >= maxQuantity {
		return fmt.Errorf("purchase limit reached for this building type")
	}

	cost := Cost{}
	cost, err = bs.FindCostBuilding(ctx, typeBuilding, buildingID, 0)
	if err != nil {
		return fmt.Errorf("UpgradeBuild cost fetch: %w", err)
	}

	paymentdone, err := vs.Purchase(ctx, tx, playerID, cost)
	if !paymentdone {
		return fmt.Errorf("Payment failed: %w", err)
	}

	Hp, err := bs.FindHP(ctx, typeBuilding, buildingID, 1)
	var newVillageBuildingID int64
	insertQuery := `
		INSERT INTO village_building (village_id, building_id, level, x_cor, y_cor, upgrade_started, current_hp)
		VALUES ($1, $2, 1, $3, $4, $5, $6)
		RETURNING id
	`
	err = tx.QueryRow(ctx, insertQuery, playerID, buildingID, XCor, YCor, time.Now().UTC(), Hp).Scan(&newVillageBuildingID)
	if err != nil {
		return fmt.Errorf("failed to insert new building row: %w", err)
	}

	newPlacement := BuildPlacement{
		VillageBuildingID: newVillageBuildingID,
		XCor:              XCor,
		YCor:              YCor,
	}

	placements = append(placements, newPlacement)

	_, err = bs.MoveBuildingTx(ctx, tx, playerID, placements)
	if err != nil {
		return err
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}

	return nil

}
