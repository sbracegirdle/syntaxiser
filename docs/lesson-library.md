# Progressive lesson library

There are 152 built-in tasks across eight supported language contexts on main: Rust 36, Go 36, TypeScript/TSX 20, Terminal 15, JavaScript/JSX 15, HTML 10, CSS 10 and SQL 10. The [generated coverage matrix](lesson-coverage.md) lists difficulty, concepts, stable IDs and prerequisites. Existing IDs and task text stay intact. New tasks have goals, named prerequisites, setup/run instructions, official learning URLs and observable outcomes. Prerequisites are learning guidance, not a lock on navigation. A learner can choose another task freely.

Lessons are instructions, never solved examples. Built-in `starter` fields remain empty; there is no scaffold or answer in a lesson code block. Use Reference for syntax/API summaries and Context for independently authored practical examples. The extension does not execute, grade or automatically complete lessons. Manual completion remains the learner's decision.

## Setup by track

Work in a disposable copy of the selected playground, outside the real source tree. Initial package/tool downloads need internet; runtime tasks use local data and loopback services only. Avoid changing the real repository or global Git configuration during Terminal lessons.

- **TypeScript and JavaScript:** select Node **26.3.0** with `nvm use` at the repository root. Copy `playground/lessons` to a scratch folder, select that same runtime there, then run `pnpm install --frozen-lockfile --ignore-scripts`. Dependencies are pinned: TypeScript **5.9.3**, React/React DOM **19.3.1**, Express **5.3.0**, Zod **4.6.7**, TanStack Query **5.104.2**, Zustand **5.0.15**, Vitest **5.0.4**, Testing Library React **16.3.0**, user-event **14.6.1**, jsdom **30.1.2**. Add your own `.ts`/`.tsx`/`.js`/`.jsx` files at the copy's root and tests named `*.test.ts`, `*.test.tsx`, `*.test.js` or `*.test.jsx`. Run `pnpm run check` for strict TypeScript and `pnpm test` for runtime behavior. JS is executed by Node/Vitest, not type-checked by this tsconfig. Vitest defaults to jsdom; a server-only test can use its `@vitest-environment node` file comment. The provided `validation` directory contains maintainer feasibility tests; it is separate from sidebar lesson tasks and can be removed from the learner's copy.
- **Browser mounting for JSX/TSX:** in the lessons copy, create `lesson-entry.tsx` (or `.jsx`) that mounts your component with `createRoot`. Run `pnpm exec esbuild lesson-entry.tsx --bundle --format=iife --outfile=dist/lesson.js --jsx=automatic` using the pinned esbuild **0.28.2**. Create `lesson.html` containing a root element and a script loading `dist/lesson.js`. Run `pnpm run serve` (pinned http-server **14.1.1**, loopback port 4175), open `http://127.0.0.1:4175/lesson.html`, and stop with Ctrl-C. This setup belongs outside the lesson snippet. The same fixture includes TanStack Query and Zustand for their browser tasks. Component behavior tests can run without bundling.
- **Rust:** use the current stable toolchain (verified **1.96.0**, edition **2024** for library tasks; ordinary foundations also work in edition 2021). Core tasks need only a disposable `cargo new` project. For libraries, copy `test/fixtures/rust-libraries/Cargo.toml` and `Cargo.lock`; remove the unused local `recipe-derive` dependency and the `[workspace]` members/resolver block, then run `cargo generate-lockfile` in the scratch project while retaining the exact external dependency versions. The source fixture generates its derive subproject dynamically, so copying the manifest alone without those edits will fail. See [Rust coverage](rust-coverage.md) for supported APIs. Run `cargo test`, `cargo run --bin your_binary`, and targeted binary argument/error checks. The opt-in checker below creates a complete scratch workspace automatically. Tokio's pinned features do **not** include `test-util`; timeout tasks deliberately use ready/pending futures instead of requiring paused time. TOML, Serde, clap, regex and rand tasks use actual pinned fixture crates; no CSV crate is assumed.
- **Go:** core tasks require Go **1.22+**; verified with **1.26.5**. Create a disposable `go mod init example.com/lesson`, put library code and `_test.go` files together and run `go test -race ./...` plus `go vet ./...`. For binaries use `cmd/name/main.go` and `go run ./cmd/name`. Race detection needs a supported platform/C toolchain. The database lesson uses `playground/sql/go` instead: Go **1.23+**, pgx/v5 **5.7.6** and a local PostgreSQL fixture. No new Go framework adapter or dependency is introduced here.
- **Terminal:** Bash plus common Unix tools (`mktemp`, `sort`, `uniq`, `find`, `wc`) and Git. Start with `mktemp -d`, quote the returned path, run only in it and remove that exact path afterward. Use `git config user.name/user.email` inside the temporary repository, never `--global`. There are no pushes, deployments, account credentials or cloud writes. Node tooling uses `playground/shell/node-cli` and its lock; Rust/Go tooling needs the above compilers. Keep intentional failures inside `if` so a diagnostic/cleanup path is observable.
- **HTML/CSS:** use [the local web playground](../playground/web/README.md), with Tailwind **4.3.3** and Bootstrap **5.3.8** only for the final library exercise. Native exercises need no framework. Run the documented preview server, use standalone local files, keyboard traversal, accessibility tree, computed styles and viewport/zoom emulation. Browser assertions below verify representative native and library capabilities; human review must also assess accessible names, readable contrast, content and focus behavior in the actual submitted solution.
- **SQL:** follow [the seeded SQL playground](../playground/sql/README.md) for Node **26.3.0** / SQLite **3.53.1** and PostgreSQL **18.4**. Keep engines/dialects explicit. Email is nullable; order totals are not. Run `.sql` files through its `pnpm query -- path.sql` / `pnpm query:postgresql -- path.sql` commands. Mutate only disposable data; use rollback/savepoints. Query-plan lessons inspect plans but never assert that a tiny fixture must use an index scan.

