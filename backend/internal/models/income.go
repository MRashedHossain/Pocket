package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IncomeCategory struct {
	ID     string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID string `gorm:"not null;type:varchar(36)" json:"userId"`
	Name   string `gorm:"not null" json:"name"`
}

func (i *IncomeCategory) BeforeCreate(_ *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}

type Income struct {
	ID       string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID   string    `gorm:"not null;type:varchar(36)" json:"userId"`
	Date     time.Time `gorm:"type:date;not null" json:"date"`
	Category string    `gorm:"not null" json:"category"`
	Amount   int       `gorm:"not null" json:"amount"`
	Note     string    `gorm:"default:'Unspecified'" json:"note"`
}

func (i *Income) BeforeCreate(_ *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}
