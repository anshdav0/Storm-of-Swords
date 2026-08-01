package game

import "math"

func (t *SimTroop) Act(state *BattleState) []BattleEvent {
	if t.Dead {
		return nil
	}

	target := t.findNearestBuilding(state)
	if target == nil {
		return nil
	}

	dist := distance(t.X, t.Y, target.CenterX, target.CenterY)
	const attackRange = 1.0

	tickDamage := int(math.Round(float64(t.Damage) * TICK_DURATION))
	if tickDamage < 1 {
		tickDamage = 1
	}

	tickSpeed := t.Speed * TICK_DURATION

	var events []BattleEvent

	if dist <= attackRange {
		target.CurrentHP -= tickDamage
		if target.CurrentHP < 0 {
			target.CurrentHP = 0
		}

		events = append(events, BattleEvent{
			Time:              state.CurrentTime,
			Type:              EventBuildingDamaged,
			VillageBuildingID: target.VillageBuildingID,
			TroopInstanceID:   t.InstanceID,
			TroopID:           t.TroopID,
			Damage:            tickDamage,
			HPLeft:            target.CurrentHP,
		})

		if target.CurrentHP <= 0 {
			target.Destroyed = true
			events = append(events, BattleEvent{
				Time:              state.CurrentTime,
				Type:              EventBuildingDestroyed,
				VillageBuildingID: target.VillageBuildingID,
			})
		}
	} else {

		if tickSpeed >= dist {
			t.X = target.CenterX
			t.Y = target.CenterY
		} else {
			t.X += ((target.CenterX - t.X) / dist) * tickSpeed
			t.Y += ((target.CenterY - t.Y) / dist) * tickSpeed
		}

		events = append(events, BattleEvent{
			Time:            state.CurrentTime,
			Type:            EventTroopMoved,
			TroopInstanceID: t.InstanceID,
			TroopID:         t.TroopID,
			ToX:             t.X,
			ToY:             t.Y,
		})
	}

	return events
}

func AllTroopsDead(state *BattleState) bool {
	if len(state.PendingTroops) > 0 {
		return false // still troops waiting to spawn
	}
	for _, t := range state.Troops {
		if !t.Dead {
			return false
		}
	}
	return true
}
