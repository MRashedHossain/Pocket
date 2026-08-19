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
}

func Load() *Config {
	expMins, _ := strconv.Atoi(getEnv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
	return &Config{
		DatabaseURL:              getEnv("DATABASE_URL", "postgres://pocket:pocket@localhost:5432/pocket?sslmode=disable"),
		SecretKey:                getEnv("SECRET_KEY", "change-this-in-production"),
		AccessTokenExpireMinutes: expMins,
		Port:                     getEnv("PORT", "8000"),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
