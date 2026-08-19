package db

import (
	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.UserSettings{},
		&models.ExpenseCategory{},
		&models.Expense{},
		&models.IncomeCategory{},
		&models.Income{},
		&models.Budget{},
		&models.Account{},
		&models.DebtCategory{},
		&models.Debt{},
		&models.Payment{},
		&models.Project{},
		&models.ProjectMember{},
		&models.Contribution{},
	)
	return db, err
}
