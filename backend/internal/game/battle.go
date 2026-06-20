package game

import "math"

func distance(x1, y1, x2, y2 float64) float64 {
	return math.Sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
}

func nearestTroopTo(cx, cy float64, troops []*SimTroop) *SimTroop {
	var nearest *SimTroop
	minDist := math.MaxFloat64
	for _, t := range troops {
		d := distance(cx, cy, t.X, t.Y)
		if d < minDist {
			minDist = d
			nearest = t
		}
	}
	return nearest
}

func (t *SimTroop) findNearestBuilding(state *BattleState) *SimBuilding {
	var nearest *SimBuilding
	minDist := math.MaxFloat64

	for i := range state.Buildings {
		b := &state.Buildings[i]
		if b.Destroyed {
			continue
		}
		d := distance(t.X, t.Y, b.CenterX, b.CenterY)
		if d < minDist {
			minDist = d
			nearest = b
		}
	}

	return nearest
}

func StartBattle(input BattleInput) ([]BattleEvent, BattleResult) {
	state := makeState(input)
	var allEvents []BattleEvent

	const battleTimeLimit = 600

	for tick := 0; tick < battleTimeLimit; tick++ {
		state.CurrentTime = float64(tick) + 1.0

		for i := range state.Buildings {
			events := state.Buildings[i].Act(state)
			allEvents = append(allEvents, events...)
		}

		for i := range state.Troops {
			events := state.Troops[i].Act(state)
			allEvents = append(allEvents, events...)
		}

		if allTroopsDead(state) || allBuildingDestroyed(state) {
			break
		}
	}

	result := computeResult(state)
	return allEvents, result
}

func makeState(input BattleInput) *BattleState {
	state := &BattleState{}

	for _, sb := range input.DefenderSnapshot {
		state.Buildings = append(state.Buildings, SimBuilding{
			VillageBuildingID: sb.VillageBuildingID,
			BuildingType:      sb.BuildingType,
			CenterX:           float64(sb.XCor) + float64(sb.SizeX)/2.0,
			CenterY:           float64(sb.YCor) + float64(sb.SizeY)/2.0,
			CurrentHP:         sb.CurrentHP,
			DPS:               sb.DPS,
			Range:             sb.Range,
			SplashRad:         sb.SplashRad,
			Destroyed:         false,
		})
	}

	instanceID := 0
	for _, dt := range input.AttackerDeployment {
		for i := 0; i < dt.Quantity; i++ {
			state.Troops = append(state.Troops, SimTroop{
				InstanceID: instanceID,
				TroopID:    dt.TroopID,
				TroopType:  dt.TroopType,
				X:          float64(dt.X),
				Y:          float64(dt.Y),
				CurrentHP:  dt.HP,
				Damage:     dt.Damage,
				Speed:      dt.Speed,
				Dead:       false,
			})
			instanceID++
		}
	}

	return state
}

func computeResult(state *BattleState) BattleResult {
	total := len(state.Buildings)
	destroyed := 0
	//mainCastleDestroyed := false

	for _, b := range state.Buildings {
		if b.Destroyed {
			destroyed++
		}
	}

	stars := 0
	if total > 0 && float64(destroyed)/float64(total) >= 0.5 {
		stars++
	}
	if destroyed == total && total > 0 {
		stars++
	}

	return BattleResult{
		StarsEarned:        stars,
		TotalBuildings:     total,
		BuildingsDestroyed: destroyed,
	}
}

func GiveFinalState(input BattleInput) *BattleState {
	state := makeState(input)
	const maxTicks = 600
	for tick := 0; tick < maxTicks; tick++ {
		state.CurrentTime = float64(tick) + 1.0
		for i := range state.Buildings {
			state.Buildings[i].Act(state)
		}
		for i := range state.Troops {
			state.Troops[i].Act(state)
		}
		if allTroopsDead(state) || allBuildingDestroyed(state) {
			break
		}
	}
	return state
}
