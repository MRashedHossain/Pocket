package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID             string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name           string    `gorm:"not null" json:"name"`
	Email          string    `gorm:"uniqueIndex;not null" json:"email"`
	HashedPassword string    `gorm:"not null" json:"-"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

type UserSettings struct {
	ID             string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID         string `gorm:"uniqueIndex;not null;type:varchar(36)" json:"userId"`
	CurrencySymbol string `gorm:"default:'৳'" json:"currencySymbol"`
	Density        string `gorm:"default:'Comfortable'" json:"density"`
	ShowTrend      bool   `gorm:"default:true" json:"showTrend"`
}

func (s *UserSettings) BeforeCreate(_ *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}
