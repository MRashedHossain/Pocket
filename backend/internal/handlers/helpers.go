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

// dateWindow describes a half-open [Start, End) range plus display metadata.
// It is what the dashboard and list endpoints filter on so a single day and a
// whole month go through the exact same code path.
type dateWindow struct {
	Start time.Time
	End   time.Time
	Label string // human label, e.g. "August 2026" or "29 August 2026"
	IsDay bool
}

// monthWindow returns the [first day, next month) range for a "YYYY-MM" string.
func monthWindow(month string) (dateWindow, bool) {
	t, err := time.Parse("2006-01", month)
	if err != nil {
		return dateWindow{}, false
	}
	return dateWindow{
		Start: t,
		End:   t.AddDate(0, 1, 0),
		Label: t.Format("January 2006"),
		IsDay: false,
	}, true
}

// dayWindow returns the [day, next day) range for a "YYYY-MM-DD" string.
func dayWindow(day string) (dateWindow, bool) {
	t, err := time.Parse("2006-01-02", day)
	if err != nil {
		return dateWindow{}, false
	}
	return dateWindow{
		Start: t,
		End:   t.AddDate(0, 0, 1),
		Label: t.Format("2 January 2006"),
		IsDay: true,
	}, true
}

// resolveWindow reads either ?date=YYYY-MM-DD or ?month=YYYY-MM from the request,
// defaulting to the current month. ok is false only when a param was supplied
// but could not be parsed.
func resolveWindow(c *gin.Context) (dateWindow, bool) {
	if day := c.Query("date"); day != "" {
		return dayWindow(day)
	}
	month := c.Query("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}
	return monthWindow(month)
}