Python #38 retains its own starter tasks on integration; it is not yet registered on this change's main baseline. C#, Java and YAML tasks remain with their pending language tickets. Future tracks should extend stable IDs only when their adapters, pinned fixtures and manual walkthroughs exist.

## Reproduce validation

From the repository root after the normal Node setup:

```sh
pnpm install --ignore-scripts
pnpm run compile
node scripts/lesson-coverage.cjs --check
pnpm --dir playground/lessons install --frozen-lockfile --ignore-scripts
pnpm --dir playground/lessons run check
pnpm --dir playground/lessons test
bash playground/lessons/validation/shell.sh
(cd playground/lessons/validation/go && go test -race ./... && go vet ./...)
node scripts/check-rust-libraries.cjs --lessons
pnpm --dir playground/sql install --frozen-lockfile
pnpm check:sql
pnpm --dir playground/web install --frozen-lockfile --ignore-scripts
pnpm --dir playground/web run build
pnpm check:web
```

The SQL PostgreSQL fixture requires its allowed native preparation scripts. Browser checks require installed Playwright Chromium or `WEB_BROWSER_PATH`. Rust checker creates/removes a scratch project, uses the existing exact versions and compiles/runs the original 66 catalog recipes plus five added outcome tests. SQL runs against both actual engines and validates NULL email counts, join cardinality, paid-total reconciliation, failed-transaction recovery and bindings. Go probes cover strict JSON, errors/files, deterministic sorting, handlers, bounded workers and race safety. Node probes cover strict type failures, core outcomes, JSON/schema/status errors, stale-response cancellation, actual React events, StrictMode cleanup, query caching/store isolation, real file reads and loopback Express requests.

These are representative feasibility and regression checks, not an autograder or a claim that every possible learner implementation has been tested. The capstone checks describe required outcomes for the learner to test. Browser layout/keyboard, exact CLI text and application-specific error policies still require the manual task checks. The full extension test files also cover persisted state, custom lessons, pins/copy, language isolation, filters and reference/context separation.

## Manual extension review

1. Install the integration VSIX and reload VS Code. Open a source file for each supported language or select Terminal context. Open **Lesson browser**; check all five difficulty groups and compare titles/counts with the matrix. JS/JSX share a track; TS/TSX share a distinct one.
2. Select a new first-step task and an advanced task in each new track. Confirm prerequisites use readable titles, setup is actionable and completion checks appear in the detail pane. No solution or starter code block should appear. Follow one core and one library/browser task using the pinned setup above.
3. Mark a new task **In progress**, another **To do**, and another **Done**. Switch to the tracker; verify status grouping and both difficulty orders. Toggle completed visibility and select Done explicitly. Hide/restore a lesson through the Hidden filter.
4. Switch languages and reload. Each language retains its selection and independent progress. Existing `hello`/`capstone` Rust/Go progress must still be present. Pin a practical context card, open Lessons and return to Context: pin/copy behavior is preserved.
5. Add/edit a custom lesson, confirm its selected difficulty and status survive reload, then cancel a reset. Reset only one language, preserving custom lessons; other language progress and pins must stay intact. Reset all including custom lessons only in a disposable test workspace.
6. At narrow sidebar widths, scroll the expanded tree and full instructions. Check keyboard focus after choosing a task/status and after filtering out the selected task. Tasks remain ungraded until the learner marks them done.
