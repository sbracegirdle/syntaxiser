package main

import "fmt"

type Counter struct {
	Value int
}

func (c *Counter) Increment() { c.Value++ }

func main() {
	counts := map[string]int{"Go": 1}
	for language, count := range counts {
		fmt.Println(language, count)
	}
	if count, ok := counts["Go"]; ok {
		fmt.Println("found", count)
	}
	done := make(chan struct{})
	go func() {
		defer close(done)
		fmt.Println("background work")
	}()
	<-done
}
