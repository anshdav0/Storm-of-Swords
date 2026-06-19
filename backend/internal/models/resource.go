package models

import (
	"context"
	"fmt"
	"math"
	"time"
)

type CollectedResult struct {
	ResourceType string `json:"resource_type"`
	Collected    int    `json:"collected"`
}
type ResourceProducerStats struct {
	LastCollected  time.Time `db:"last_collected"`
	ProductionRate int       `db:"production_rate"`
	ProductionCap  int       `db:"production_cap"`
}

func (vs *VillageStore) CollectResouces(ctx context.Context, villageID int64, resourceType string, bs *BuildingStore) (*CollectedResult, error) {
	var result CollectedResult

	query := `
	SELECT 
		vb.last_collected, pb.production_rate, pb.production_cap
	FROM village_building vb
	JOIN building b ON b.id = vb.building_id
	JOIN producer_building pb ON pb.id = vb.building_id AND pb.level = vb.level
	WHERE vb.village_id = $1 
		AND pb.resource_type = $2
		AND b.type = 'producer'
    `
	rows, err := bs.store.Pool.Query(ctx, query, villageID, resourceType)
	if err != nil {
		return nil, fmt.Errorf("GetProducerStatsByResource: %w", err)
	}
	defer rows.Close()

	var results []ResourceProducerStats
	for rows.Next() {
		var stats ResourceProducerStats
		err := rows.Scan(&stats.LastCollected, &stats.ProductionRate, &stats.ProductionCap)
		if err != nil {
			return nil, fmt.Errorf("GetProducerStatsByResource scan: %w", err)
		}
		results = append(results, stats)
	}

	now := time.Now().UTC()

	for _, name := range results {
		elapsed := now.Sub(name.LastCollected).Seconds()
		raw := elapsed * float64(name.ProductionRate)
		earned := int(math.Min(raw, float64(name.ProductionCap)))
		result.Collected += earned
	}

	tx, err := vs.store.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("CollectResources begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	updateQuery := `
        UPDATE village_building vb
        SET last_collected = $1
        FROM building b, producer_building pb
        WHERE b.id = vb.building_id 
          AND pb.id = vb.building_id 
          AND pb.level = vb.level
          AND vb.village_id = $2
          AND pb.resource_type = $3
          AND b.type = 'producer'
    `
	_, err = tx.Exec(ctx, updateQuery, now, villageID, resourceType)
	if err != nil {
		return nil, fmt.Errorf("CollectResources updating timestamp failed: %w", err)
	}

	var cost Cost
	switch resourceType {
	case "gold":
		cost.Gold = -result.Collected
	case "iron":
		cost.Iron = -result.Collected
	case "wildfire":
		cost.Wildfire = -result.Collected
	}

	success, err := vs.Purchase(ctx, tx, villageID, cost, bs)
	if !success {
		return nil, fmt.Errorf("Cant increment resources: %w", err)
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("CollectResources commit: %w", err)
	}

	return &result, nil

}

func (bs *BuildingStore) CheckforUpdates(ctx context.Context, villageID int64) error {

	//try to find the joke wink wink nudge nudge
	baselineTime, err := time.Parse(time.RFC3339, "2001-09-11T13:46:00Z")
	if err != nil {
		return fmt.Errorf("failed to parse baseline time: %w", err)
	}

	query := `
		SELECT vb.id, vb.level
		FROM village_building vb
		JOIN building b ON b.id = vb.building_id
		JOIN (
			SELECT id, level, upgrade_time FROM defense_building
			UNION ALL
			SELECT id, level, upgrade_time FROM storage_building
			UNION ALL
			SELECT id, level, upgrade_time FROM producer_building
		) stat ON stat.id = vb.building_id AND stat.level = vb.level + 1
		WHERE vb.village_id = $1
		  AND vb.upgrade_started > $2
		  AND (vb.upgrade_started + stat.upgrade_time) AT TIME ZONE 'UTC' <= NOW() AT TIME ZONE 'UTC'
	`

	rows, err := bs.store.Pool.Query(ctx, query, villageID, baselineTime)
	if err != nil {
		return fmt.Errorf("CheckforUpdates query failed: %w", err)
	}
	defer rows.Close()

	type CompletedUpgrade struct {
		ID           int64
		CurrentLevel int
	}
	fmt.Printf("Been here")

	var completed []CompletedUpgrade
	for rows.Next() {
		var cu CompletedUpgrade
		err := rows.Scan(&cu.ID, &cu.CurrentLevel)
		if err != nil {
			return fmt.Errorf("CheckforUpdates scan failed: %w", err)
		}
		completed = append(completed, cu)
	}

	if len(completed) == 0 {
		return nil
	}

	tx, err := bs.store.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("CheckforUpdates begin tx failed: %w", err)
	}
	defer tx.Rollback(ctx)

	updateQuery := `
		UPDATE village_building
		SET level = $1,
			upgrade_started = $2
		WHERE id = $3
	`

	for _, building := range completed {
		newLevel := building.CurrentLevel + 1

		_, err := tx.Exec(ctx, updateQuery, newLevel, baselineTime, building.ID)
		if err != nil {
			return fmt.Errorf("failed to update completed building level for id %d: %w", building.ID, err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("CheckforUpdates commit failed: %w", err)
	}

	return nil
}
