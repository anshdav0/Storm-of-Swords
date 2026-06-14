package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/anshdav0/Storm-of-Swords.git/internal/config"
	"github.com/anshdav0/Storm-of-Swords.git/internal/controller"
	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
	"github.com/anshdav0/Storm-of-Swords.git/internal/middleware"
	"github.com/anshdav0/Storm-of-Swords.git/internal/models"
)

func main() {
	log.Println("Starting Storm-of-Swords Game Server...")

	//configuration storing in cfg
	cfg := config.LoadConfig()

	pool, err := db.ConnectDB(cfg.DBURL)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer pool.Close()

	//storing the connectionpool
	store := db.MakeStore(pool)
	playerStore := models.NewPlayerStore(store)
	villageStore := models.NewVillageStore(store)
	buildingStore := models.NewBuildingStore(store)
	troopStore := models.NewTroopStore(store)

	authCtrl := controller.NewAuthController(playerStore, villageStore, buildingStore, cfg.JWTSecret)
	villageCtrl := controller.NewVillageController(villageStore, buildingStore)
	troopCtrl := controller.NewTroopController(troopStore, villageStore, buildingStore)
	resourceCtrl := controller.NewResourceController(villageStore, buildingStore)

	router := mux.NewRouter()

	//to test server worked
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "Server Operational")
	}).Methods("GET")

	//pages for login/register
	router.HandleFunc("/register", authCtrl.Register).Methods(http.MethodPost)
	router.HandleFunc("/login", authCtrl.Login).Methods(http.MethodPost)

	protected := router.PathPrefix("").Subrouter()
	protected.Use(middleware.Auth(cfg.JWTSecret))
	protected.HandleFunc("/api/village", villageCtrl.GetVillageBuildings).Methods("GET")
	protected.HandleFunc("/api/village/changelayout", villageCtrl.SaveLayout).Methods("POST")
	protected.HandleFunc("/api/village/buildings", villageCtrl.AddBuilding).Methods("POST")
	protected.HandleFunc("/api/village/buildings/{id}/upgrade", villageCtrl.UpgradeBuilding).Methods("POST")
	protected.HandleFunc("/api/village/collect/{resource_type}", resourceCtrl.CollectResources).Methods("POST")
	protected.HandleFunc("/api/army", troopCtrl.GetArmy).Methods("GET")
	protected.HandleFunc("/api/army/recruit", troopCtrl.RecruitTroop).Methods("POST")

	serverAddr := fmt.Sprintf(":%s", cfg.Go_Port)
	log.Printf("Server is running! Listening on %s\n", serverAddr)

	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatalf("Critical Server Failure: %v", err)
	}
}
