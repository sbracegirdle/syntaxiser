# Rust recipes and validated dependencies

The Rust catalog has 115 independently authored topic overviews and 277 practical examples. The audit expansion adds 32 topics and 66 recipes, preserving all 211 existing examples. Context and search keep practical snippets in the main list, with at most two compact overview previews. Browse **Everyday libraries**, **Configuration & data helpers**, and **Cargo & project structure** in Reference, or search a task or crate name.

Try `thiserror`, `anyhow`, `clap`, `rand`, `regex`, `tracing`, `tokio channel`, `implement Iterator`, `Pin Unpin`, `spawn process`, and `read directory`. Tokio channel contexts such as `tokio::sync::mpsc::channel` and imported `mpsc::channel` prefer async recipes over blocking standard-library channels. Direct, grouped, nested and renamed import paths supply library cues; this remains lexical extraction, so local name shadowing, glob imports and project-wide re-exports are not resolved.

## Coverage

- Serde: typed JSON round trips, invalid input, field rename/default/skip, external/internal/adjacent/untagged enums, and configuration files. TOML configuration reuses Serde models independently of HTTP frameworks.
- Errors: thiserror messages, conversions and explicit sources for typed library contracts; anyhow context and propagation for applications; tightly scoped panic boundaries and unwind/abort limitations.
- Tokio: complete runtime entry, task results and join errors, bounded mpsc/oneshot/watch/broadcast channels, timers, select/join, blocking work, async locking, and cancellation.
- Everyday tools: clap options/flags/defaults/validation/subcommands; rand ranges/shuffle/seeded generators; regex captures/replacement/compiled reuse; tracing subscribers/events/spans/async instrumentation; log with a backend.
- Fundamentals: Iterator and consuming IntoIterator implementations; Send/Sync and owned/shared thread inputs; coercions/AsRef/AsMut/Borrow; Cell/RwLock; Rustdoc/doctests/public-API integration tests; directory and child-process handling.
- Data and advanced topics: itertools windows/joins, indexmap order, shared bytes, UUIDs, chrono timestamps, tempfile lifetimes, generic-aware derive expansion using syn/quote/proc-macro2, pinned future polling and async streams.
- HTTP: reused Reqwest clients, timeout/query/auth/typed decoding, raw upload and incremental downloads; full Axum/Actix startup and dependency manifests, in-process router tests, typed handler errors, and initialized middleware diagnostics.

Cargo recipes are TOML and must be saved as **Cargo.toml** in their described layout. They have a TOML highlighting override within the Rust pack, retaining Rust pin identity. Overviews explain syntax/API variants separately from task examples. Rustdoc comments are executable documentation syntax, so its dedicated example deliberately includes them.

## Supported fixture versions

These are deliberately pinned, tested APIs, not claims about the newest releases. The checked-in manifests and lockfiles are authoritative; the sidebar explanations record required versions/features for the recipes. Helpers using `?` are validated inside an async `anyhow::Result<()>` function unless the recipe supplies a complete entry point, library item, test, or macro crate.

| Crate | Pinned version | Features or role |
| --- | --- | --- |
| serde / serde_json | 1.0.228 / 1.0.145 | serde `derive` |
| thiserror / anyhow | 2.0.17 / 1.0.100 | Typed library errors / application propagation |
| tokio | 1.48.0 | `macros`, `rt-multi-thread`, `sync`, `time`, `net`, `io-util`, `fs`, `signal` in combined fixture; startup manifest shows its smaller feature set |
| clap | 4.5.50 | `derive` |
| rand | 0.9.2 | 0.9 API (`rng`, `random_range`); seeded StdRng is not a cross-version format |
| regex | 1.12.2 | Default features |
| tracing / tracing-subscriber | 0.1.41 / 0.3.20 | Default tracing attributes; subscriber `env-filter` |
| log / env_logger | 0.4.28 / 0.11.8 | Application installs backend once |
| itertools / toml | 0.14.0 / 0.9.8 | Itertools import; default TOML parse/display/Serde support |
| indexmap / bytes | 2.12.0 / 1.10.1 | Default features |
| uuid / chrono / tempfile | 1.18.1 / 0.4.42 / 3.23.0 | uuid `v4`; chrono is the selected date/time library (the separate `time` crate API is not covered) |
| syn / quote / proc-macro2 | 2.0.108 / 1.0.41 / 1.0.103 | Separate proc-macro crate and generic consumer |
| futures-util | 0.3.31 | StreamExt and stream combinators |
| reqwest | 0.12.24 | Default features disabled; `json`, `stream`, `rustls-tls` |
| axum / tower / tower-http | 0.8.6 / 0.5.2 / 0.6.6 | tower `util`, tower-http `trace` |
| actix-web / actix-rt | 4.11.0 / 2.11.0 | Explicit runtime pin avoids incompatible 2.15.0 net/signal feature resolution with this server version |

