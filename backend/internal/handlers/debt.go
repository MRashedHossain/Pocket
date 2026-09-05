package handlers

import (
	"net/http"
	"time"

	"github.com/MRashedHossain/pocket/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type debtOut struct {
	ID         string  `json:"id"`
	Kind       string  `json:"kind"`
	Person     string  `json:"person"`
	Amount     int     `json:"amount"`
	PaidAmount int     `json:"paidAmount"`
	Remaining  int     `json:"remaining"`
	Date       string  `json:"date"`
	Due        *string `json:"due"`
	Note       *string `json:"note"`
	Category   string  `json:"category"`
	Settled    bool    `json:"settled"`
}

func getPaidAmount(db *gorm.DB, debtID string) int {
	var total int64
	db.Model(&models.Payment{}).Select("COALESCE(SUM(amount), 0)").Where("debt_id = ?", debtID).Scan(&total)
	return int(total)
}

func toDebtOut(db *gorm.DB, d models.Debt) debtOut {
	paid := getPaidAmount(db, d.ID)
	var note *string
	if d.Note != "" {
		note = &d.Note
	}
	return debtOut{
		ID: d.ID, Kind: d.Kind, Person: d.Person,
		Amount: d.Amount, PaidAmount: paid, Remaining: d.Amount - paid,
		Date: fmtDate(d.Date), Due: fmtDatePtr(d.Due), Note: note, Category: d.Category, Settled: d.Settled,
	}
}

// ── Debt Categories ───────────────────────────────────────────────────────────

func ListDebtCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cats []models.DebtCategory
		db.Where("user_id = ?", currentUser(c).ID).Find(&cats)
		c.JSON(http.StatusOK, cats)
	}
}

func CreateDebtCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		cat := models.DebtCategory{UserID: currentUser(c).ID, Name: body.Name}
		db.Create(&cat)
		c.JSON(http.StatusCreated, cat)
	}
}

func DeleteDebtCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.DebtCategory
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&cat).Error != nil {
			notFound(c, "Category")
			return
		}
		db.Delete(&cat)
		c.Status(http.StatusNoContent)
	}
}

// ── Aggregate endpoints — registered BEFORE /:id ──────────────────────────────

func DebtSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var debts []models.Debt
		db.Where("user_id = ?", currentUser(c).ID).Find(&debts)

		var totalLent, totalBorrowed, totalLentPaid, totalBorrowedPaid, open, settled int
		for _, d := range debts {
			paid := getPaidAmount(db, d.ID)
			if d.Kind == "lent" {
				totalLent += d.Amount
				totalLentPaid += paid
			} else {
				totalBorrowed += d.Amount
				totalBorrowedPaid += paid
			}
			if d.Settled {
				settled++
			} else {
				open++
			}
		}
		c.JSON(http.StatusOK, gin.H{
			"totalLent": totalLent, "totalBorrowed": totalBorrowed,
			"totalLentPaid": totalLentPaid, "totalBorrowedPaid": totalBorrowedPaid,
			"netOwed":   (totalLent - totalLentPaid) - (totalBorrowed - totalBorrowedPaid),
			"openCount": open, "settledCount": settled,
		})
	}
}

func DebtUpcoming(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		today := time.Now()
		cutoff := today.AddDate(0, 0, 7)
		var debts []models.Debt
		db.Where("user_id = ? AND settled = false AND due >= ? AND due <= ?", currentUser(c).ID, today, cutoff).
			Order("due asc").Find(&debts)
		out := make([]debtOut, len(debts))
		for i, d := range debts {
			out[i] = toDebtOut(db, d)
		}
		c.JSON(http.StatusOK, out)
	}
}

func DebtOverdue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var debts []models.Debt
		db.Where("user_id = ? AND settled = false AND due < ?", currentUser(c).ID, time.Now()).
			Order("due asc").Find(&debts)
		out := make([]debtOut, len(debts))
		for i, d := range debts {
			out[i] = toDebtOut(db, d)
		}
		c.JSON(http.StatusOK, out)
	}
}

// ── Debt CRUD ─────────────────────────────────────────────────────────────────

