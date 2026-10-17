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
	if err := AdjustPair(ctx, db, 25); err != nil { t.Fatal(err) }
	checkTotal := func(id, expected int) {
		t.Helper()
		var total int
		if err := db.QueryRowContext(ctx, "SELECT total FROM orders WHERE id = $1", id).Scan(&total); err != nil || total != expected {
			t.Fatalf("order %d: total=%d err=%v expected=%d", id, total, err, expected)
		}
	}
	checkTotal(1,75); checkTotal(2,55)
	if err := AdjustPair(ctx, db, 0); err != nil { t.Fatal(err) }
	if err := AdjustPair(ctx, db, 1000); err == nil { t.Fatal("check constraint must reject") }
	checkTotal(1,75); checkTotal(2,55)
	if _, err := db.ExecContext(ctx, "DELETE FROM orders WHERE id = 2"); err != nil { t.Fatal(err) }
	if err := AdjustPair(ctx, db, 10); err == nil { t.Fatal("missing endpoint must reject") }
	checkTotal(1,75)
	cancelled, stop := context.WithCancel(ctx)
	stop()
	if err := AdjustPair(cancelled, db, 0); !errors.Is(err, context.Canceled) { t.Fatalf("cancellation: %v",err) }
	if err := db.PingContext(ctx); err != nil { t.Fatalf("pool remains usable: %v",err) }
}
