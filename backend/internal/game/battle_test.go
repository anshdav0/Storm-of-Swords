package game

import "testing"

func TestRunBattle_SingleTroopDestroysWeakBuilding(t *testing.T) {
	input := BattleInput{
		DefenderSnapshot: []OpponentBuilding{
			{VillageBuildingID: 1, XCor: 5, YCor: 5, SizeX: 2, SizeY: 2, CurrentHP: 50},
		},
		AttackerDeployment: []DeployedTroop{
			{TroopID: 1, Quantity: 1, X: 0, Y: 0, HP: 100, Damage: 60, Speed: 10},
		},
	}

	_, result := StartBattle(input)

	if result.BuildingsDestroyed != 1 {
		t.Errorf("expected 1 building destroyed, got %d", result.BuildingsDestroyed)
	}
	if result.StarsEarned < 1 {
		t.Errorf("expected at least 1 star, got %d", result.StarsEarned)
	}
}

func TestRunBattle_DefenseKillsWeakTroopBeforeReachingBuilding(t *testing.T) {
	input := BattleInput{
		DefenderSnapshot: []OpponentBuilding{
			{VillageBuildingID: 1, XCor: 10, YCor: 10, SizeX: 2, SizeY: 2, CurrentHP: 500,
				DPS: 1000, Range: 20},
		},
		AttackerDeployment: []DeployedTroop{
			{TroopID: 1, Quantity: 1, X: 0, Y: 0, HP: 50, Damage: 10, Speed: 1},
		},
	}

	_, result := StartBattle(input)

	if result.BuildingsDestroyed != 0 {
		t.Errorf("expected building to survive, got %d destroyed", result.BuildingsDestroyed)
	}
}

func TestDistance(t *testing.T) {
	d := distance(0, 0, 3, 4)
	if d != 5 {
		t.Errorf("expected distance 5 (3-4-5 triangle), got %f", d)
	}
}
