# SQL playground

This seeded, disposable playground runs the actual catalog cards on **SQLite 3.53.1** (bundled with **Node 26.3.0**) and a native **PostgreSQL 18.4** server pinned through `embedded-postgres 18.4.0-beta.17`. It needs no Docker, existing database, cloud account, credentials or production resources. The extension itself never connects to databases or executes SQL.

## Setup and checks

Install nvm, pnpm 11, uv and Go 1.23+ first (verified with Go 1.26.5). Run from the repository root:

```sh
nvm install
nvm use
pnpm install --ignore-scripts
pnpm run compile
pnpm --dir playground/sql install --frozen-lockfile
pnpm check:sql
```

The playground's `pnpm-workspace.yaml` permits only the pinned native PostgreSQL packages' symlink preparation scripts. Do not use `--ignore-scripts` for this subproject. If dependencies were already installed that way, run `pnpm --dir playground/sql rebuild @embedded-postgres/linux-x64` (substitute your platform) before testing. Run as your ordinary user; this playground never creates OS users. Native binaries require a supported OS/architecture and its system runtime libraries; Linux glibc x64 is verified. An unsupported platform fails explicitly instead of silently substituting SQLite.

`pnpm check:sql` first compiles the extension, executes all applicable SQL cards (18 SQLite, 20 PostgreSQL), and checks expected rows, deterministic ordering, NULL comparisons, explicit NULL sorting, counts, unique/not-null/check/foreign-key constraints, indexes, bound-value injection probes and recovery after a constraint error inside a transaction. Each card gets a fresh SQLite connection or PostgreSQL schema. PostgreSQL tests assert server version 18.4; SQLite tests assert version 3.53.1.

The same run extracts client examples from `packs/sql-companions.json`, checks strict TypeScript against **pg 8.23.1 / @types/pg 8.15.6 / TypeScript 5.9.3**, runs them against PostgreSQL, compiles/tests Go `database/sql` examples using **pgx/v5 5.7.6**, and executes Python `sqlite3` examples via `uv run --python 3.13`. `pnpm-lock.yaml` and `go.sum` lock third-party dependencies. Python uses only its standard library; uv supplies the documented Python minor version. `UV_BIN` can point to an existing uv binary.

The PostgreSQL cluster uses a unique temporary directory and an automatically selected port on **127.0.0.1**. Local fixture connections use trust authentication; no password is requested. The runner stops the server and deletes its data in `finally`. Its client settings are constructed internally; it never uses your database URL. Go child connection variables are overwritten with fixture settings. Initial dependency installation may require downloads; repeat checks run locally once dependencies and language runtimes are cached.

## Run your own queries

Both commands seed a new database and print each statement's result; changes are discarded at exit:

```sh
pnpm --dir playground/sql query ../../examples/context-tour.sql
pnpm --dir playground/sql query:postgresql ../../examples/context-tour.sql
```

Copy a card into a disposable `.sql` file and pass its path in place of the tour. Client placeholders (`?`, `:name`, `$1`) need separately supplied values: use the tested host-language examples instead of pasting an unbound placeholder into a SQL console. `pnpm --dir playground/sql sqlite` runs SQLite and Python checks only; `pnpm --dir playground/sql postgresql` runs PostgreSQL, TypeScript and Go checks only.

For an optional external SQL client, `pnpm --dir playground/sql serve` prints a seeded local `psql` command including the temporary port and schema. Leave it running while querying; Ctrl+C stops it and deletes the cluster. Never point these exercises at a personal or production database.

## Manual extension walkthrough

1. Open `examples/context-tour.sql` in the existing VS Code workspace, confirm language mode **SQL**, and open **Syntaxiser: Open Reference**. The language badge should show **SQL (SQLite)** by default.
2. Move between `JOIN`, `LEFT JOIN`, `GROUP BY/HAVING`, `IS NULL`, `OVER/PARTITION BY` and `ROLLBACK`. Relevant practical examples should lead; topic overviews remain separately browsable under Reference. Search **join tables**, **missing related rows**, **group totals**, **rank within group**, **null comparison**, **transaction rollback** and **parameterized query**.
3. Try aliases (`c`, `o`), quoted identifiers (`"returning"`), a comment containing `JSONB JOIN`, a string containing `RETURNING`, and incomplete `LEFT JOIN orders ON` or `OVER (PARTITION BY`. Literal/comment text must not drive unrelated topics. Previous semicolon-delimited queries must not outweigh the current statement.
4. Set **Syntaxiser: Sql Dialect** to **postgresql** in workspace or folder settings. The badge, Reference topics, contextual cards and existing search should refresh without restarting. PostgreSQL `RETURNING`, `ON CONFLICT` and `::jsonb` examples become available; SQLite `PRAGMA` cards disappear. Switching back hides PostgreSQL-specific cards. The adapter does not guess a dialect from filenames or syntax.
5. Pin a shared card and one dialect-specific card, switch dialects, then switch to Go/TypeScript/Rust and reload the window. Pins keep stable `(sql, cardId)` identity and remain visible across dialects, with a first-line **SQLite only** or **PostgreSQL only** label on dialect-specific cards. A pin intentionally saved in another dialect remains a pin; new suggestions and reference browsing follow the setting. Collapse, expand and unpin it. Select/copy highlighted code and confirm only the literal SQL is copied.
6. In a Go editor search **database sql parameterized query**, and in TypeScript search **node postgres parameterized query**. These host-language cards must not appear in SQL results. The Python `sqlite3` companion becomes available when the Python adapter from #38 is installed; it is already executed by this playground, but this PR does not prematurely register a Python adapter.
7. In Lessons, try the five SQL exercises from a first report through failed-transaction recovery. Track one as To do, switch languages, reload, and confirm progress persists separately. Exercise instructions/checks describe tasks; no solution or implementation scaffolding appears in lesson snippets. #36 owns further lesson expansion.

