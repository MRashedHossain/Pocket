package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/cache"
	"github.com/MRashedHossain/pocket/internal/models"
)

// CacheBust drops the current user's cached reads (dashboard, settings, category
// lists) after any successful mutating request. This is the single place writes
// invalidate the cache, so individual handlers don't have to remember to.
func CacheBust() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if c.Request.Method == "GET" || c.Request.Method == "OPTIONS" || c.Request.Method == "HEAD" {
			return
		}
		if c.Writer.Status() >= 300 {
			return
		}
		if u, ok := c.Get("user"); ok {
			if user, ok := u.(*models.User); ok {
				cache.BustUser(user.ID)
			}
		}
	}
}
