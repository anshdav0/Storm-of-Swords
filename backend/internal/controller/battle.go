package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/models"
	"github.com/gorilla/mux"
)

type BattleControl struct {
	bts *models.BattleStore
	ts  *models.TroopStore
	vs  *models.VillageStore
}

type attackRequest struct {
	DefenderID int64                      `json:"defender_id"`
	Deployment []models.DeploymentRequest `json:"deployment"`
}

func NewBattleController(bts *models.BattleStore, ts *models.TroopStore, vs *models.VillageStore) *BattleControl {
	return &BattleControl{bts: bts, ts: ts, vs: vs}
}

func (bc *BattleControl) FindOpponent(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	opponent, err := bc.bts.FindOpponent(r.Context(), playerID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, opponent)
}

func (bc *BattleControl) GetDefenderVillage(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	defenderID, err := strconv.ParseInt(mux.Vars(r)["village_id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid village id", http.StatusBadRequest)
		return
	}

	snapshot, err := bc.bts.LoadDefenderSnapshot(r.Context(), defenderID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, snapshot)
}

func (bc *BattleControl) Attack(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req attackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := bc.bts.Attack(r.Context(), playerID, req.DefenderID, req.Deployment, bc.ts, bc.vs)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, result)
}
