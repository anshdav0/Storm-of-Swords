package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/anshdav0/Storm-of-Swords.git/internal/config"
	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
	"github.com/gorilla/mux"
)

func main() {
	log.Println("Starting Storm-of-Swords Game Server...")

	//configuration storing in cfg
	cfg := config.LoadConfig()

	// 16. Pass the newly named DBURL field to your database pool
	pool, err := db.ConnectDB(cfg.DBURL)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer pool.Close()

	store := db.MakeStore(pool)
	_ = store

	router := mux.NewRouter()

	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "Server Operational")
	}).Methods("GET")

	// 17. Use the newly named Go_Port field to bind the server address
	serverAddr := fmt.Sprintf(":%s", cfg.Go_Port)
	log.Printf("Server is running! Listening on %s\n", serverAddr)

	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatalf("Critical Server Failure: %v", err)
	}
}
