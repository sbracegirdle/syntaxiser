# Go standard-library playground

Go 1.26.5 is the validation toolchain. The examples use Go 1.22-compatible APIs; the generated disposable module records `go 1.22.0` and `toolchain go1.26.5`. Install Go separately; checks use `GOTOOLCHAIN=local`, `GOWORK=off`, `GOPROXY=off` and never download a toolchain/dependency. The race detector needs a supported platform and C compiler. All requests are in-process; all files live in temporary test directories. No external service is used.

From the repository root, use nvm/pnpm for the extension and Node entry point:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
pnpm --config.verify-deps-before-run=false check:go
# Equivalent standalone playground entry point:
node playground/go/standard-library/run.cjs
# Materialize exact code for reading or editing in a disposable folder:
node playground/go/standard-library/run.cjs --export /tmp/syntaxiser-go-tour
cd /tmp/syntaxiser-go-tour
GOTOOLCHAIN=local GOWORK=off GOPROXY=off go test -race -count=1 -timeout=60s -bench=. -benchtime=1x ./...
GOTOOLCHAIN=local GOWORK=off GOPROXY=off go vet ./...
```

`check:go` first parses all 40 cards with gofmt, then compiles all cards and asserts 15 exact catalog examples. The legacy compile fixtures supply documented imports, function parameters and uses of local results; they do not claim behavior for 25 older examples. `readConfig` is also behavior-tested. Generated files contain the catalog code unchanged, followed by independent assertions in `catalog-checks.json`. Tests and benchmarks belong in `_test.go`; production snippets are package-level declarations unless otherwise explained. Exports are disposable, never a source of catalog truth.

Expected: 40 parsed cards; race-enabled tests and vet pass; two smoke benchmarks run. Times/allocations are observations, never fixed thresholds. Real syntax, compile, assertion or race failures fail the command. A missing Go/compiler prerequisite is an environment failure; it is not a content defect. Cleanup removes generated test modules even after failure; exported folders are explicitly yours to remove.

## Manual walkthrough

1. Reload VS Code after installing the integration VSIX. Open a generated `catalog_test.go` with Syntaxiser visible. For the primary checkout, the builder exposes this directory as `playground/go-standard-library`; run `node playground/go-standard-library/run.cjs --export /tmp/syntaxiser-go-tour` there.
2. In `json-config`, place the cursor on `json.NewDecoder` and `decoder.DisallowUnknownFields`. Search **json validation** and **decode json**; expect a JSON task in the first three. Copy the card into a disposable package with its documented imports. Confirm valid config succeeds and malformed/unknown/trailing input fails.
3. Visit `testing-parse` (`t.Run`), `benchmark-report` (`b.ReportAllocs`), `http-recorder` (`httptest.NewRecorder`), `context-receive` (`ctx.Err`), `sync-counter` (`mu.Lock`), and `files-lines` (`os.Open`). Search **table test**, **benchmark report**, **http handler**, **context cancellation**, **mutex**, **read file**. Repeat with alias imports such as `j "encoding/json"` and `j.NewDecoder`; try an unfinished call. Comments and quoted API names must not become syntax cues.
4. Browse **Reference → Standard library tasks & tests**: seven schematic API overviews, separately authored from task code, with official Go references. Pin one example and one overview, copy both, navigate away and return. Pins remain stable.
5. Switch to Rust/TypeScript and back; Go pins and lessons remain Go-specific. Existing progress is retained. Review the linked lesson prerequisites in `docs/go-standard-library-coverage.md`; lesson snippets remain unsolved tasks.

Limits: examples are intentionally small. No HTTP listener/TLS tests, JSON duplicate-key rejection, forced goroutine termination, atomic/durable file replacement or production fan-out scheduler is claimed. See the coverage matrix for exact situation assertions and broader lesson boundaries.
