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
