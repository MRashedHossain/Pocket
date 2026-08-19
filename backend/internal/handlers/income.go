package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

// ── Income Categories ─────────────────────────────────────────────────────────

func ListIncomeCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cats []models.IncomeCategory
		db.Where("user_id = ?", currentUser(c).ID).Find(&cats)
		c.JSON(http.StatusOK, cats)
	}
}

func CreateIncomeCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		cat := models.IncomeCategory{UserID: currentUser(c).ID, Name: body.Name}
		db.Create(&cat)
		c.JSON(http.StatusCreated, cat)
	}
}

func UpdateIncomeCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.IncomeCategory
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&cat).Error != nil {
			notFound(c, "Category")
			return
		}
		var body struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		cat.Name = body.Name
		db.Save(&cat)
		c.JSON(http.StatusOK, cat)
	}
}

func DeleteIncomeCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.IncomeCategory
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&cat).Error != nil {
			notFound(c, "Category")
			return
		}
		db.Delete(&cat)
		c.Status(http.StatusNoContent)
	}
}

// ── Income CRUD ───────────────────────────────────────────────────────────────

type incomeOut struct {
	ID       string `json:"id"`
	Date     string `json:"date"`
	Category string `json:"category"`
	Amount   int    `json:"amount"`
	Note     string `json:"note"`
}

func toIncomeOut(i models.Income) incomeOut {
	return incomeOut{ID: i.ID, Date: fmtDate(i.Date), Category: i.Category, Amount: i.Amount, Note: i.Note}
}

func ListIncome(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Income
		q := db.Where("user_id = ?", currentUser(c).ID)
		if month := c.Query("month"); month != "" {
			q = q.Where("TO_CHAR(date, 'YYYY-MM') = ?", month)
		}
		q.Order("date desc").Find(&items)
		out := make([]incomeOut, len(items))
		for i, item := range items {
			out[i] = toIncomeOut(item)
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateIncome(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Date     string `json:"date" binding:"required"`
			Category string `json:"category" binding:"required"`
			Amount   int    `json:"amount" binding:"required"`
			Note     string `json:"note"`
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
		if body.Note == "" {
			body.Note = "Unspecified"
		}
		item := models.Income{UserID: currentUser(c).ID, Date: date, Category: body.Category, Amount: body.Amount, Note: body.Note}
		db.Create(&item)
		c.JSON(http.StatusCreated, toIncomeOut(item))
	}
}

func GetIncome(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item models.Income
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&item).Error != nil {
			notFound(c, "Income")
			return
		}
		c.JSON(http.StatusOK, toIncomeOut(item))
	}
}

func UpdateIncome(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item models.Income
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&item).Error != nil {
			notFound(c, "Income")
			return
		}
		var body struct {
			Date     *string `json:"date"`
			Category *string `json:"category"`
			Amount   *int    `json:"amount"`
			Note     *string `json:"note"`
		}
		c.ShouldBindJSON(&body)
		if body.Date != nil {
			d, err := parseDate(*body.Date)
			if err != nil {
				validationErr(c, "Invalid date format")
				return
			}
			item.Date = d
		}
		if body.Category != nil {
			item.Category = *body.Category
		}
		if body.Amount != nil {
			if *body.Amount <= 0 {
				validationErr(c, "Amount must be greater than zero")
				return
			}
			item.Amount = *body.Amount
		}
		if body.Note != nil {
			item.Note = *body.Note
		}
		db.Save(&item)
		c.JSON(http.StatusOK, toIncomeOut(item))
	}
}

func DeleteIncome(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item models.Income
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&item).Error != nil {
			notFound(c, "Income")
			return
		}
		db.Delete(&item)
		c.Status(http.StatusNoContent)
	}
}
