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

func StartBattle(input BattleInput) ([]BattleEvent, BattleResult, *BattleState) {
	state := MakeState(input)
	var allEvents []BattleEvent

	const battleTimeLimit = 180

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

		if AllTroopsDead(state) || AllBuildingDestroyed(state) {
			break
		}
	}

	result := ComputeResult(state, input.DefenderSnapshot)
	return allEvents, result, state
}

func MakeState(input BattleInput) *BattleState {
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
			troop := SimTroop{
				InstanceID: instanceID,
				TroopID:    dt.TroopID,
				TroopType:  dt.TroopType,
				X:          float64(dt.X),
				Y:          float64(dt.Y),
				CurrentHP:  dt.HP,
				Damage:     dt.Damage,
				Speed:      dt.Speed,
				Dead:       false,
			}

			if dt.DeployedAt <= 0 {
				state.Troops = append(state.Troops, troop)
			} else {
				state.PendingTroops = append(state.PendingTroops, troop)
				state.DeployTimes = append(state.DeployTimes, dt.DeployedAt)
			}
			instanceID++
		}
	}

	return state
}

func ComputeResult(state *BattleState, snapshot []OpponentBuilding) BattleResult {
	total := len(state.Buildings)
	destroyed := 0
	mainCastleDestroyed := false
	mainCastleID := findMainCastleID(snapshot)

	for _, b := range state.Buildings {
		if b.Destroyed {
			destroyed++
			if b.VillageBuildingID == mainCastleID {
				mainCastleDestroyed = true
			}
		}
	}

	stars := 0
	if mainCastleDestroyed {
		stars++
	}
	if total > 0 && float64(destroyed)/float64(total) >= 0.5 {
		stars++
	}
	if destroyed == total && total > 0 {
		stars++
	}

	return BattleResult{
		StarsEarned:         stars,
		TotalBuildings:      total,
		BuildingsDestroyed:  destroyed,
		MainCastleDestroyed: mainCastleDestroyed,
	}
}

func findMainCastleID(snapshot []OpponentBuilding) int64 {
	for _, b := range snapshot {
		if b.SizeX == 4 && b.SizeY == 4 && b.BuildingName == "Main Castle" {
			return b.VillageBuildingID
		}
	}
	return -1
}

func GiveFinalState(input BattleInput) *BattleState {
	state := MakeState(input)
	const maxTicks = 180
	for tick := 0; tick < maxTicks; tick++ {
		state.CurrentTime = float64(tick) + 1.0
		for i := range state.Buildings {
			state.Buildings[i].Act(state)
		}
		for i := range state.Troops {
			state.Troops[i].Act(state)
		}
		if AllTroopsDead(state) || AllBuildingDestroyed(state) {
			break
		}
	}
	return state
}

func (state *BattleState) AddPendingTroops(troops []DeployedTroop, nextInstanceID *int) []BattleEvent {
	var events []BattleEvent

	for _, dt := range troops {
		for i := 0; i < dt.Quantity; i++ {
			troop := SimTroop{
				InstanceID: *nextInstanceID,
				TroopID:    dt.TroopID,
				TroopType:  dt.TroopType,
				X:          float64(dt.X),
				Y:          float64(dt.Y),
				CurrentHP:  dt.HP,
				Damage:     dt.Damage,
				Speed:      dt.Speed,
				Dead:       false,
			}
			// deploy at exactly the current time — spawns next tick
			state.PendingTroops = append(state.PendingTroops, troop)
			state.DeployTimes = append(state.DeployTimes, state.CurrentTime)
			*nextInstanceID++

			events = append(events, BattleEvent{
				Time:            state.CurrentTime,
				Type:            EventTroopDeployed,
				TroopInstanceID: troop.InstanceID,
				ToX:             float64(dt.X),
				ToY:             float64(dt.Y),
			})
		}
	}

	return events
}

func (state *BattleState) SpawnPendingTroops() []BattleEvent {
	var events []BattleEvent
	var remainingPending []SimTroop
	var remainingTimes []float64

	for i, t := range state.PendingTroops {
		if state.DeployTimes[i] <= state.CurrentTime {
			state.Troops = append(state.Troops, t)
			events = append(events, BattleEvent{
				Time:            state.CurrentTime,
				Type:            EventTroopDeployed,
				TroopInstanceID: t.InstanceID,
				TroopID:         t.TroopID,
				ToX:             t.X,
				ToY:             t.Y,
			})
		} else {
			remainingPending = append(remainingPending, t)
			remainingTimes = append(remainingTimes, state.DeployTimes[i])
		}
	}

	state.PendingTroops = remainingPending
	state.DeployTimes = remainingTimes
	return events
}

func Tick(state *BattleState) []BattleEvent {
	state.CurrentTime += TICK_DURATION
	var events []BattleEvent

	// spawn any troops whose time has come
	events = append(events, state.SpawnPendingTroops()...)

	// defenses fire first
	for i := range state.Buildings {
		events = append(events, state.Buildings[i].Act(state)...)
	}

	// troops act after taking defensive fire
	for i := range state.Troops {
		events = append(events, state.Troops[i].Act(state)...)
	}

	return events
}

func (state *BattleState) TotalTroopCount() int {
	return len(state.Troops) + len(state.PendingTroops)
}
