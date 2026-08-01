package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/game"
	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/models"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type TickMessage struct {
	Type   string             `json:"type"`
	Tick   float64            `json:"tick"`
	Events []game.BattleEvent `json:"events"`
}

type EndMessage struct {
	Type           string `json:"type"`
	StarsEarned    int    `json:"stars_earned"`
	TrophiesGained int    `json:"trophies_gained"`
	GoldLooted     int    `json:"gold_looted"`
	IronLooted     int    `json:"iron_looted"`
	WildfireLooted int    `json:"wildfire_looted"`
	BattleID       int64  `json:"battle_id"`
}

type StartBattleMessage struct {
	Type       string                     `json:"type"` // "start"
	DefenderID int64                      `json:"defender_id"`
	Deployment []models.DeploymentRequest `json:"deployment"`
}

type DeployMessage struct {
	Type       string                     `json:"type"` // "deploy"
	Deployment []models.DeploymentRequest `json:"deployment"`
}

type BattleHandler struct {
	bs  *models.BattleStore
	ts  *models.TroopStore
	vs  *models.VillageStore
	bus *models.BuildingStore
}

func NewBattleHandler(bs *models.BattleStore, ts *models.TroopStore, vs *models.VillageStore, bus *models.BuildingStore) *BattleHandler {
	return &BattleHandler{bs: bs, ts: ts, vs: vs, bus: bus}
}

func (bh *BattleHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	playerID, ok := middleware.GetPlayerID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Websocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	ctx := r.Context()

	_, raw, err := conn.ReadMessage()
	if err != nil {
		log.Printf("WS read start message: %v", err)
		return
	}

	var startMsg StartBattleMessage
	if err := json.Unmarshal(raw, &startMsg); err != nil || startMsg.Type != "start" {
		conn.WriteJSON(map[string]string{"error": "first messsage type invlaid"})
		return
	}

	if startMsg.DefenderID == playerID {
		conn.WriteJSON(map[string]string{"error": "cannot attack yourself"})
		return
	}

	snapshot, err := bh.bs.LoadDefenderSnapshot(ctx, startMsg.DefenderID)
	if err != nil {
		conn.WriteJSON(map[string]string{"error": err.Error()})
		return
	}

	deployment, err := bh.bs.BuildDeployment(ctx, playerID, startMsg.Deployment, bh.ts)
	if err != nil {
		conn.WriteJSON(map[string]string{"error": err.Error()})
		return
	}

	input := game.BattleInput{
		DefenderSnapshot:   snapshot,
		AttackerDeployment: deployment,
	}

	state := game.MakeState(input)
	nextInstanceID := state.TotalTroopCount()

	deployCh := make(chan []game.DeployedTroop, 32)
	done := make(chan struct{})

	// Background thread solely handles parsing raw WS socket input frame streams
	go func() {
		defer close(done)
		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var msg DeployMessage
			if err := json.Unmarshal(raw, &msg); err != nil || msg.Type != "deploy" {
				continue
			}

			troops, err := bh.bs.BuildDeployment(ctx, playerID, msg.Deployment, bh.ts)
			if err != nil {
				conn.WriteJSON(map[string]string{"error": err.Error()})
				continue
			}

			deployCh <- troops
		}
	}()

	const maxTicks = 1800
	tickInterval := time.Duration(game.TICK_DURATION * float64(time.Second))
	ticker := time.NewTicker(tickInterval)
	defer ticker.Stop()

	var mu sync.Mutex

	for tick := 0; tick < maxTicks; tick++ {
		select {
		case <-done:
			goto battleEnd

		case <-ticker.C:
			mu.Lock()
			var tickEvents []game.BattleEvent

			// 1. Drain incoming live reinforcement units from safe queue channel
			drained := false
			for !drained {
				select {
				case troops := <-deployCh:
					// Handled safely inside execution frame lock boundary
					deployEvents := state.AddPendingTroops(troops, &nextInstanceID)
					tickEvents = append(tickEvents, deployEvents...)
				default:
					drained = true
				}
			}

			// 2. RUN SIMULATION STEP ENGINE: Calculates physics, path movements, attacks, and deaths
			simulationEvents := game.Tick(state)
			tickEvents = append(tickEvents, simulationEvents...)

			mu.Unlock()

			// 3. Keep JSON arrays from marshalling as literal 'null' text elements
			if tickEvents == nil {
				tickEvents = []game.BattleEvent{}
			}

			if err := conn.WriteJSON(TickMessage{
				Type:   "tick",
				Tick:   state.CurrentTime,
				Events: tickEvents,
			}); err != nil {
				log.Printf("WS write tick: %v", err)
				goto battleEnd
			}

			// 4. Validate evaluation thresholds using the freshly adjusted memory metrics
			if game.AllBuildingDestroyed(state) || game.AllTroopsDead(state) {
				goto battleEnd
			}
		}
	}

battleEnd:
	ticker.Stop()

	result := game.ComputeResult(state, snapshot)
	resp, err := bh.bs.Attack(ctx, playerID, startMsg.DefenderID, bh.vs, bh.bus, result)
	if err != nil {
		log.Printf("Failed to save battle results to database: %v", err)
		conn.WriteJSON(map[string]string{"error": "internal server error saving battle"})
		return
	}

	if err := conn.WriteJSON(EndMessage{
		Type:           "battle_end",
		StarsEarned:    result.StarsEarned,
		TrophiesGained: resp.TrophiesGained,
		GoldLooted:     resp.GoldLooted,
		IronLooted:     resp.IronLooted,
		WildfireLooted: resp.WildfireLooted,
		BattleID:       resp.BattleID,
	}); err != nil {
		log.Printf("WS write battle end message failed: %v", err)
	}
}
