package models

import (
	"context"
	"fmt"
	"strings"
)

type Troop struct {
	ID           int64  `json:"id"`
	Type         string `json:"type"`
	Speed        int    `json:"speed"`
	HousingSpace int    `json:"housing_space"`
	CostGold     int    `json:"cost_gold"`
	CostIron     int    `json:"cost_iron"`
	CostWildfire int    `json:"cost_wildfire"`

	Level                  int `json:"level"`
	HP                     int `json:"hp"`
	Damage                 int `json:"damage"`
	UnlocksAtBuildingLevel int `json:"unlocks_at_building_level"`

	DismountedFormID *int64 `json:"dismounted_form_id,omitempty"`
}

// this function is here to give the details of a paticular troop
func (ts *TroopStore) GetTroop(ctx context.Context, troopID int64, level int) (*Troop, error) {
	t := &Troop{}

	err := ts.store.Pool.QueryRow(ctx, `
		SELECT
			t.id, t.type, t.speed, t.housing_space, t.cost_gold, t.cost_iron, t.cost_wildfire, t.dismounted_form_id, tls.level, tls.hp, tls.damage, tls.unlocks_at_building_level
		FROM troop t
		JOIN troop_level_stat tls
			ON tls.troop_id = t.id
		WHERE t.id = $1
		  AND tls.level = $2
	`, troopID, level).Scan(&t.ID, &t.Type, &t.Speed, &t.HousingSpace, &t.CostGold, &t.CostIron, &t.CostWildfire, &t.DismountedFormID, &t.Level, &t.HP, &t.Damage, &t.UnlocksAtBuildingLevel)
	if err != nil {
		return nil, fmt.Errorf("GetTroop: %w", err)
	}

	return t, nil
}

// this function is there to ensure that the troop whenn bought is of the correct level sice troops are not directly upgraded just the level of building determines the level of troop
func (ts *TroopStore) GetTroopAtMaxUnlockedLevel(ctx context.Context, troopID int64, villageID int64, bs *BuildingStore) (*Troop, error) {
	//initialinsing the troop generic template
	t := &Troop{}

	//checking armoury level to verify that the troop in request is unlocked or not
	armouryLevel, _, err := bs.GetBuildLevelName(ctx, villageID, 4)
	if err != nil {
		return nil, fmt.Errorf("The armoury doesn't exist: %w", err)
	}

	//checking baracks level to verify that the troop in request is unlocked or not
	barracksLevel, _, err := bs.GetBuildLevelName(ctx, villageID, 3)
	if err != nil {
		return nil, fmt.Errorf("The baracks doesn't exist: %w", err)
	}

	//getting the troop's detail to according to the armoury level and also to compare with the baracks level
	err = ts.store.Pool.QueryRow(ctx, `
		SELECT
			t.id, t.type, t.speed, t.housing_space, t.cost_gold, t.cost_iron, t.cost_wildfire, t.dismounted_form_id, tls.level, tls.hp, tls.damage, tls.unlocks_at_building_level
		FROM troop t
		JOIN troop_level_stat tls
			ON tls.troop_id = t.id
		WHERE t.id = $1
		  AND tls.level = (
			SELECT MAX(level)
			FROM troop_level_stat
			WHERE troop_id = $1
			  AND unlocks_at_building_level <= $2
		    )
	`, troopID, armouryLevel).Scan(&t.ID, &t.Type, &t.Speed, &t.HousingSpace, &t.CostGold, &t.CostIron, &t.CostWildfire, &t.DismountedFormID, &t.Level, &t.HP, &t.Damage, &t.UnlocksAtBuildingLevel)
	if err != nil {
		return nil, fmt.Errorf("GetTroopAtMaxUnlockedLevel: %w", err)
	}

	isDothraki := strings.Contains(t.Type, "Dothraki")
	isStaff := strings.Contains(t.Type, "Staff")

	if isDothraki && barracksLevel < 2 {
		return nil, fmt.Errorf(
			"Dothraki troops require Barracks level 2 (yours is level %d)",
			barracksLevel,
		)
	}
	if isStaff && barracksLevel < 3 {
		return nil, fmt.Errorf(
			"Staff troops require Barracks level 3 (yours is level %d)",
			barracksLevel,
		)
	}

	return t, nil
}
