package models

import "math"

func computeTrophies(attackerTrophies, defenderTrophies, starsEarned int) int {
	base := 30.0
	diff := float64(defenderTrophies - attackerTrophies)
	stake := base + diff/50.0
	stake = math.Max(5, math.Min(60, stake))

	gained := int(stake * float64(starsEarned) / 3.0)
	if gained < 1 {
		gained = 1
	}
	return gained
}

func computeLoot(defResources Cost, stars int) Cost {
	pct := float64(stars) * 0.10
	var cost Cost
	cost.Gold = int(float64(defResources.Gold) * pct)
	cost.Iron = int(float64(defResources.Iron) * pct)
	cost.Wildfire = int(float64(defResources.Wildfire) * pct)

	return cost
}