References: [Serde attributes](https://serde.rs/attributes.html), [thiserror](https://docs.rs/thiserror/latest/thiserror/), [Tokio](https://docs.rs/tokio/latest/tokio/), [clap](https://docs.rs/clap/latest/clap/), [rand 0.9 migration](https://rust-random.github.io/book/update-0.9.html), [Pin](https://doc.rust-lang.org/std/pin/), [Reqwest](https://docs.rs/reqwest/latest/reqwest/), [Axum](https://docs.rs/axum/latest/axum/), and [Actix Web](https://docs.rs/actix-web/latest/actix_web/). Compile checks use the pinned versions above even when documentation links follow current maintainers' pages.

## Validation

Use the repository's Node version with nvm and pnpm. Install stable Rust including rustfmt; this expansion was validated with Rust 1.96.0.

```sh
nvm use
pnpm test
pnpm check:rust:core
pnpm check:rust:libraries
```

`check:rust:core` parses every Rust card with rustfmt and type-checks 31 selected existing fundamentals examples. TOML cards are validated by the Cargo checks instead of being parsed as Rust.

`check:rust:libraries` reads the actual sidebar code by ID from `packs/rust.json`, creates a temporary Cargo workspace from `test/fixtures/rust-libraries`, and compiles all 66 added recipes. It runs safe task examples, an actual Rustdoc doctest, a separate public-API integration test, a consumer of the derive macro, and complete runtime/logging entry points. It also checks standalone package/features, workspace-member, and Axum/Actix manifest layouts. A deliberately bounded subprocess checks `rustc --version`; temporary file examples use isolated directories. It does not launch long-running HTTP servers or contact illustrative upload/download endpoints. Those request recipes are type-checked; router tests run locally without sockets.

The fixture has exact direct dependency pins and checked-in Cargo.lock files for transitive resolution. Normal validation copies those reviewed locks into each temporary project and uses `--locked` for check/test/run; it never runs `generate-lockfile`, including for nested manifest recipes. Missing locks fail with an explicit `--update-lock` instruction, and stale/incompatible locks fail Cargo validation instead of being silently refreshed. Initial execution needs access to crates.io for dependencies; subsequent runs reuse Cargo's cache and a target directory under the system temp directory (override with `CARGO_TARGET_DIR`). To intentionally refresh locks after changing dependency pins, run `node scripts/check-rust-libraries.cjs --update-lock` and review every resulting lock diff. The standalone layout checks use the dependencies already downloaded by the combined workspace. All fixture generation stays outside the checkout; no generated Rust code duplicates the catalog.

Overviews are schematic and are not compiled. The existing 211 examples keep their prior validation coverage; the new library checker does not claim to type-check every older illustrative HTTP or language fragment. Filesystem/process behavior and live remote HTTP behavior may require adapting paths, endpoints and authentication to your application. The extension itself continues to run offline and does not execute snippets or load these Rust dependencies.

### Lock reproducibility checks

Run `pnpm test` to exercise the lock regression. With Cargo installed, it builds an isolated directory-source cache containing version 1.0.0, creates a valid lock, then adds compatible version 1.1.0. Normal validation must compile/test against 1.0.0 and preserve both source and scratch lock bytes; explicit regeneration must select 1.1.0. It also tests missing-lock diagnostics and deliberate creation. This case uses no network or user Cargo cache. A separate checker-level regression verifies that all five workspace/layout paths consume their respective committed lock and never invoke regeneration during normal validation. The real-Cargo case is reported as skipped when Cargo is absent; the checker-level case still runs.

For manual verification on Rust/Cargo 1.96.0:

1. Record hashes with `sha256sum test/fixtures/rust-libraries/Cargo.lock test/fixtures/rust-libraries/locks/*.lock`. Refresh your crates.io index separately if desired; do not regenerate these locks.
2. Run `pnpm audit:runtime rust` online with access to crates.io. Confirm the report says `passed` and includes compile, runtime, doctest, integration, binary and layout results.
3. With dependencies warmed, run `CARGO_NET_OFFLINE=true pnpm audit:runtime rust`. Confirm the same checks pass. Missing cached dependencies require an online warm-up.
4. Repeat the hash command and confirm every lock is unchanged. Only use `node scripts/check-rust-libraries.cjs --update-lock` for intentional maintenance, then review all dependency diffs. Root regeneration can use the network; nested regeneration retains its offline behavior and requires warmed dependencies.

Cargo documents that [generate-lockfile rebuilds existing locks using the latest available versions](https://doc.rust-lang.org/cargo/commands/cargo-generate-lockfile.html), whereas [`check --locked` enforces the existing resolution](https://doc.rust-lang.org/cargo/commands/cargo-check.html).
