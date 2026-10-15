package databaseexamples

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"reflect"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func TestCatalogClients(t *testing.T) {
	if os.Getenv("SYNTAXISER_SQL_FIXTURE") != "1" {
		t.Fatal("Run pnpm test in playground/sql; it creates an isolated database")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := sql.Open("pgx", "") // Connection details belong to the runner's child environment.
	if err != nil { t.Fatal(err) }
	defer db.Close()
	if err := db.PingContext(ctx); err != nil { t.Fatal(err) }
	name, err := FindCustomer(ctx, db, 1)
	if err != nil || name != "Ada" { t.Fatalf("lookup: %q, %v", name, err) }
	_, err = FindCustomer(ctx, db, 999)
	if !errors.Is(err, sql.ErrNoRows) { t.Fatalf("missing row: %v", err) }
	contacts, err := Contacts(ctx, db)
	if err != nil || !reflect.DeepEqual(contacts, []string{"ada@example.test", "cy@example.test"}) {
		t.Fatalf("contacts: %v, %v", contacts, err)
	}
}
