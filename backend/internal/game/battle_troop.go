package game

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

	var events []BattleEvent

	if dist <= attackRange {
		target.CurrentHP -= t.Damage
		if target.CurrentHP < 0 {
			target.CurrentHP = 0
		}

		events = append(events, BattleEvent{
			Time:              state.CurrentTime,
			Type:              EventBuildingDamaged,
			VillageBuildingID: target.VillageBuildingID,
			TroopInstanceID:   t.InstanceID,
			Damage:            t.Damage,
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

		if t.Speed >= dist {
			t.X = target.CenterX
			t.Y = target.CenterY
		} else {
			t.X += ((target.CenterX - t.X) / dist) * t.Speed
			t.Y += ((target.CenterY - t.Y) / dist) * t.Speed
		}

		events = append(events, BattleEvent{
			Time:            state.CurrentTime,
			Type:            EventTroopMoved,
			TroopInstanceID: t.InstanceID,
			ToX:             t.X,
			ToY:             t.Y,
		})
	}

	return events
}

func allTroopsDead(state *BattleState) bool {
	for _, t := range state.Troops {
		if !t.Dead {
			return false
		}
	}
	return true
}
