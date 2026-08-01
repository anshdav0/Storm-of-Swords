package game

import "math"

func (b *SimBuilding) Act(state *BattleState) []BattleEvent {
	if b.Destroyed || b.DPS == 0 {
		return nil
	}

	var inRange []*SimTroop
	for i := range state.Troops {
		t := &state.Troops[i]
		if t.Dead {
			continue
		}
		if distance(b.CenterX, b.CenterY, t.X, t.Y) <= b.Range {
			inRange = append(inRange, t)
		}
	}

	if len(inRange) == 0 {
		return nil
	}

	tickDamage := int(math.Round(float64(b.DPS) * TICK_DURATION))
	if tickDamage < 1 {
		tickDamage = 1
	}

	var events []BattleEvent

	if b.SplashRad > 0 {
		nearest := nearestTroopTo(b.CenterX, b.CenterY, inRange)
		for _, t := range inRange {
			if distance(nearest.X, nearest.Y, t.X, t.Y) <= b.SplashRad {
				events = append(events, b.dealDamageToTroop(t, tickDamage, state.CurrentTime)...)
			}
		}
	} else {
		nearest := nearestTroopTo(b.CenterX, b.CenterY, inRange)
		events = append(events, b.dealDamageToTroop(nearest, tickDamage, state.CurrentTime)...)
	}

	return events
}

func (b *SimBuilding) dealDamageToTroop(t *SimTroop, dmg int, currentTime float64) []BattleEvent {
	var events []BattleEvent

	t.CurrentHP -= dmg
	if t.CurrentHP < 0 {
		t.CurrentHP = 0
	}

	events = append(events, BattleEvent{
		Time:            currentTime,
		Type:            EventTroopDamaged,
		TroopInstanceID: t.InstanceID,
		TroopID:         t.TroopID,
		Damage:          dmg,
		HPLeft:          t.CurrentHP,
	})

	if t.CurrentHP <= 0 {
		t.Dead = true
		events = append(events, BattleEvent{
			Time:            currentTime,
			Type:            EventTroopDied,
			TroopInstanceID: t.InstanceID,
			TroopID:         t.TroopID,
		})
	}

	return events
}

func AllBuildingDestroyed(state *BattleState) bool {
	for _, b := range state.Buildings {
		if !b.Destroyed {
			return false
		}
	}
	return true
}
