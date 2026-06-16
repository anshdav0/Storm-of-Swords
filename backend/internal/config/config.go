package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Have env stored corresponding to the one in env file
type Configure_db struct {
	Go_Port   string
	DBURL     string
	JWTSecret string
}

// Reads env file and stores them as the above struct
func LoadConfig() *Configure_db {

	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, reading from system environment variables")
	}

	cfg := &Configure_db{
		Go_Port:   getEnv("SERVER_PORT", "8080"),
		DBURL:     getEnv("DATABASE_URL", ""),
		JWTSecret: getEnv("JWT_SECRET", "default_secret_key"),
	}

	if cfg.DBURL == "" {
		log.Fatal("Critical Error: DATABASE_URL environment variable is required")
	}

	return cfg
}

// deafult value if not present in env
func getEnv(key, def_val string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return def_val
}
