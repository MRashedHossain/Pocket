package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

type budgetOut struct {
	ID        string `json:"id"`
	Category  string `json:"category"`
	Month     string `json:"month"`
	Limit     int    `json:"limit"`
	Spent     int    `json:"spent"`
	Remaining int    `json:"remaining"`
	OverLimit bool   `json:"overLimit"`
}

func enrichBudget(db *gorm.DB, b models.Budget) budgetOut {
	var spent int64
	db.Model(&models.Expense{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND category = ? AND TO_CHAR(date, 'YYYY-MM') = ?", b.UserID, b.Category, b.Month).
		Scan(&spent)
	remaining := b.Limit - int(spent)
	return budgetOut{
		ID: b.ID, Category: b.Category, Month: b.Month, Limit: b.Limit,
		Spent: int(spent), Remaining: remaining, OverLimit: int(spent) > b.Limit,
	}
}

func ListBudgets(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var budgets []models.Budget
		q := db.Where("user_id = ?", currentUser(c).ID)
		if month := c.Query("month"); month != "" {
			q = q.Where("month = ?", month)
		}
		q.Find(&budgets)
		out := make([]budgetOut, len(budgets))
		for i, b := range budgets {
			out[i] = enrichBudget(db, b)
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Category string `json:"category" binding:"required"`
			Month    string `json:"month" binding:"required"`
			Limit    *int   `json:"limit" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		if *body.Limit < 0 {
			validationErr(c, "Limit cannot be negative")
			return
		}
		b := models.Budget{UserID: currentUser(c).ID, Category: body.Category, Month: body.Month, Limit: *body.Limit}
		db.Create(&b)
		c.JSON(http.StatusCreated, enrichBudget(db, b))
	}
}

// ImportBudgets copies the previous month's budgets into the target month.
// Categories that already have a budget in the target month are skipped.
func ImportBudgets(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Month string `json:"month" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		target, err := time.Parse("2006-01", body.Month)
		if err != nil {
			validationErr(c, "month must be in YYYY-MM format")
			return
		}
		source := target.AddDate(0, -1, 0).Format("2006-01")
		userID := currentUser(c).ID

		var sourceBudgets []models.Budget
		db.Where("user_id = ? AND month = ?", userID, source).Find(&sourceBudgets)

		var existing []models.Budget
		db.Where("user_id = ? AND month = ?", userID, body.Month).Find(&existing)
		taken := make(map[string]bool, len(existing))
		for _, b := range existing {
			taken[b.Category] = true
		}

		imported := 0
		for _, src := range sourceBudgets {
			if taken[src.Category] {
				continue
			}
			b := models.Budget{UserID: userID, Category: src.Category, Month: body.Month, Limit: src.Limit}
			if err := db.Create(&b).Error; err != nil {
				errResp(c, http.StatusInternalServerError, "server_error", "Could not import budgets")
				return
			}
			imported++
		}
		c.JSON(http.StatusCreated, gin.H{
			"fromMonth": source,
			"month":     body.Month,
			"imported":  imported,
			"skipped":   len(sourceBudgets) - imported,
		})
	}
}

func BudgetSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		month := c.Query("month")
		if month == "" {
			validationErr(c, "month query parameter is required")
			return
		}
		var budgets []models.Budget
		db.Where("user_id = ? AND month = ?", currentUser(c).ID, month).Find(&budgets)

		var totalLimit, totalSpent, overLimitCount int
		for _, b := range budgets {
			e := enrichBudget(db, b)
			totalLimit += e.Limit
			totalSpent += e.Spent
			if e.OverLimit {
				overLimitCount++
			}
		}
		remaining := totalLimit - totalSpent
		c.JSON(http.StatusOK, gin.H{
			"month": month, "totalLimit": totalLimit, "totalSpent": totalSpent,
			"totalRemaining": remaining, "overLimitCount": overLimitCount, "budgetCount": len(budgets),
		})
	}
}

func BudgetUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var b models.Budget
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&b).Error != nil {
			notFound(c, "Budget")
			return
		}
		var expenses []models.Expense
		db.Where("user_id = ? AND category = ? AND TO_CHAR(date, 'YYYY-MM') = ?", b.UserID, b.Category, b.Month).Find(&expenses)

		spent := 0
		expOut := make([]gin.H, len(expenses))
		for i, e := range expenses {
			spent += e.Amount
			expOut[i] = gin.H{"id": e.ID, "date": fmtDate(e.Date), "amount": e.Amount, "note": e.Note}
		}
		remaining := b.Limit - spent
		c.JSON(http.StatusOK, gin.H{
			"budget":    enrichBudget(db, b),
			"spent":     spent,
			"remaining": remaining,
			"overLimit": spent > b.Limit,
			"expenses":  expOut,
		})
	}
}

func GetBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var b models.Budget
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&b).Error != nil {
			notFound(c, "Budget")
			return
		}
		c.JSON(http.StatusOK, enrichBudget(db, b))
	}
}

func UpdateBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var b models.Budget
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&b).Error != nil {
			notFound(c, "Budget")
			return
		}
		var body struct {
			Category *string `json:"category"`
			Month    *string `json:"month"`
			Limit    *int    `json:"limit"`
		}
		c.ShouldBindJSON(&body)
		if body.Category != nil {
			b.Category = *body.Category
		}
		if body.Month != nil {
			b.Month = *body.Month
		}
		if body.Limit != nil {
			b.Limit = *body.Limit
		}
		db.Save(&b)
		c.JSON(http.StatusOK, enrichBudget(db, b))
	}
}

func DeleteBudget(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var b models.Budget
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&b).Error != nil {
			notFound(c, "Budget")
			return
		}
		db.Delete(&b)
		c.Status(http.StatusNoContent)
	}
}
