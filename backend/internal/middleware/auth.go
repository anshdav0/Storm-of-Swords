package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

const PlayerIDKey string = "player_id"

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Format must be: Bearer <token>", http.StatusUnauthorized)
				return
			}
			tokenStr := parts[1]

			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				_, ok := token.Method.(*jwt.SigningMethodHMAC)
				if !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "invalid token claims", http.StatusUnauthorized)
				return
			}

			playerIDFloat, ok := claims["player_id"].(float64)
			if !ok {
				http.Error(w, "Invalid token payload", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), PlayerIDKey, int64(playerIDFloat))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetPlayerID(r *http.Request) (int64, bool) {
	value := r.Context().Value(PlayerIDKey)
	id, ok := value.(int64)
	return id, ok
}
