# Go playground

Open `main.go` with the Syntaxiser sidebar visible. Move the cursor between imports, types, functions, map lookups, loops, and channel operations to test Go suggestions. Choose **Reference** to browse Go syntax overviews, or search **key value lookup**, **propagate error**, and **goroutine**. Pin a Go snippet and switch to `../src/main.rs` to test language switching and retained pins.

From this directory, run:

```sh
go run .
```

The playground uses only the standard library and requires Go 1.22 or newer. Reload the VS Code window first if you just installed the Go-support extension build.

For testing/benchmarks, JSON validation, in-process HTTP, cancellation, shared-state ownership and resource/error handling, use the [standard-library playground](standard-library/README.md). It compiles exact catalog cards and runs race-enabled assertions with Go 1.26.5; `go run .` remains the introductory tour.

## HTTP and testing libraries

See [the pinned Gin, Chi and Testify playground](libraries/README.md) for exact-catalog compile, race, request/cancellation, assertion and mock tests, plus manual search/cursor/copy/pin instructions. It uses a separate Go 1.26.5 module; the core playground above remains standard-library-only.
