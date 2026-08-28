package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL              string
	SecretKey                string
	AccessTokenExpireMinutes int
	Port                     string
	BcryptCost               int
}

func Load() *Config {
	expMins, _ := strconv.Atoi(getEnv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
	// bcrypt cost: 10 is the library default (~60ms). Tunable so a slow host can
	// dial it back toward the minimum (4) without a rebuild.
	cost, _ := strconv.Atoi(getEnv("BCRYPT_COST", "10"))
	if cost < 4 || cost > 31 {
		cost = 10
	}
	return &Config{
		DatabaseURL:              getEnv("DATABASE_URL", "postgres://pocket:pocket@localhost:5432/pocket?sslmode=disable"),
		SecretKey:                getEnv("SECRET_KEY", "change-this-in-production"),
		AccessTokenExpireMinutes: expMins,
		Port:                     getEnv("PORT", "8000"),
		BcryptCost:               cost,
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
