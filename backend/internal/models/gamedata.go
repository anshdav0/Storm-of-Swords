// models/gamedata.go

package models

import (
	"context"
	"fmt"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/db"
)

type BuildingLevelStat struct {
	Level       int    `json:"level"`
	HP          int    `json:"hp"`
	UpgradeCost int    `json:"upgrade_cost"`
	UpgradeTime string `json:"upgrade_time"`

	// only populated for the relevant type — zero values otherwise
	DamagePerSec   int    `json:"damage_per_sec,omitempty"`
	SplashRad      int    `json:"splash_rad,omitempty"`
	Range          int    `json:"range,omitempty"`
	Capacity       int    `json:"capacity,omitempty"`
	ResourceType   string `json:"resource_type,omitempty"`
	ProductionRate int    `json:"production_rate,omitempty"`
	ProductionCap  int    `json:"production_cap,omitempty"`
}

type BuildingStatic struct {
	BuildingID   int64               `json:"building_id"`
	BuildingName string              `json:"building_name"`
	Type         string              `json:"type"`
	SizeX        int                 `json:"size_x"`
	SizeY        int                 `json:"size_y"`
	MaxNoAllowed int                 `json:"max_no_allowed"`
	Levels       []BuildingLevelStat `json:"levels"`
}

type TroopLevelStat struct {
	Level                  int `json:"level"`
	HP                     int `json:"hp"`
	Damage                 int `json:"damage"`
	UnlocksAtBuildingLevel int `json:"unlocks_at_building_level"`
}

type TroopStatic struct {
	TroopID          int64            `json:"troop_id"`
	Type             string           `json:"type"`
	Speed            int              `json:"speed"`
	HousingSpace     int              `json:"housing_space"`
	CostGold         int              `json:"cost_gold"`
	CostIron         int              `json:"cost_iron"`
	CostWildfire     int              `json:"cost_wildfire"`
	DismountedFormID *int64           `json:"dismounted_form_id,omitempty"`
	Levels           []TroopLevelStat `json:"levels"`
}

type GameData struct {
	Buildings []BuildingStatic `json:"buildings"`
	Troops    []TroopStatic    `json:"troops"`
}

type GameDataStore struct {
	store *db.Store
}

func NewGameDataStore(store *db.Store) *GameDataStore {
	return &GameDataStore{store: store}
}

// GetGameData returns the ENTIRE static catalogue — every building
// at every level, every troop at every level. Called once on app
// load by the frontend and cached there for the rest of the session.
func (gs *GameDataStore) GetGameData(ctx context.Context) (*GameData, error) {
	buildings, err := gs.loadBuildings(ctx)
	if err != nil {
		return nil, err
	}

	troops, err := gs.loadTroops(ctx)
	if err != nil {
		return nil, err
	}

	return &GameData{Buildings: buildings, Troops: troops}, nil
}

