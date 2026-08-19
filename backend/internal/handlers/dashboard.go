package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

func currentMonth() string {
	return time.Now().Format("2006-01")
}

func monthIncome(db *gorm.DB, userID, month string) int {
	var total int64
	db.Model(&models.Income{}).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", userID, month).Scan(&total)
	return int(total)
}

func monthExpense(db *gorm.DB, userID, month string) int {
	var total int64
	db.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", userID, month).Scan(&total)
	return int(total)
}

func totalBalance(db *gorm.DB, userID string) int {
	var inc, exp int64
	db.Model(&models.Income{}).Select("COALESCE(SUM(amount), 0)").Where("user_id = ?", userID).Scan(&inc)
	db.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").Where("user_id = ?", userID).Scan(&exp)
	return int(inc - exp)
}

func DashboardSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		month := c.DefaultQuery("month", currentMonth())
		uid := currentUser(c).ID
		inc := monthIncome(db, uid, month)
		exp := monthExpense(db, uid, month)
		c.JSON(http.StatusOK, gin.H{
			"month": month, "balance": totalBalance(db, uid),
			"monthIncome": inc, "monthExpense": exp, "monthNet": inc - exp,
		})
	}
}

func DashboardTrend(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		months := 6
		uid := currentUser(c).ID
		today := time.Now()
		points := make([]gin.H, months)
		for i := months - 1; i >= 0; i-- {
			d := today.AddDate(0, -i, 0)
			m := d.Format("2006-01")
			points[months-1-i] = gin.H{
				"month":   m,
				"income":  monthIncome(db, uid, m),
				"expense": monthExpense(db, uid, m),
			}
		}
		c.JSON(http.StatusOK, gin.H{"points": points})
	}
}

func Dashboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		month := c.DefaultQuery("month", currentMonth())
		uid := currentUser(c).ID

		inc := monthIncome(db, uid, month)
		exp := monthExpense(db, uid, month)

		var incomeCount, expenseCount int64
		db.Model(&models.Income{}).Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", uid, month).Count(&incomeCount)
		db.Model(&models.Expense{}).Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", uid, month).Count(&expenseCount)

		savingsRate := 0
		if inc > 0 {
			savingsRate = (inc - exp) * 100 / inc
		}

		// Expense by category
		type catRow struct {
			Category string
			Total    int64
		}
		var expCats []catRow
		db.Model(&models.Expense{}).Select("category, SUM(amount) as total").
			Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", uid, month).
			Group("category").Scan(&expCats)
		expByCat := make([]gin.H, len(expCats))
		for i, r := range expCats {
			pct := 0
			if exp > 0 {
				pct = int(r.Total) * 100 / exp
			}
			expByCat[i] = gin.H{"category": r.Category, "amount": r.Total, "pct": pct}
		}

		// Income by category
		var incCats []catRow
		db.Model(&models.Income{}).Select("category, SUM(amount) as total").
			Where("user_id = ? AND TO_CHAR(date, 'YYYY-MM') = ?", uid, month).
			Group("category").Scan(&incCats)
		incByCat := make([]gin.H, len(incCats))
		for i, r := range incCats {
			pct := 0
			if inc > 0 {
				pct = int(r.Total) * 100 / inc
			}
			incByCat[i] = gin.H{"category": r.Category, "amount": r.Total, "pct": pct}
		}

		// Budget statuses
		var budgets []models.Budget
		db.Where("user_id = ? AND month = ?", uid, month).Find(&budgets)
		budgetStats := make([]gin.H, len(budgets))
		for i, b := range budgets {
			var spent int64
			db.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").
				Where("user_id = ? AND category = ? AND TO_CHAR(date, 'YYYY-MM') = ?", uid, b.Category, month).Scan(&spent)
			budgetStats[i] = gin.H{"category": b.Category, "spent": spent, "limit": b.Limit, "overLimit": int(spent) > b.Limit}
		}

		// Debt stats
		var debts []models.Debt
		db.Where("user_id = ?", uid).Find(&debts)
		var totalLent, totalBorrowed, openCount, settledCount int
		for _, d := range debts {
			if !d.Settled {
				if d.Kind == "lent" {
					totalLent += d.Amount
				} else {
					totalBorrowed += d.Amount
				}
				openCount++
			} else {
				settledCount++
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"month": month, "balance": totalBalance(db, uid),
			"monthIncome": inc, "monthExpense": exp, "monthNet": inc - exp,
			"expenseCount": expenseCount, "incomeCount": incomeCount,
			"savingsRatePct":    savingsRate,
			"expenseByCategory": expByCat,
			"incomeByCategory":  incByCat,
			"budgets":           budgetStats,
			"debts": gin.H{
				"lent": totalLent, "borrowed": totalBorrowed,
				"net":          totalLent - totalBorrowed,
				"openCount":    openCount,
				"settledCount": settledCount,
			},
		})
	}
}
