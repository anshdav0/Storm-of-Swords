package controller

import (
	"net/http"

	"github.com/anshdav0/Storm-of-Swords.git/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/internal/models"
	"github.com/gorilla/mux"
)

type ResourceControl struct {
	vs *models.VillageStore
	bs *models.BuildingStore
}

func NewResourceController(vs *models.VillageStore, bs *models.BuildingStore) *ResourceControl {
	return &ResourceControl{vs: vs,
		bs: bs}
}

func (rc *ResourceControl) CollectResources(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// resource type comes from the URL: /api/village/collect/{resource_type}
	// valid values match your resource_type enum: gold, iron, wildfire
	resourceType := mux.Vars(r)["resource_type"]
	switch resourceType {
	case "gold", "iron", "wildfire":
		// valid
	default:
		http.Error(w, "Invalid resource type — must be gold, iron, or wildfire", http.StatusBadRequest)
		return
	}

	result, err := rc.vs.CollectResouces(r.Context(), playerID, resourceType, rc.bs)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, result)
}
