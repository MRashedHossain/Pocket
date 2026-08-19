package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/gorm"
)

func ListAccounts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var accounts []models.Account
		db.Where("user_id = ?", currentUser(c).ID).Find(&accounts)
		c.JSON(http.StatusOK, accounts)
	}
}

func CreateAccount(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name    string `json:"name" binding:"required"`
			Type    string `json:"type" binding:"required"`
			Balance int    `json:"balance"`
			Note    string `json:"note"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}
		a := models.Account{UserID: currentUser(c).ID, Name: body.Name, Type: body.Type, Balance: body.Balance, Note: body.Note}
		db.Create(&a)
		c.JSON(http.StatusCreated, a)
	}
}

func GetAccountBalance(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var a models.Account
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&a).Error != nil {
			notFound(c, "Account")
			return
		}
		c.JSON(http.StatusOK, gin.H{"id": a.ID, "name": a.Name, "balance": a.Balance})
	}
}

func GetAccount(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var a models.Account
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&a).Error != nil {
			notFound(c, "Account")
			return
		}
		c.JSON(http.StatusOK, a)
	}
}

func UpdateAccount(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var a models.Account
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&a).Error != nil {
			notFound(c, "Account")
			return
		}
		var body struct {
			Name    *string `json:"name"`
			Type    *string `json:"type"`
			Balance *int    `json:"balance"`
			Note    *string `json:"note"`
		}
		c.ShouldBindJSON(&body)
		if body.Name != nil {
			a.Name = *body.Name
		}
		if body.Type != nil {
			a.Type = *body.Type
		}
		if body.Balance != nil {
			a.Balance = *body.Balance
		}
		if body.Note != nil {
			a.Note = *body.Note
		}
		db.Save(&a)
		c.JSON(http.StatusOK, a)
	}
}

func DeleteAccount(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var a models.Account
		if db.Where("id = ? AND user_id = ?", c.Param("id"), currentUser(c).ID).First(&a).Error != nil {
			notFound(c, "Account")
			return
		}
		db.Delete(&a)
		c.Status(http.StatusNoContent)
	}
}
