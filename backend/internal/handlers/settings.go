package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

func getOrCreateSettings(db *gorm.DB, userID string) models.UserSettings {
	var s models.UserSettings
	if db.Where("user_id = ?", userID).First(&s).Error != nil {
		s = models.UserSettings{UserID: userID, CurrencySymbol: "৳", Density: "Comfortable", ShowTrend: true}
		db.Create(&s)
	}
	return s
}

func GetSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		s := getOrCreateSettings(db, currentUser(c).ID)
		c.JSON(http.StatusOK, gin.H{
			"currencySymbol": s.CurrencySymbol,
			"density":        s.Density,
			"showTrend":      s.ShowTrend,
		})
	}
}

func UpdateSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		s := getOrCreateSettings(db, currentUser(c).ID)
		var body struct {
			CurrencySymbol *string `json:"currencySymbol"`
			Density        *string `json:"density"`
			ShowTrend      *bool   `json:"showTrend"`
		}
		c.ShouldBindJSON(&body)
		if body.CurrencySymbol != nil {
			s.CurrencySymbol = *body.CurrencySymbol
		}
		if body.Density != nil {
			s.Density = *body.Density
		}
		if body.ShowTrend != nil {
			s.ShowTrend = *body.ShowTrend
		}
		db.Save(&s)
		c.JSON(http.StatusOK, gin.H{
			"currencySymbol": s.CurrencySymbol,
			"density":        s.Density,
			"showTrend":      s.ShowTrend,
		})
	}
}

func CreateSettingsCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name string `json:"name" binding:"required"`
			Kind string `json:"kind" binding:"required,oneof=income expense"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		uid := currentUser(c).ID
		if body.Kind == "income" {
			cat := models.IncomeCategory{UserID: uid, Name: body.Name}
			db.Create(&cat)
			c.JSON(http.StatusCreated, gin.H{"id": cat.ID, "name": cat.Name, "kind": "income"})
		} else {
			cat := models.ExpenseCategory{UserID: uid, Name: body.Name, Limit: 0}
			db.Create(&cat)
			c.JSON(http.StatusCreated, gin.H{"id": cat.ID, "name": cat.Name, "kind": "expense"})
		}
	}
}

func RenameSettingsCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid := currentUser(c).ID
		id := c.Param("id")
		var body struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		var inc models.IncomeCategory
		if db.Where("id = ? AND user_id = ?", id, uid).First(&inc).Error == nil {
			inc.Name = body.Name
			db.Save(&inc)
			c.JSON(http.StatusOK, gin.H{"id": inc.ID, "name": inc.Name, "kind": "income"})
			return
		}
		var exp models.ExpenseCategory
		if db.Where("id = ? AND user_id = ?", id, uid).First(&exp).Error == nil {
			exp.Name = body.Name
			db.Save(&exp)
			c.JSON(http.StatusOK, gin.H{"id": exp.ID, "name": exp.Name, "kind": "expense"})
			return
		}
		notFound(c, "Category")
	}
}

func DeleteSettingsCategory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid := currentUser(c).ID
		id := c.Param("id")
		var inc models.IncomeCategory
		if db.Where("id = ? AND user_id = ?", id, uid).First(&inc).Error == nil {
			db.Delete(&inc)
			c.Status(http.StatusNoContent)
			return
		}
		var exp models.ExpenseCategory
		if db.Where("id = ? AND user_id = ?", id, uid).First(&exp).Error == nil {
			db.Delete(&exp)
			c.Status(http.StatusNoContent)
			return
		}
		notFound(c, "Category")
	}
}
