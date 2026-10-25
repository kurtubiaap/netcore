package config

import (
	"fmt"
	"os"
	"strings"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() error {
	dbPath := strings.TrimSpace(os.Getenv("DB_PATH"))
	if dbPath == "" {
		dbPath = "netcore.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	DB = db
	return nil
}
