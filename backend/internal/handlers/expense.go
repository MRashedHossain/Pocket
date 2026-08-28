package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

// ── Expense Categories ────────────────────────────────────────────────────────

func ListExpenseCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cats []models.ExpenseCategory
		db.Where("user_id = ?", currentUser(c).ID).Find(&cats)
		c.JSON(http.StatusOK, cats)
	}
}

func CreateExpenseCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name  string `json:"name" binding:"required"`
			Limit int    `json:"limit"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		cat := models.ExpenseCategory{UserID: currentUser(c).ID, Name: body.Name, Limit: body.Limit}
		db.Create(&cat)
		c.JSON(http.StatusCreated, cat)
	}
}

func UpdateExpenseCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.ExpenseCategory
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&cat).Error != nil {
			notFound(c, "Category")
			return
		}
		var body struct {
			Name  *string `json:"name"`
			Limit *int    `json:"limit"`
		}
		c.ShouldBindJSON(&body)
		if body.Name != nil {
			cat.Name = *body.Name
		}
		if body.Limit != nil {
			cat.Limit = *body.Limit
		}
		db.Save(&cat)
		c.JSON(http.StatusOK, cat)
	}
}

func DeleteExpenseCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.ExpenseCategory
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&cat).Error != nil {
			notFound(c, "Category")
			return
		}
		db.Delete(&cat)
		c.Status(http.StatusNoContent)
	}
}

// ── Expenses ──────────────────────────────────────────────────────────────────

type expenseOut struct {
	ID       string  `json:"id"`
	Date     string  `json:"date"`
	Category string  `json:"category"`
	Amount   int     `json:"amount"`
	Note     string  `json:"note"`
	Method   *string `json:"method"`
}

func toExpenseOut(e models.Expense) expenseOut {
	var method *string
	if e.Method != "" {
		method = &e.Method
	}
	return expenseOut{ID: e.ID, Date: fmtDate(e.Date), Category: e.Category, Amount: e.Amount, Note: e.Note, Method: method}
}

func ListExpenses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var expenses []models.Expense
		q := db.Where("user_id = ?", currentUser(c).ID)
		if day := c.Query("date"); day != "" {
			if w, ok := dayWindow(day); ok {
				q = q.Where("date >= ? AND date < ?", w.Start, w.End)
			}
		} else if month := c.Query("month"); month != "" {
			if w, ok := monthWindow(month); ok {
				q = q.Where("date >= ? AND date < ?", w.Start, w.End)
			}
		}
		q.Order("date desc").Find(&expenses)
		out := make([]expenseOut, len(expenses))
		for i, e := range expenses {
			out[i] = toExpenseOut(e)
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateExpense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Date     string `json:"date" binding:"required"`
			Category string `json:"category" binding:"required"`
			Amount   int    `json:"amount" binding:"required"`
			Note     string `json:"note"`
			Method   string `json:"method"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		if body.Amount <= 0 {
			validationErr(c, "Amount must be greater than zero")
			return
		}
		date, err := parseDate(body.Date)
		if err != nil {
			validationErr(c, "Invalid date format, use YYYY-MM-DD")
			return
		}
		e := models.Expense{UserID: currentUser(c).ID, Date: date, Category: body.Category, Amount: body.Amount, Note: body.Note, Method: body.Method}
		db.Create(&e)
		c.JSON(http.StatusCreated, toExpenseOut(e))
	}
}

func GetExpense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var e models.Expense
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&e).Error != nil {
			notFound(c, "Expense")
			return
		}
		c.JSON(http.StatusOK, toExpenseOut(e))
	}
}

func UpdateExpense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var e models.Expense
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&e).Error != nil {
			notFound(c, "Expense")
			return
		}
		var body struct {
			Date     *string `json:"date"`
			Category *string `json:"category"`
			Amount   *int    `json:"amount"`
			Note     *string `json:"note"`
			Method   *string `json:"method"`
		}
		c.ShouldBindJSON(&body)
		if body.Date != nil {
			d, err := parseDate(*body.Date)
			if err != nil {
				validationErr(c, "Invalid date format")
				return
			}
			e.Date = d
		}
		if body.Category != nil {
			e.Category = *body.Category
		}
		if body.Amount != nil {
			if *body.Amount <= 0 {
				validationErr(c, "Amount must be greater than zero")
				return
			}
			e.Amount = *body.Amount
		}
		if body.Note != nil {
			e.Note = *body.Note
		}
		if body.Method != nil {
			e.Method = *body.Method
		}
		db.Save(&e)
		c.JSON(http.StatusOK, toExpenseOut(e))
	}
}

func DeleteExpense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var e models.Expense
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&e).Error != nil {
			notFound(c, "Expense")
			return
		}
		db.Delete(&e)
		c.Status(http.StatusNoContent)
	}
}
