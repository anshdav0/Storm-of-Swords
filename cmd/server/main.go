package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/anshdav0/Storm-of-Swords.git/internal/config"
	"github.com/anshdav0/Storm-of-Swords.git/internal/db"
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

	router := http.NewServeMux()

	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "Server Status: High-Operational.")
	})

	// 17. Use the newly named Go_Port field to bind the server address
	serverAddr := fmt.Sprintf(":%s", cfg.Go_Port)
	log.Printf("Server is running! Listening on %s\n", serverAddr)

	if err := http.ListenAndServe(serverAddr, router); err != nil {
		log.Fatalf("Critical Server Failure: %v", err)
	}
}