func (gs *GameDataStore) loadBuildings(ctx context.Context) ([]BuildingStatic, error) {
	// fetch base building info first
	rows, err := gs.store.Pool.Query(ctx, `
		SELECT id, building_name, type, size_x, size_y, max_no_allowed
		FROM building
		ORDER BY id
	`)
	if err != nil {
		return nil, fmt.Errorf("loadBuildings: %w", err)
	}
	//defer rows.Close()

	buildingsByID := make(map[int64]*BuildingStatic)
	var order []int64

	for rows.Next() {
		var b BuildingStatic
		if err := rows.Scan(&b.BuildingID, &b.BuildingName, &b.Type, &b.SizeX, &b.SizeY, &b.MaxNoAllowed); err != nil {
			return nil, fmt.Errorf("loadBuildings scan: %w", err)
		}
		buildingsByID[b.BuildingID] = &b
		order = append(order, b.BuildingID)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("loadBuildings rows: %w", rows.Err())
	}
	rows.Close()
	// fetch level stats from all three stat tables, tagged with their source
	statRows, err := gs.store.Pool.Query(ctx, `
		SELECT id, level, hp, upgrade_cost, upgrade_time::text, damage_per_sec, splash_rad, range, 0 AS capacity, '' AS resource_type, 0 AS production_rate, 0 AS production_cap
		FROM defense_building
		UNION ALL
		SELECT id, level, hp, upgrade_cost, upgrade_time::text, 0, 0, 0, capacity, resource_type::text, 0, 0
		FROM storage_building
		UNION ALL
		SELECT id, level, hp, upgrade_cost, upgrade_time::text,
		       0, 0, 0, 0, COALESCE(resource_type::text, ''), production_rate, production_cap
		FROM producer_building
	`)
	if err != nil {
		return nil, fmt.Errorf("loadBuildings stats: %w", err)
	}
	defer statRows.Close()

	for statRows.Next() {
		var buildingID int64
		var lvl BuildingLevelStat
		var upgradeTime string

		if err := statRows.Scan(&buildingID, &lvl.Level, &lvl.HP, &lvl.UpgradeCost, &upgradeTime, &lvl.DamagePerSec, &lvl.SplashRad, &lvl.Range, &lvl.Capacity, &lvl.ResourceType, &lvl.ProductionRate, &lvl.ProductionCap); err != nil {
			return nil, fmt.Errorf("loadBuildings stats scan: %w", err)
		}
		lvl.UpgradeTime = upgradeTime

		if b, ok := buildingsByID[buildingID]; ok {
			b.Levels = append(b.Levels, lvl)
		}
	}
	if statRows.Err() != nil {
		return nil, fmt.Errorf("loadBuildings stats rows: %w", statRows.Err())
	}

	result := make([]BuildingStatic, 0, len(order))
	for _, id := range order {
		result = append(result, *buildingsByID[id])
	}
	return result, nil
}

func (gs *GameDataStore) loadTroops(ctx context.Context) ([]TroopStatic, error) {
	rows, err := gs.store.Pool.Query(ctx, `
		SELECT id, type, speed, housing_space, cost_gold, cost_iron, cost_wildfire, dismounted_form_id
		FROM troop
		ORDER BY id
	`)
	if err != nil {
		return nil, fmt.Errorf("loadTroops: %w", err)
	}
	//defer rows.Close()

	troopsByID := make(map[int64]*TroopStatic)
	var order []int64

	for rows.Next() {
		var t TroopStatic
		if err := rows.Scan(&t.TroopID, &t.Type, &t.Speed, &t.HousingSpace, &t.CostGold, &t.CostIron, &t.CostWildfire, &t.DismountedFormID); err != nil {
			return nil, fmt.Errorf("loadTroops scan: %w", err)
		}
		troopsByID[t.TroopID] = &t
		order = append(order, t.TroopID)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("loadTroops rows: %w", rows.Err())
	}
	rows.Close()

	statRows, err := gs.store.Pool.Query(ctx, `
		SELECT troop_id, level, hp, damage, unlocks_at_building_level
		FROM troop_level_stat
		ORDER BY troop_id, level
	`)
	if err != nil {
		return nil, fmt.Errorf("loadTroops stats: %w", err)
	}
	defer statRows.Close()

	for statRows.Next() {
		var troopID int64
		var lvl TroopLevelStat
		if err := statRows.Scan(&troopID, &lvl.Level, &lvl.HP, &lvl.Damage, &lvl.UnlocksAtBuildingLevel); err != nil {
			return nil, fmt.Errorf("loadTroops stats scan: %w", err)
		}
		if t, ok := troopsByID[troopID]; ok {
			t.Levels = append(t.Levels, lvl)
		}
	}
	if statRows.Err() != nil {
		return nil, fmt.Errorf("loadTroops stats rows: %w", statRows.Err())
	}

	result := make([]TroopStatic, 0, len(order))
	for _, id := range order {
		result = append(result, *troopsByID[id])
	}
	return result, nil
}
