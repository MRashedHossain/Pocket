package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Project struct {
	ID            string          `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID        string          `gorm:"not null;type:varchar(36)" json:"userId"`
	Name          string          `gorm:"not null" json:"name"`
	Target        int             `gorm:"default:0" json:"target"`
	Note          string          `json:"note"`
	Members       []ProjectMember `gorm:"foreignKey:ProjectID" json:"-"`
	Contributions []Contribution  `gorm:"foreignKey:ProjectID" json:"-"`
}

func (p *Project) BeforeCreate(_ *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

type ProjectMember struct {
	ID        string `gorm:"primaryKey;type:varchar(36)" json:"id"`
	ProjectID string `gorm:"not null;type:varchar(36)" json:"projectId"`
	Name      string `gorm:"not null" json:"name"`
}

func (m *ProjectMember) BeforeCreate(_ *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}

// Contribution kinds. "credit" adds money to the pot, "debit" takes money out
// (a withdrawal / reimbursement). The pot's net balance is credits minus debits.
// Debit is the default: unspecified and pre-existing rows are treated as debit.
const (
	ContributionCredit = "credit"
	ContributionDebit  = "debit"
)

type Contribution struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	ProjectID string    `gorm:"not null;type:varchar(36)" json:"projectId"`
	Member    string    `gorm:"not null" json:"member"`
	Amount    int       `gorm:"not null" json:"amount"`
	Kind      string    `gorm:"type:varchar(10);not null;default:debit" json:"kind"`
	Txn       string    `gorm:"not null" json:"txn"`
	Note      string    `json:"note"`
	Date      time.Time `gorm:"type:date;not null" json:"date"`
}

func (c *Contribution) BeforeCreate(_ *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	if c.Kind == "" {
		c.Kind = ContributionCredit
	}
	if c.Date.IsZero() {
		c.Date = time.Now()
	}
	return nil
}
