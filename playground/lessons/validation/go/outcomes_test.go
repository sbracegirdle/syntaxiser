// Feasibility tests stay separate from lesson content.
package lessons

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing"
)

func TestInventoryAndCopies(t *testing.T) {
	counts := map[string]int{}
	update := func(name string, delta int) error {
		next := counts[name] + delta
		if next < 0 {
			return errors.New("negative inventory")
		}
		if next == 0 {
			delete(counts, name)
		} else {
			counts[name] = next
		}
		return nil
	}
	for _, delta := range []int{2, 3} {
		if err := update("book", delta); err != nil {
			t.Fatal(err)
		}
	}
	if counts["book"] != 5 {
		t.Fatal(counts)
	}
	if err := update("book", -6); err == nil || counts["book"] != 5 {
		t.Fatal("rejected mutation")
	}
	if err := update("book", -5); err != nil || len(counts) != 0 {
		t.Fatal(counts, err)
	}
	input := []int{1, 2}
	copyOf := append([]int(nil), input...)
	copyOf[0] = 9
	if input[0] != 1 {
		t.Fatal("aliased input")
	}
}

func decode(input string) (int, error) {
	var value struct {
		Name     string
		Quantity int
	}
	decoder := json.NewDecoder(strings.NewReader(input))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&value); err != nil {
		return 0, err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return 0, errors.New("trailing input")
	}
	if value.Name == "" || value.Quantity <= 0 {
		return 0, errors.New("invalid item")
	}
	return value.Quantity, nil
}
func TestStrictJSON(t *testing.T) {
	if n, err := decode(`{"Name":"Ada","Quantity":2}`); err != nil || n != 2 {
		t.Fatal(n, err)
	}
	for _, input := range []string{`{"Name":"Ada","Quantity":0}`, `{"Name":"Ada","Quantity":2,"unknown":1}`, `{"Name":"Ada","Quantity":2} {}`, `{bad`} {
		if _, err := decode(input); err == nil {
			t.Fatal(input)
		}
	}
}
func TestWrappedFileAndDeterministicSort(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "daily notes.txt")
	if err := os.WriteFile(file, []byte("one\n\nthree\n"), 0600); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(file)
	if err != nil || string(data) != "one\n\nthree\n" {
		t.Fatal(err)
	}
	_, err = os.ReadFile(filepath.Join(dir, "missing"))
	err = fmt.Errorf("read config: %w", err)
	if !errors.Is(err, os.ErrNotExist) {
		t.Fatal(err)
	}
	counts := map[string]int{"Ben": 2, "Ada": 2, "Cy": 3}
	var names []string
	for name := range counts {
		names = append(names, name)
	}
	sort.Slice(names, func(i, j int) bool {
		if counts[names[i]] != counts[names[j]] {
			return counts[names[i]] > counts[names[j]]
		}
		return names[i] < names[j]
	})
	if strings.Join(names, ",") != "Cy,Ada,Ben" {
		t.Fatal(names)
	}
}
func TestLocalHandlerAndCancellation(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(405)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{"quantity": 2})
	})
	for _, method := range []string{"GET", "POST"} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(method, "/", nil))
		if method == "GET" {
			if recorder.Code != 200 || recorder.Header().Get("Content-Type") != "application/json" {
				t.Fatal(recorder)
			}
		} else if recorder.Code != 405 {
			t.Fatal(recorder.Code)
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if !errors.Is(ctx.Err(), context.Canceled) {
		t.Fatal(ctx.Err())
	}
}
func TestBoundedWorkersAndSnapshot(t *testing.T) {
	jobs := make(chan int)
	results := make(chan int)
	var workers sync.WaitGroup
	var mutex sync.Mutex
	active, peak, total := 0, 0, 0
	for i := 0; i < 2; i++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for job := range jobs {
				mutex.Lock()
				active++
				if active > peak {
					peak = active
				}
				total++
				mutex.Unlock()
				results <- job
				mutex.Lock()
				active--
				mutex.Unlock()
			}
		}()
	}
	go func() {
		for i := 0; i < 6; i++ {
			jobs <- i
		}
		close(jobs)
		workers.Wait()
		close(results)
	}()
	seen := map[int]bool{}
	for value := range results {
		if seen[value] {
			t.Fatal("duplicate")
		}
		seen[value] = true
	}
	if len(seen) != 6 || peak > 2 || total != 6 {
		t.Fatal(len(seen), peak, total)
	}
}
