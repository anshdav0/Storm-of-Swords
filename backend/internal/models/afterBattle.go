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

func computeLoot(defGold, defIron, defWildfire, stars int) (gold, iron, wildfire int) {
	pct := float64(stars) * 0.10
	gold = int(float64(defGold) * pct)
	iron = int(float64(defIron) * pct)
	wildfire = int(float64(defWildfire) * pct)
	return
}
