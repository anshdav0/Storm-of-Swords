package controller

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/anshdav0/Storm-of-Swords.git/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/internal/models"
	"github.com/gorilla/mux"
)

type VillageControl struct {
	vs *models.VillageStore
	bs *models.BuildingStore
}

func NewVillageController(vs *models.VillageStore, bs *models.BuildingStore) *VillageControl {
	return &VillageControl{vs: vs, bs: bs}
}

type SaveLayoutRequest struct {
	Placements []models.BuildPlacement `json:"placements"`
}

type villageResponse struct {
	Village  *models.Village           `json:"village"`
	Defense  []models.DefenseBuilding  `json:"defense_building"`
	Storage  []models.StorageBuilding  `json:"storage_building"`
	Producer []models.ProducerBuilding `json:"producer_building"`
}

func (vc *VillageControl) GetVillage(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := r.Context()

	village, err := vc.vs.GetVillage(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to fetch village", http.StatusInternalServerError)
		return
	}

	//getting data for defense building
	defense, err := vc.bs.GetDefBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to fetch defense buildings", http.StatusInternalServerError)
		return
	}

	//getting data for storage building
	storage, err := vc.bs.GetStorBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to fetch storage buildings", http.StatusInternalServerError)
		return
	}

	//getting data for producer building
	producer, err := vc.bs.GetProdBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to fetch producer buildings", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, villageResponse{
		Village:  village,
		Defense:  defense,
		Storage:  storage,
		Producer: producer,
	})
}

func (vc *VillageControl) SaveLayout(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	//saving the req and decoding
	var req SaveLayoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body payload", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	count := 0
	arr1, err := vc.bs.GetDefBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to load defenses", http.StatusInternalServerError)
		return
	}
	count += len(arr1)
	arr2, err := vc.bs.GetProdBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to load production", http.StatusInternalServerError)
		return
	}
	count += len(arr2)
	arr3, err := vc.bs.GetStorBuilds(ctx, playerID)
	if err != nil {
		http.Error(w, "Failed to load storage", http.StatusInternalServerError)
		return
	}
	count += len(arr3)

	if len(req.Placements) != count {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Rejected: Payload must contain the complete village layout.",
		})
		return
	}

	//caling the model moveBuilding function
	failedPlacement, err := vc.bs.MoveBuilding(ctx, playerID, req.Placements)
	if err != nil {
		if failedPlacement != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)

			json.NewEncoder(w).Encode(map[string]any{
				"error":            err.Error(),
				"failed_placement": failedPlacement,
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"debug_database_error": err.Error(),
		})
		//http.Error(w, "Internal db error processing layout configuration", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "building layout  updated successfully"})
}

func (vc *VillageControl) UpgradeBuilding(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid building id", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	if err := vc.bs.UpgradeBuild(ctx, playerID, id, vc.vs); err != nil {
		// check error message to return the right status code
		msg := err.Error()
		if strings.Contains(msg, "already at max level") || strings.Contains(msg, "not enough") {
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to upgrade building", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "building upgraded"})
}
