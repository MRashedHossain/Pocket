package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Account struct {
	ID      string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID  string `gorm:"not null;type:varchar(36)" json:"userId"`
	Name    string `gorm:"not null" json:"name"`
	Type    string `gorm:"not null" json:"type"` // cash | bank | mobile_banking | card
	Balance int    `gorm:"default:0" json:"balance"`
	Note    string `json:"note"`
}

func (a *Account) BeforeCreate(_ *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
