package middleware

import (
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

var (
	mu        sync.RWMutex
	blacklist = make(map[string]bool)
)

func BlacklistToken(token string) {
	mu.Lock()
	defer mu.Unlock()
	blacklist[token] = true
}

func IsBlacklisted(token string) bool {
	mu.RLock()
	defer mu.RUnlock()
	return blacklist[token]
}

func Auth(secret string, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "unauthorized", "message": "Missing bearer token"}})
			return
		}
		raw := strings.TrimPrefix(header, "Bearer ")

		if IsBlacklisted(raw) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "unauthorized", "message": "Token has been invalidated"}})
			return
		}

		token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "unauthorized", "message": "Invalid token"}})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "unauthorized", "message": "Invalid token claims"}})
			return
		}

		userID, _ := claims["sub"].(string)
		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": gin.H{"code": "unauthorized", "message": "User not found"}})
			return
		}

		c.Set("user", &user)
		c.Set("token", raw)
		c.Next()
	}
}
