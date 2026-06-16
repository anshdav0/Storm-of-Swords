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
