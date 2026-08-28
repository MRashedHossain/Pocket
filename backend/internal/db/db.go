package db

import (
	"time"

	"github.com/MRashedHossain/pocket/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Warn only: per-statement Info logging added noticeable latency to the
		// dashboard, which fires a dozen aggregate queries per request.
		Logger:      logger.Default.LogMode(logger.Warn),
		PrepareStmt: true,
	})
	if err != nil {
		return nil, err
	}

	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetConnMaxLifetime(time.Hour)
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
	if err != nil {
		return nil, err
	}

	ensureIndexes(db)
	return db, nil
}

// ensureIndexes creates the composite indexes the aggregate/report queries rely
// on. They are keyed by (user_id, date) / (user_id, month) so per-user monthly
// and daily range scans stay cheap as data grows. IF NOT EXISTS keeps this
// idempotent across restarts.
func ensureIndexes(db *gorm.DB) {
	stmts := []string{
		`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (user_id, date)`,
		`CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes (user_id, date)`,
		`CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month)`,
		`CREATE INDEX IF NOT EXISTS idx_debts_user ON debts (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_income_categories_user ON income_categories (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_debt_categories_user ON debt_categories (user_id)`,
	}
	for _, s := range stmts {
		db.Exec(s)
	}
}
