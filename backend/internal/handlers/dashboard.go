package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

// sumAmount totals the `amount` column of tbl for a user within a half-open
// [Start, End) date window. Range predicates (not TO_CHAR) so the
// (user_id, date) index is used.
func sumAmount(db *gorm.DB, tbl any, uid string, w dateWindow) int {
	var total int64
	db.Model(tbl).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND date >= ? AND date < ?", uid, w.Start, w.End).Scan(&total)
	return int(total)
}

func windowIncome(db *gorm.DB, uid string, w dateWindow) int {
	return sumAmount(db, &models.Income{}, uid, w)
}

func windowExpense(db *gorm.DB, uid string, w dateWindow) int {
	return sumAmount(db, &models.Expense{}, uid, w)
}

func totalBalance(db *gorm.DB, userID string) int {
	var inc, exp int64
	db.Model(&models.Income{}).Select("COALESCE(SUM(amount), 0)").Where("user_id = ?", userID).Scan(&inc)
	db.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").Where("user_id = ?", userID).Scan(&exp)
	return int(inc - exp)
}

func DashboardSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		w, ok := resolveWindow(c)
		if !ok {
			validationErr(c, "Invalid date or month, use YYYY-MM-DD or YYYY-MM")
			return
		}
		uid := currentUser(c).ID
		inc := windowIncome(db, uid, w)
		exp := windowExpense(db, uid, w)
		c.JSON(http.StatusOK, gin.H{
			"month": w.Start.Format("2006-01"), "date": dayParam(w), "label": w.Label, "isDay": w.IsDay,
			"balance":     totalBalance(db, uid),
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
			w, _ := monthWindow(d.Format("2006-01"))
			points[months-1-i] = gin.H{
				"month":   d.Format("2006-01"),
				"income":  windowIncome(db, uid, w),
				"expense": windowExpense(db, uid, w),
			}
		}
		c.JSON(http.StatusOK, gin.H{"points": points})
	}
}

// dayParam is the "YYYY-MM-DD" string for a day window, or "" for a month.
func dayParam(w dateWindow) string {
	if w.IsDay {
		return w.Start.Format("2006-01-02")
	}
	return ""
}

func Dashboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		w, ok := resolveWindow(c)
		if !ok {
			validationErr(c, "Invalid date or month, use YYYY-MM-DD or YYYY-MM")
			return
		}
		uid := currentUser(c).ID

		inc := windowIncome(db, uid, w)
		exp := windowExpense(db, uid, w)

		var incomeCount, expenseCount int64
		db.Model(&models.Income{}).Where("user_id = ? AND date >= ? AND date < ?", uid, w.Start, w.End).Count(&incomeCount)
		db.Model(&models.Expense{}).Where("user_id = ? AND date >= ? AND date < ?", uid, w.Start, w.End).Count(&expenseCount)

		savingsRate := 0
		if inc > 0 {
			savingsRate = (inc - exp) * 100 / inc
		}

		type catRow struct {
			Category string
			Total    int64
		}

		// Expense by category — also reused below for budget "spent" so we don't
		// fire one SUM per budget row.
		var expCats []catRow
		db.Model(&models.Expense{}).Select("category, SUM(amount) as total").
			Where("user_id = ? AND date >= ? AND date < ?", uid, w.Start, w.End).
			Group("category").Scan(&expCats)
		spentByCat := make(map[string]int64, len(expCats))
		expByCat := make([]gin.H, len(expCats))
		for i, r := range expCats {
			spentByCat[r.Category] = r.Total
			pct := 0
			if exp > 0 {
				pct = int(r.Total) * 100 / exp
			}
			expByCat[i] = gin.H{"category": r.Category, "amount": r.Total, "pct": pct}
		}

		// Income by category
		var incCats []catRow
		db.Model(&models.Income{}).Select("category, SUM(amount) as total").
			Where("user_id = ? AND date >= ? AND date < ?", uid, w.Start, w.End).
			Group("category").Scan(&incCats)
		incByCat := make([]gin.H, len(incCats))
		for i, r := range incCats {
			pct := 0
			if inc > 0 {
				pct = int(r.Total) * 100 / inc
			}
			incByCat[i] = gin.H{"category": r.Category, "amount": r.Total, "pct": pct}
		}

		// Budget statuses — budgets are monthly, so they track the month that
		// contains the selected window (spent is scoped to the window itself).
		budgetMonth := w.Start.Format("2006-01")
		var budgets []models.Budget
		db.Where("user_id = ? AND month = ?", uid, budgetMonth).Find(&budgets)
		budgetStats := make([]gin.H, len(budgets))
		for i, b := range budgets {
			spent := spentByCat[b.Category]
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

		payload := gin.H{
			"month": budgetMonth, "date": dayParam(w), "label": w.Label, "isDay": w.IsDay,
			"balance":     totalBalance(db, uid),
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
		}

		c.JSON(http.StatusOK, payload)
	}
}
