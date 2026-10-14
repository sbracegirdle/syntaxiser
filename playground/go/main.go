// Open this file in VS Code with Syntaxiser visible.
// Move the cursor through the examples, search, and browse the Go reference.
package main

import (
	"errors"
	"fmt"
	"strings"
)

// Try the structs, methods, interfaces, and pointers topics.
type Counter struct {
	Value int
}

func (c *Counter) Increment() { c.Value++ }
func (c Counter) String() string {
	return fmt.Sprintf("count=%d", c.Value)
}

func describe(value fmt.Stringer) string { return value.String() }

// Try generics, slices, range, and comparable constraints.
func contains[T comparable](values []T, target T) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

// Try error returns, if initialization, and multiple results.
func findName(names map[string]string, key string) (string, error) {
	if name, ok := names[key]; ok {
		return name, nil
	}
	return "", errors.New("name not found")
}

func main() {
	// Variables, constants, arrays, slices, and append.
	const limit = 3
	var ready bool
	scores := [limit]int{10, 20, 30}
	names := []string{"Ada", "Grace"}
	names = append(names, "Ken")
	ready = contains(names, "Ada")
	fmt.Println("ready:", ready, "scores:", scores)

	// Maps and comma-ok lookup. Search "key value lookup".
	users := map[string]string{"ada": "Ada Lovelace"}
	name, err := findName(users, "ada")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(name)

	// Functions, methods, pointers, and implicit interface implementation.
	counter := Counter{}
	counter.Increment()
	fmt.Println(describe(counter))

	// Closures capture variables; range visits slice elements.
	prefix := "hello"
	greet := func(name string) string { return prefix + " " + name }
	for index, name := range names {
		fmt.Println(index, greet(strings.ToUpper(name)))
	}

	// For loops and switch cases.
	for attempt := 0; attempt < limit; attempt++ {
		switch attempt {
		case 0:
			fmt.Println("first attempt")
		default:
			fmt.Println("retry", attempt)
		}
	}

	// Strings, runes, and byte offsets for Unicode text.
	for offset, character := range "Go 世界" {
		fmt.Printf("%d: %c\n", offset, character)
	}

	// Type assertions and type switches.
	var value any = "Go"
	if text, ok := value.(string); ok {
		fmt.Println("text:", text)
	}
	switch typed := value.(type) {
	case string:
		fmt.Println("string length:", len(typed))
	default:
		fmt.Println("another type")
	}

	// Goroutines, channels, defer, and select. Search "goroutine".
	messages := make(chan string, 1)
	go func() {
		defer close(messages)
		messages <- "background work finished"
	}()
	select {
	case message := <-messages:
		fmt.Println(message)
	}
}
