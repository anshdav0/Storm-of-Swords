package controller

import (
	"encoding/json"
	"net/http"

	"github.com/anshdav0/Storm-of-Swords.git/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/internal/models"
)

type TroopControl struct {
	ts *models.TroopStore
	vs *models.VillageStore
	bs *models.BuildingStore
}

func NewTroopController(ts *models.TroopStore, vs *models.VillageStore, bs *models.BuildingStore) *TroopControl {
	return &TroopControl{ts: ts, vs: vs, bs: bs}
}

type recruitRequest struct {
	TroopID  int64 `json:"troop_id"`
	Quantity int   `json:"quantity"`
}

func (tc *TroopControl) RecruitTroop(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req recruitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Quantity <= 0 {
		http.Error(w, "Quantity must be at least 1", http.StatusBadRequest)
		return
	}

	result, err := tc.ts.RecruitTroop(r.Context(), playerID, req.TroopID, req.Quantity, tc.vs, tc.bs)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

func (tc *TroopControl) GetArmy(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	army, err := tc.ts.GetArmy(r.Context(), playerID)
	if err != nil {
		http.Error(w, "Failed to fetch army", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, army)
}
