package controller

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthControl struct {
	ps        *models.PlayerStore
	vs        *models.VillageStore
	bs        *models.BuildingStore
	jwtsecret string
}

func NewAuthController(playerStore *models.PlayerStore, villageStore *models.VillageStore, buildingStore *models.BuildingStore, jwtSecret string) *AuthControl {
	return &AuthControl{
		ps:        playerStore,
		vs:        villageStore,
		bs:        buildingStore,
		jwtsecret: jwtSecret,
	}
}

type authenticationrequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type authenticatedresponse struct {
	Token    string `json:"token"`
	PlayerID int64  `json:"player_id"`
	Username string `json:"username"`
}

func (authctrl *AuthControl) Register(w http.ResponseWriter, r *http.Request) {
	log.Println("Register handler hit")
	//decode request and store as req
	var req authenticationrequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body: ", http.StatusBadRequest)
		return
	}

	//hashify pass
	hash, err1 := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err1 != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	//create player
	player, _, err2 := authctrl.ps.CreatePlayerandVillage(context.Background(), req.Username, string(hash), authctrl.bs, authctrl.vs)
	if err2 != nil {
		http.Error(w, "Username already taken", http.StatusConflict)
		return
	}

	//generate token
	token, err := authctrl.generateToken(player.ID)
	if err != nil {
		http.Error(w, "Accpunt created but Failed to generate token, try logging in: ", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, authenticatedresponse{
		Token:    token,
		PlayerID: player.ID,
		Username: player.Username,
	})
}

func (authctrl *AuthControl) Login(w http.ResponseWriter, r *http.Request) {
	log.Println("Login hit")
	//decode request and store as req
	var req authenticationrequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	//look for id
	player, exists, err := authctrl.ps.FindUser(context.Background(), req.Username)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if !exists {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	//compare the passhash
	if err := bcrypt.CompareHashAndPassword([]byte(player.PassHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	//generate token
	token, err := authctrl.generateToken(player.ID)
	if err != nil {
		http.Error(w, "Try again, Failed to generate token", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, authenticatedresponse{
		Token:    token,
		PlayerID: player.ID,
		Username: player.Username,
	})
}

func (authctrl *AuthControl) generateToken(playerID int64) (string, error) {
	claims := jwt.MapClaims{
		"player_id": playerID,
		"exp":       time.Now().Add(24 * time.Hour).Unix(),
		"issuedat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(authctrl.jwtsecret))
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