func ListDebts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var debts []models.Debt
		q := db.Where("user_id = ?", currentUser(c).ID)
		if kind := c.Query("kind"); kind != "" {
			q = q.Where("kind = ?", kind)
		}
		q.Order("date desc").Find(&debts)
		out := make([]debtOut, len(debts))
		for i, d := range debts {
			out[i] = toDebtOut(db, d)
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateDebt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Kind     string  `json:"kind" binding:"required,oneof=lent borrowed"`
			Person   string  `json:"person" binding:"required"`
			Amount   int     `json:"amount" binding:"required"`
			Due      *string `json:"due"`
			Note     string  `json:"note"`
			Category string  `json:"category"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		if body.Amount <= 0 {
			validationErr(c, "Amount must be greater than zero")
			return
		}
		d := models.Debt{
			UserID: currentUser(c).ID, Kind: body.Kind,
			Person: body.Person, Amount: body.Amount, Note: body.Note, Category: body.Category,
		}
		if body.Due != nil {
			due, err := parseDate(*body.Due)
			if err != nil {
				validationErr(c, "Invalid due date format")
				return
			}
			d.Due = &due
		}
		db.Create(&d)
		c.JSON(http.StatusCreated, toDebtOut(db, d))
	}
}

func GetDebt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		c.JSON(http.StatusOK, toDebtOut(db, d))
	}
}

func UpdateDebt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		var body struct {
			Kind     *string `json:"kind"`
			Person   *string `json:"person"`
			Amount   *int    `json:"amount"`
			Due      *string `json:"due"`
			Note     *string `json:"note"`
			Category *string `json:"category"`
			Settled  *bool   `json:"settled"`
		}
		c.ShouldBindJSON(&body)
		if body.Kind != nil {
			if *body.Kind != "lent" && *body.Kind != "borrowed" {
				validationErr(c, "Kind must be lent or borrowed")
				return
			}
			d.Kind = *body.Kind
		}
		if body.Person != nil {
			d.Person = *body.Person
		}
		if body.Amount != nil {
			if *body.Amount <= 0 {
				validationErr(c, "Amount must be greater than zero")
				return
			}
			if paid := getPaidAmount(db, d.ID); *body.Amount < paid {
				validationErr(c, "Amount cannot be less than what's already been paid")
				return
			}
			d.Amount = *body.Amount
		}
		if body.Due != nil {
			due, err := parseDate(*body.Due)
			if err != nil {
				validationErr(c, "Invalid due date format")
				return
			}
			d.Due = &due
		}
		if body.Note != nil {
			d.Note = *body.Note
		}
		if body.Category != nil {
			d.Category = *body.Category
		}
		if body.Settled != nil {
			d.Settled = *body.Settled
		}
		db.Save(&d)
		c.JSON(http.StatusOK, toDebtOut(db, d))
	}
}

func DeleteDebt(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Where("debt_id = ?", d.ID).Delete(&models.Payment{}).Error; err != nil {
				return err
			}
			return tx.Delete(&d).Error
		})
		if err != nil {
			errResp(c, http.StatusInternalServerError, "delete_failed", "Could not delete IOU")
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// ── Payments ──────────────────────────────────────────────────────────────────

type paymentOut struct {
	ID     string  `json:"id"`
	Amount int     `json:"amount"`
	Date   string  `json:"date"`
	Note   *string `json:"note"`
}

func toPaymentOut(p models.Payment) paymentOut {
	var note *string
	if p.Note != "" {
		note = &p.Note
	}
	return paymentOut{ID: p.ID, Amount: p.Amount, Date: fmtDate(p.Date), Note: note}
}

func AddPayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		var body struct {
			Amount int    `json:"amount" binding:"required"`
			Note   string `json:"note"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		if body.Amount <= 0 {
			validationErr(c, "Amount must be greater than zero")
			return
		}

		remaining := d.Amount - getPaidAmount(db, d.ID)
		if body.Amount > remaining {
			validationErr(c, "Payment exceeds remaining amount")
			return
		}

		p := models.Payment{DebtID: d.ID, Amount: body.Amount, Note: body.Note}
		db.Create(&p)

		// Auto-settle when fully paid
		if body.Amount == remaining {
			d.Settled = true
			db.Save(&d)
		}

		c.JSON(http.StatusCreated, toPaymentOut(p))
	}
}

func ListPayments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		var payments []models.Payment
		db.Where("debt_id = ?", d.ID).Order("date asc").Find(&payments)
		out := make([]paymentOut, len(payments))
		for i, p := range payments {
			out[i] = toPaymentOut(p)
		}
		c.JSON(http.StatusOK, out)
	}
}

func DeletePayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var d models.Debt
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&d).Error != nil {
			notFound(c, "Debt")
			return
		}
		var p models.Payment
		if db.Where("id = ? AND debt_id = ?", c.Param("paymentId"), d.ID).First(&p).Error != nil {
			notFound(c, "Payment")
			return
		}
		db.Delete(&p)

		// Reopen if debt was marked settled
		paidAfter := getPaidAmount(db, d.ID)
		if paidAfter < d.Amount && d.Settled {
			d.Settled = false
			db.Save(&d)
		}
		c.Status(http.StatusNoContent)
	}
}
