# Go HTTP and testing library playground

This playground consumes the six practical cards in `packs/go.json` directly. It uses **Go 1.26.5** (`GOTOOLCHAIN=local`), **Gin 1.12.0**, **Chi 5.5.0** and **Testify 1.12.1**, with all transitive versions/checksums in `go.mod`/`go.sum`. Gin requires Go 1.25+, Chi requires Go 1.24+, and Testify requires Go 1.17+; these requirements were checked in their pinned official manifests. No optional build tags are enabled. The core `../main.go` playground remains a separate standard-library module.

## Setup and run

From the repository root:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
cd playground/go/libraries
go version                         # go1.26.5; race checks need a C compiler/CGO
GOTOOLCHAIN=local go mod download
go mod verify
cd ../../..
pnpm check:go                     # gofmt parses every card; library tests and vet follow
pnpm audit:runtime go             # records revision, catalog hash and real check output
```

Dependency setup needs network access once. Normal tests use cached real dependencies, in-process `httptest` requests and mocks; they open no network listener and contact no public services. To enforce offline reruns after download, set `GOPROXY=off GOSUMDB=off`. Missing dependencies/toolchains are setup failures, not evidence that catalog code is defective. The runner uses read-only module resolution, a four-minute limit per Go command and a one-minute Go test timeout, fails on compilation/assertion/race/vet errors and always removes temporary packages.

For editable generated packages and direct Go commands:

```sh
node scripts/check-go-libraries.cjs --prepare
cd playground/go/libraries/generated
go test -race -count=1 -timeout=60s ./...
go vet ./...
```

`--prepare` writes ignored packages under `generated/` from exact catalog text plus independent tests in `../fixtures/`. Re-run it after a catalog change; edit `packs/go.json`, not the generated copy. Testify cards become `_test.go` files; router cards become ordinary Go packages. The generated module copies the committed locks and cannot silently upgrade dependencies. Rerunning prepare replaces the six known packages; remove generated/ to discard local experiments.

## Assertions and supported scope

| Topic / cards | Happy | Meaningful boundary | Rejection / recovery |
| --- | --- | --- | --- |
| Gin / `gin-json` | Created JSON response, decoded item/quantity and content type | Quantities 1 and 10; unknown fields accepted under defaults | Empty/malformed/wrong-type bodies, absent fields and invalid quantities return stable 400 JSON; next valid request succeeds |
| Gin / `gin-cancel` | Lookup gets path ID and request-context value; returns expected JSON | Missing segments/routes never call lookup; expired deadline returns 504 | Already-canceled context returns 408; upstream failure 502; one call returns with no active work |
| Chi / `chi-route` | Nested route returns selected item | ID 1; extra/missing path segment 404; method mismatch 405 with Allow | Zero, negative, overflow and malformed ID return stable 400 body |
| Chi / `chi-cancel` | 204, preserved context and security header | Expired deadline 504; route/method rejection skips work and retains middleware | Canceled work 408; upstream failure 502; call completes and releases its active-work marker |
| Testify / `testify-table` | Real assert/require subtests accept ordinary numbers | Zero/negative integers accepted; recorder confirms a valid assertion reports no failure | Empty/malformed inputs assert typed/wrapped errors; deliberately unequal/wrong-error/no-error assertions record failures |
| Testify / `testify-mock` | Real mock expectations verify retry recovery to Ada | Immediate success uses one call; empty string remains a valid result | Persistent failure returns second error in two calls; missing/unexpected calls are rejected |

The fixture tests assert responses and outcomes independently of the generated handler implementations. They contain no duplicated catalog implementation. All six cards register parse, typecheck, execution and happy/edge/error behavior in the common manifest. A controlled catalog-only change from Gin StatusCreated to StatusOK failed the independent expected-201 assertions; restoring the card passed the offline checker. Existing core Go evidence gaps remain visible and belong to other tickets.

Cancellation is tested synchronously with pre-canceled or already-expired contexts, avoiding sleeps or flaky deadlines. The work/lookup callbacks must observe context and release resources; these examples do not test socket-disconnect delivery or forcible interruption of arbitrary code. Gin intentionally uses its default unknown-field policy and no default recovery/logger middleware. Chi uses the normal net/http contracts. Testify mocks are consumer-boundary tests, not validation of an external storage service. Authentication, database persistence, production server lifecycle and broader library coverage remain future tasks.

## Manual extension walkthrough

1. Reload VS Code after installing the extension. Run `--prepare` above and open `generated/gin-json/catalog.go` with the sidebar visible. At `ShouldBindJSON`, Context should offer the Gin validation example; the independent Gin API overview is in **Reference → HTTP & testing libraries**.
2. Search **gin json validation**, **gin cancellation**, **chi router parameter**, **chi middleware cancellation**, **testify mock**, and **require assertion**. A corresponding practical task should appear in the first three cards; overviews remain separately browsable. Read each explanation for versions, required surroundings and error policy.
3. Open `generated/chi-route/catalog.go`; move between `chi.NewRouter`, `chi.URLParam`, the nested handler and its error branch. Open the cancellation card and inspect the request-context call. In a scratch file rename imports to `web "github.com/gin-gonic/gin"`, `route "github.com/go-chi/chi/v5"`, or `check "github.com/stretchr/testify/require"`; matching selector calls and unfinished `web.` edits should still suggest that library. Names inside comments/strings should not create selectors.
4. Open both Testify `_test.go` cards; inspect `require.ErrorAs`, `mock.Mock`, `Once` and `AssertExpectations`. Run the direct test command above. Valid/boundary inputs pass, invalid requests are asserted as deliberate rejection, and missing/unexpected mock calls are captured as expected test failures without failing the outer suite.
5. Copy each card into its own package/file, using `_test.go` for Testify and the pinned module for dependencies. Run its fixture checks. Pin one card from each library, switch to `../main.go` and then a Rust/TypeScript file, and return. Verify language-specific pins persist, copied text equals the card, and search/context/reference show the active language.
6. Inspect valid versus invalid response assertions in `fixtures/`. The tests do not require credentials, a database or a running HTTP server. Reload VS Code and confirm pin persistence again.

Official sources are linked from each shipped overview: [Gin binding](https://gin-gonic.com/en/docs/binding/binding-and-validation/), [Gin tests](https://gin-gonic.com/en/docs/testing/), [Chi 5.5.0](https://github.com/go-chi/chi/tree/v5.5.0), [Testify 1.12.1](https://github.com/stretchr/testify/tree/v1.12.1). Check the pinned source rather than assuming future documentation matches these versions.
