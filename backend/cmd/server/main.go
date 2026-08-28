package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/MRashedHossain/pocket/internal/config"
	"github.com/MRashedHossain/pocket/internal/db"
	"github.com/MRashedHossain/pocket/internal/handlers"
	"github.com/MRashedHossain/pocket/internal/middleware"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	handlers.BcryptCost = cfg.BcryptCost

	r := gin.Default()
	r.Use(cors())

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Pocket API — see /api/v1"})
	})

	v1 := r.Group("/api/v1")
	v1.Use(middleware.CacheBust())

	// `authed` = require a valid token, then serve GET responses from the
	// in-memory cache. Applied to every protected route group below.
	authed := []gin.HandlerFunc{
		middleware.Auth(cfg.SecretKey, database),
		middleware.ResponseCache(cfg.CacheTTL),
	}

	// ── Auth ──────────────────────────────────────────────────────────────────
	authPub := v1.Group("/auth")
	authPub.POST("/register", handlers.Register(database, cfg.SecretKey, cfg.AccessTokenExpireMinutes))
	authPub.POST("/login", handlers.Login(database, cfg.SecretKey, cfg.AccessTokenExpireMinutes))

	authProt := v1.Group("/auth")
	authProt.Use(authed...)
	authProt.POST("/logout", handlers.Logout())
	authProt.GET("/me", handlers.GetMe())
	authProt.PATCH("/me", handlers.UpdateMe(database))

	users := v1.Group("/users")
	users.Use(authed...)
	users.GET("/lookup", handlers.LookupUser(database))

	// ── Dashboard ─────────────────────────────────────────────────────────────
	dash := v1.Group("/dashboard")
	dash.Use(authed...)
	dash.GET("", handlers.Dashboard(database))
	dash.GET("/summary", handlers.DashboardSummary(database))
	dash.GET("/trend", handlers.DashboardTrend(database))

	// ── Income ────────────────────────────────────────────────────────────────
	inc := v1.Group("/income")
	inc.Use(authed...)
	// categories BEFORE /:id to avoid route conflict
	inc.GET("/categories", handlers.ListIncomeCategories(database))
	inc.POST("/categories", handlers.CreateIncomeCategory(database))
	inc.PATCH("/categories/:id", handlers.UpdateIncomeCategory(database))
	inc.DELETE("/categories/:id", handlers.DeleteIncomeCategory(database))
	inc.GET("", handlers.ListIncome(database))
	inc.POST("", handlers.CreateIncome(database))
	inc.GET("/:id", handlers.GetIncome(database))
	inc.PATCH("/:id", handlers.UpdateIncome(database))
	inc.DELETE("/:id", handlers.DeleteIncome(database))

	// ── Expenses ──────────────────────────────────────────────────────────────
	exp := v1.Group("/expenses")
	exp.Use(authed...)
	exp.GET("", handlers.ListExpenses(database))
	exp.POST("", handlers.CreateExpense(database))
	exp.GET("/:id", handlers.GetExpense(database))
	exp.PATCH("/:id", handlers.UpdateExpense(database))
	exp.DELETE("/:id", handlers.DeleteExpense(database))

	// ── Expense categories ────────────────────────────────────────────────────
	ec := v1.Group("/expense-categories")
	ec.Use(authed...)
	ec.GET("", handlers.ListExpenseCategories(database))
	ec.POST("", handlers.CreateExpenseCategory(database))
	ec.PATCH("/:id", handlers.UpdateExpenseCategory(database))
	ec.DELETE("/:id", handlers.DeleteExpenseCategory(database))

	// ── Budgets ───────────────────────────────────────────────────────────────
	bud := v1.Group("/budgets")
	bud.Use(authed...)
	bud.GET("/summary", handlers.BudgetSummary(database))
	bud.GET("", handlers.ListBudgets(database))
	bud.POST("", handlers.CreateBudget(database))
	bud.GET("/:id/usage", handlers.BudgetUsage(database))
	bud.GET("/:id", handlers.GetBudget(database))
	bud.PATCH("/:id", handlers.UpdateBudget(database))
	bud.DELETE("/:id", handlers.DeleteBudget(database))

	// ── Accounts ──────────────────────────────────────────────────────────────
	acc := v1.Group("/accounts")
	acc.Use(authed...)
	acc.GET("", handlers.ListAccounts(database))
	acc.POST("", handlers.CreateAccount(database))
	acc.GET("/:id/balance", handlers.GetAccountBalance(database))
	acc.GET("/:id", handlers.GetAccount(database))
	acc.PATCH("/:id", handlers.UpdateAccount(database))
	acc.DELETE("/:id", handlers.DeleteAccount(database))

	// ── Debts ─────────────────────────────────────────────────────────────────
	deb := v1.Group("/debts")
	deb.Use(authed...)
	// aggregate routes BEFORE /:id
	deb.GET("/summary", handlers.DebtSummary(database))
	deb.GET("/upcoming", handlers.DebtUpcoming(database))
	deb.GET("/overdue", handlers.DebtOverdue(database))
	deb.GET("", handlers.ListDebts(database))
	deb.POST("", handlers.CreateDebt(database))
	deb.GET("/:id", handlers.GetDebt(database))
	deb.PATCH("/:id", handlers.UpdateDebt(database))
	deb.DELETE("/:id", handlers.DeleteDebt(database))
	deb.POST("/:id/payments", handlers.AddPayment(database))
	deb.GET("/:id/payments", handlers.ListPayments(database))
	deb.DELETE("/:id/payments/:paymentId", handlers.DeletePayment(database))

	// ── Debt Categories ───────────────────────────────────────────────────────
	dc := v1.Group("/debt-categories")
	dc.Use(authed...)
	dc.GET("", handlers.ListDebtCategories(database))
	dc.POST("", handlers.CreateDebtCategory(database))
	dc.DELETE("/:id", handlers.DeleteDebtCategory(database))

	// ── Projects ──────────────────────────────────────────────────────────────
	proj := v1.Group("/projects")
	proj.Use(authed...)
	proj.GET("", handlers.ListProjects(database))
	proj.POST("", handlers.CreateProject(database))
	proj.GET("/:id/summary", handlers.ProjectSummary(database))
	proj.GET("/:id", handlers.GetProject(database))
	proj.PATCH("/:id", handlers.UpdateProject(database))
	proj.DELETE("/:id", handlers.DeleteProject(database))
	proj.GET("/:id/members", handlers.ListMembers(database))
	proj.POST("/:id/members", handlers.AddMember(database))
	proj.GET("/:id/members/:memberId", handlers.GetMemberDetail(database))
	proj.DELETE("/:id/members/:memberId", handlers.RemoveMember(database))
	proj.GET("/:id/contributions", handlers.ListContributions(database))
	proj.POST("/:id/contributions", handlers.AddContribution(database))
	proj.GET("/:id/contributions/:contributionId", handlers.GetContribution(database))
	proj.PATCH("/:id/contributions/:contributionId", handlers.UpdateContribution(database))
	proj.DELETE("/:id/contributions/:contributionId", handlers.DeleteContribution(database))

	// ── Settings ──────────────────────────────────────────────────────────────
	set := v1.Group("/settings")
	set.Use(authed...)
	set.GET("", handlers.GetSettings(database))
	set.PATCH("", handlers.UpdateSettings(database))
	set.POST("/categories", handlers.CreateSettingsCategory(database))
	set.PATCH("/categories/:id", handlers.RenameSettingsCategory(database))
	set.DELETE("/categories/:id", handlers.DeleteSettingsCategory(database))

	log.Printf("Pocket API running on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
