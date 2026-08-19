package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExpenseCategory struct {
	ID     string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID string `gorm:"not null;type:varchar(36)" json:"userId"`
	Name   string `gorm:"not null" json:"name"`
	Limit  int    `gorm:"default:0" json:"limit"`
}

func (e *ExpenseCategory) BeforeCreate(_ *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	return nil
}

type Expense struct {
	ID       string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID   string    `gorm:"not null;type:varchar(36)" json:"userId"`
	Date     time.Time `gorm:"type:date;not null" json:"date"`
	Category string    `gorm:"not null" json:"category"`
	Amount   int       `gorm:"not null" json:"amount"`
	Note     string    `gorm:"default:'Unspecified'" json:"note"`
	Method   string    `json:"method"`
}

func (e *Expense) BeforeCreate(_ *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	return nil
}
