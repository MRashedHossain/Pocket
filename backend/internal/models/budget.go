package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Budget struct {
	ID       string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID   string `gorm:"not null;type:varchar(36)" json:"userId"`
	Category string `gorm:"not null" json:"category"`
	Month    string `gorm:"not null;type:varchar(7)" json:"month"` // YYYY-MM
	Limit    int    `gorm:"not null" json:"limit"`
}

func (b *Budget) BeforeCreate(_ *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}