## Coverage and limits

Shared foundations cover SELECT, aliases, filters, ordering/limits, joins/anti-joins, aggregates/HAVING, NULL/three-valued logic, subqueries/EXISTS, CTEs, window ranking, INSERT/UPDATE/DELETE, constraints, indexes, transactions/savepoints and client binding. Separate topics document SQLite foreign-key setup and PostgreSQL identity/RETURNING, upsert and JSONB. Shared examples target these two engines; “shared” does not promise compatibility with every SQL product.

Identity generation, JSON APIs, placeholder conventions, default NULL ordering, foreign-key setup and error recovery differ by engine and are explained explicitly. The seed supplies integer primary keys and integer amounts, avoiding implicit auto-increment and floating-point money assumptions. pg returns `int8` aggregates/row numbers as strings; the test harness normalizes only safe small fixture integers, without changing the library's production defaults. SQL client fragments state connection ownership and driver requirements.

Context extraction is a bounded lexical scanner, not a SQL parser or schema inspector. It masks strings, quoted identifiers, line/nested block comments and PostgreSQL dollar quotes while preserving offsets, and isolates the current statement. It does not validate SQL, resolve aliases, inspect schemas, parse stored-procedure bodies, route embedded SQL in another language, or support other dialects. Standard-conforming PostgreSQL strings are assumed; escaped literals use `E'...'`. Work in a supported source editor for host-language clients.

Official sources are linked on every overview: [SQLite SELECT](https://www.sqlite.org/lang_select.html), [PostgreSQL SELECT](https://www.postgresql.org/docs/18/sql-select.html), [Python sqlite3](https://docs.python.org/3.13/library/sqlite3.html), [Go querying](https://go.dev/doc/database/querying), and [node-postgres queries](https://node-postgres.com/features/queries).

## Depth expansion and assertion map (#79)

The catalog now has **37 grouped overviews and 63 SQL cards**, with **52 SQLite cards and 53 PostgreSQL cards** (shared cards execute on both). Every card runs independently in happy, edge and rejection/recovery fixtures: 156 SQLite and 159 PostgreSQL scenarios, plus real-driver and two-connection assertions. `cases.json[cardId].expected`, `.edge` and `.error` identify exact expected rows, input mutations and rejected operations; `verify.mjs` consumes the catalog text directly. `concurrency.mjs` additionally executes the exact writer/increment cards using independent connections and checks SQLite WAL snapshots/busy recovery and PostgreSQL Read Committed/Repeatable Read snapshots, serialization rejection and bounded lock-timeout recovery. The tests contain no sleeps or external services.

[SQL scope and source matrix](../../docs/sql-depth.md) maps every old/new topic to cards and official sources. New task areas include distinct/set semantics, correlated existence and NULL traps, join multiplicity/self joins, stable pagination, conditional/filtered aggregates, ranking/frame peers, bounded hierarchy traversal, additive schema changes, savepoints, conflict handling, partial/expression indexes, UTC timestamps and validated JSON. Migration examples deliberately limit themselves to additive defaults and column rename; they are not arbitrary production migration recipes. SQL engine validation prepares/executes exact SQL, not host-language static type checking.

Search **union distinct**, **case null**, **recursive cte**, **window frame ties**, **savepoint rollback**, **explain index scan**. Move the cursor inside `UNION`, an incomplete `WITH RECURSIVE`, aliased `ROWS BETWEEN` and `ROLLBACK TO`. Try the same words in comments, strings, quoted identifiers and a column named `recursive_cte`: these must not introduce unrelated topics. Copy a task, run its edge and recovery fixture, pin it, inspect its separate overview, switch dialect/language and return. The new composite-identifier filtering preserves callable SQL names and cursor offsets; the adapter remains a lexical scanner, not schema resolution.

Go `AdjustPair` and TypeScript `adjustPair` test a real two-update transaction, constraint rejection, missing endpoints and a usable connection afterward. Go also tests cancellation. Python `add_customers` tests atomic batch insertion, an empty batch, duplicate rollback, nested-transaction rejection and caller-owned closing. Driver catalog text is generated directly into the strict compile/runtime fixtures, and remains separate from SQL topics. Existing SQL lessons now link prerequisite overviews without adding solutions or scaffolding.

Fixtures retain the original customers/orders, add an employees hierarchy and text import staging tables (`documents`, `events`) with malformed data. Only the dedicated JSON/time examples read those staging tables. Installed dependencies and runtimes are unchanged: Node 26.3.0 / SQLite 3.53.1, PostgreSQL 18.4 via embedded-postgres 18.4.0-beta.17, pg 8.23.1, pgx 5.7.6, TypeScript 5.9.3 and Python 3.13. Initial setup needs downloads; tests then operate locally. If uv is not on PATH, set `UV_BIN` to its installed executable.
