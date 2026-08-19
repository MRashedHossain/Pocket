package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Debt struct {
	ID       string     `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID   string     `gorm:"not null;type:varchar(36)" json:"userId"`
	Kind     string     `gorm:"not null" json:"kind"` // lent | borrowed
	Person   string     `gorm:"not null" json:"person"`
	Amount   int        `gorm:"not null" json:"amount"`
	Date     time.Time  `gorm:"type:date;not null" json:"date"`
	Due      *time.Time `gorm:"type:date" json:"due"`
	Note     string     `json:"note"`
	Settled  bool       `gorm:"default:false" json:"settled"`
	Payments []Payment  `gorm:"foreignKey:DebtID" json:"-"`
}

func (d *Debt) BeforeCreate(_ *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	if d.Date.IsZero() {
		d.Date = time.Now()
	}
	return nil
}

type Payment struct {
	ID     string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	DebtID string    `gorm:"not null;type:varchar(36)" json:"debtId"`
	Amount int       `gorm:"not null" json:"amount"`
	Date   time.Time `gorm:"type:date;not null" json:"date"`
	Note   string    `json:"note"`
}

func (p *Payment) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	if p.Date.IsZero() {
		p.Date = time.Now()
	}
	return nil
}
