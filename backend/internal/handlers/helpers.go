package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
)

func errResp(c *gin.Context, status int, code, msg string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": msg}})
}

func notFound(c *gin.Context, resource string) {
	errResp(c, http.StatusNotFound, "not_found", resource+" not found")
}

func validationErr(c *gin.Context, msg string) {
	errResp(c, http.StatusBadRequest, "validation_error", msg)
}

func currentUser(c *gin.Context) *models.User {
	u, _ := c.Get("user")
	return u.(*models.User)
}

func currentToken(c *gin.Context) string {
	t, _ := c.Get("token")
	s, _ := t.(string)
	return s
}

func fmtDate(t time.Time) string {
	return t.Format("2006-01-02")
}

func fmtDatePtr(t *time.Time) *string {
	if t == nil || t.IsZero() {
		return nil
	}
	s := t.Format("2006-01-02")
	return &s
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
