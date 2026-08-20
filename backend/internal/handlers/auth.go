package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/MRashedHossain/pocket/internal/middleware"
	"github.com/MRashedHossain/pocket/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func makeToken(userID, secret string, expMins int) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(time.Duration(expMins) * time.Minute).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

type authOut struct {
	Token string  `json:"token"`
	User  userOut `json:"user"`
}

type userOut struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func Register(db *gorm.DB, secret string, expMins int) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name     string `json:"name" binding:"required"`
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=6"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}

		var existing models.User
		if db.Where("email = ?", body.Email).First(&existing).Error == nil {
			errResp(c, http.StatusConflict, "conflict", "Email already registered")
			return
		}

		hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
		user := models.User{Name: body.Name, Email: body.Email, HashedPassword: string(hash)}
		if err := db.Create(&user).Error; err != nil {
			errResp(c, http.StatusInternalServerError, "server_error", "Failed to create user")
			return
		}
		db.Create(&models.UserSettings{UserID: user.ID})

		token, _ := makeToken(user.ID, secret, expMins)
		c.JSON(http.StatusCreated, authOut{Token: token, User: userOut{ID: user.ID, Name: user.Name, Email: user.Email}})
	}
}

func Login(db *gorm.DB, secret string, expMins int) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string `json:"email" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}

		var user models.User
		if err := db.Where("email = ?", body.Email).First(&user).Error; err != nil {
			errResp(c, http.StatusUnauthorized, "unauthorized", "Invalid credentials")
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(body.Password)) != nil {
			errResp(c, http.StatusUnauthorized, "unauthorized", "Invalid credentials")
			return
		}

		token, _ := makeToken(user.ID, secret, expMins)
		c.JSON(http.StatusOK, authOut{Token: token, User: userOut{ID: user.ID, Name: user.Name, Email: user.Email}})
	}
}

func Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		middleware.BlacklistToken(currentToken(c))
		c.Status(http.StatusNoContent)
	}
}

func GetMe() gin.HandlerFunc {
	return func(c *gin.Context) {
		u := currentUser(c)
		c.JSON(http.StatusOK, userOut{ID: u.ID, Name: u.Name, Email: u.Email})
	}
}

func LookupUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		email := c.Query("email")
		if email == "" {
			validationErr(c, "email is required")
			return
		}
		var user models.User
		if db.Where("email = ?", email).First(&user).Error != nil {
			notFound(c, "User")
			return
		}
		c.JSON(http.StatusOK, gin.H{"name": user.Name, "email": user.Email})
	}
}

func UpdateMe(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Name     *string `json:"name"`
			Email    *string `json:"email"`
			Password *string `json:"password"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			validationErr(c, err.Error())
			return
		}

		u := currentUser(c)
		if body.Name != nil {
			u.Name = *body.Name
		}
		if body.Email != nil {
			var other models.User
			if db.Where("email = ? AND id != ?", *body.Email, u.ID).First(&other).Error == nil {
				errResp(c, http.StatusConflict, "conflict", "Email already in use")
				return
			}
			u.Email = *body.Email
		}
		if body.Password != nil {
			if len(*body.Password) < 6 {
				validationErr(c, "Password must be at least 6 characters")
				return
			}
			hash, _ := bcrypt.GenerateFromPassword([]byte(*body.Password), bcrypt.DefaultCost)
			u.HashedPassword = string(hash)
		}

		db.Save(u)
		c.JSON(http.StatusOK, userOut{ID: u.ID, Name: u.Name, Email: u.Email})
	}
}
