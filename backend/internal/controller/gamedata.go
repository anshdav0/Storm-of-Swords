// controllers/gamedata.go

package controller

import (
	"log"
	"net/http"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/models"
)

type GameDataControl struct {
	gs *models.GameDataStore
}

func NewGameDataController(gs *models.GameDataStore) *GameDataControl {
	return &GameDataControl{gs: gs}
}

func (gc *GameDataControl) GetGameData(w http.ResponseWriter, r *http.Request) {
	data, err := gc.gs.GetGameData(r.Context())
	if err != nil {
		log.Println("GetGameData error:", err)
		http.Error(w, "Failed to fetch game data", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, data)
}
