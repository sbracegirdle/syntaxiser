# Language and tool coverage

The current catalogs cover Rust, Go, JavaScript/JSX, TypeScript/TSX, Python, Java, C#/.NET, HTML, CSS, SQL, YAML, and developer terminals. A supported editor selects its catalog automatically; pins remain available across language switches. Context favors practical task examples, while Reference opens separately authored syntax/API overviews with learning-source links. Built-in lesson tracks exist for every catalog, with varying depth; see the [lesson coverage matrix](lesson-coverage.md) and [lesson setup and manual checks](lesson-library.md).

This guide is a directory of current scope and runnable projects. Follow each language's detailed guide for exact pinned versions, assertion evidence and limitations; inventory counts do not establish semantic coverage. The [common audit](language-coverage.md) retains unresolved coverage findings. Catalog support does not imply complete language/framework coverage. The extension bundles text and highlighting, and does not install libraries or execute examples.

## Rust

Core syntax includes ownership/borrowing, lifetimes, collections/iterators, errors, traits/generics, macros, I/O and concurrency. Library topics include Serde, Thiserror, Anyhow, Clap, Rand, Regex, Tracing, Tokio, Reqwest, Axum and Actix Web. Cargo manifests stay in a separate tooling area.

Try **propagate error**, **tokio channel** or **web server**. Start with the [Cargo playground](../playground/src/main.rs) or [cursor tour](../examples/context-tour.rs). The [Rust coverage guide](rust-coverage.md) records dependency features, supported API versions and compiler/runtime validation, including `pnpm check:rust:libraries`.

## Go

Core syntax, slices/maps, interfaces/generics, error handling, files, JSON, HTTP, testing and concurrency are supplemented by separate Gin, Chi and Testify overviews/tasks and a `database/sql` companion. Search **key value lookup**, **propagate error**, **goroutine** or **gin validation**.

Use the [Go playground](../playground/go/README.md), [standard-library tour](../playground/go/standard-library/README.md) and [HTTP/testing library playground](../playground/go/libraries/README.md). Their pinned real-dependency checks complement core parsing; `pnpm check:go` runs the core and library checks. The [cursor tour](../examples/context-tour.go) exercises imports, declarations, lookups and channels.

## JavaScript / JSX

Language topics include functions/receivers, object identity/prototypes, collections, generators, regex/Unicode, promises and cleanup. Browser/Node tasks sit alongside React/JSX, Express, Vitest and Testing Library examples. Search **react props**, **effect cleanup**, **fetch cancel** or **express error middleware**.

The [JavaScript playground](../playground/javascript/README.md) provides browser/editor walkthroughs and real library checks. See [support, storage identity and limits](javascript-support.md) and the [depth/assertion matrix](javascript-depth.md). JavaScript cards contain no TypeScript syntax; JSX needs a transform. JS/JSX share one catalog and progress identity.

## TypeScript / TSX

Types, narrowing, generics, type transformations, collections and async/error handling include practical typed React tasks and separate topics for Next.js, Vue, Angular, Express, Zod, Axios, Lodash, date-fns, RxJS, TanStack Query, Zustand, Jest and Vitest. Search **type guard**, **conditional infer**, **react form validation** or **query retry**.

Start with the [TypeScript editor playground](../playground/typescript/README.md) and [pinned library playground](../playground/typescript/libraries/README.md). See [library versions and primary sources](typescript-libraries.md) and [depth, assertions and manual review](typescript-depth.md). `pnpm check:typescript` checks the exact cards against real declarations. TS/TSX share one catalog; `.vue` files, Angular templates and project-wide type analysis remain outside this adapter.

## Python

Core and standard-library tasks cover functions, copying/collections, iterators, errors/resources, paths, files/CSV/JSON, dates, logging, async work and sqlite3 clients. Popular-library topics include pytest, HTTPX, Pydantic, FastAPI, NumPy and pandas. Search **pytest fixture**, **httpx timeout**, **numpy broadcast**, **pandas missing values** or **pandas validated join**.

The [locked uv playground](../playground/python/README.md) executes exact catalog code with pinned dependencies, local files and in-process/mock HTTP. See [support and versions](python-support.md), [core depth and assertions](python-depth.md) and [NumPy/pandas workflows](python-data.md). `pnpm check:python` runs the behavior suite; Python syntax compilation is distinct from static type checking. Built-in data lessons include prerequisite-linked array/table tasks and a report capstone.

## Java

Java syntax and runtime tasks cover value/equality rules, generic bounds, classes/interfaces/records, collections/streams, Optional, resources, files, HTTP and concurrency, plus JUnit, Jackson and Spring Boot. Search **close resource**, **stream group**, **jackson json**, **junit parameterized** or **spring boot endpoint**.

The [Java 21 playground](../playground/java/README.md) compiles exact cards with pinned dependencies and runs JUnit/JSON/validation/MockMvc checks locally. See [supported versions and limits](java-support.md), the [depth/assertion matrix](java-depth.md) and separate [Maven tooling guide](../playground/java/tooling.md). Preview APIs, Android/Kotlin and exhaustive framework coverage are outside this catalog.

## C# / .NET

C# tasks include nullable values, records, generic constraints, delegates/events, collections/LINQ, errors/resources, files, JSON, HTTP, cancellation and bounded concurrency. Separate ASP.NET Core, EF Core SQLite and xUnit topics cover request validation, hosting/options, relational constraints/transactions and isolated tests. Search **using alias**, **linq left join**, **async stream cancellation**, **ef core rollback** or **xunit fixture**.

The [pinned .NET playground](../playground/csharp/README.md) compiles the actual cards and tests local request/database boundaries. See [support and versions](csharp-support.md), the [depth/assertion matrix](csharp-depth.md) and separate [.NET tooling guide](../playground/csharp/tooling.md). `pnpm check:csharp` runs the compiler and behavior checks. Progressive lessons span all five difficulty levels.

## HTML

Markup tasks cover document metadata/semantics, accessible tables/forms, input states, responsive images, native dialog/popover, media, embedded content and script loading, alongside separate Bootstrap and Tailwind topics. Search **email validation**, **responsive images** or **dialog focus**.

Use the [shared web playground](../playground/web/README.md) and [HTML depth/assertion matrix](html-depth.md) for pinned browser/framework versions and manual cursor checks. `pnpm check:web` checks exact card markup and behavior. HTML stays escaped when displayed/copied in the sidebar; examples execute only in the playground. Modern Chromium checks do not establish Firefox/Safari or assistive-technology compatibility.

## CSS

Styling tasks cover selectors/cascade/layers, sizing, flex/grid/subgrid, logical properties, focus, overflow, responsive/container queries, motion and feature fallbacks, with separate Bootstrap/Tailwind customization. Search **responsive grid**, **focus visible**, **container query** or **tailwind theme**.

The [web playground](../playground/web/README.md) and [CSS depth/assertion matrix](css-depth.md) document pinned framework compilation, exact styles, surrounding HTML and browser checks through `pnpm check:web`. HTML and CSS select separate catalogs. Embedded-language routing and SCSS/Less are outside these adapters; framework dependencies are not bundled into the extension.

## SQL

Shared SQLite/PostgreSQL tasks cover queries/joins, aggregates, NULL, CTEs, windows, mutations, constraints, indexes, transactions and bound parameters. **Syntaxiser: Sql Dialect** defaults to SQLite; workspace/folder settings select PostgreSQL-specific examples and overviews. Dialect labels remain on saved pins.

Search **missing related rows**, **group totals**, **rank within group**, **transaction rollback** or **parameterized query**. Use the [SQL playground](../playground/sql/README.md), [cursor tour](../examples/context-tour.sql) and [depth/assertion matrix](sql-depth.md). `pnpm check:sql` executes exact cards on pinned SQLite and native PostgreSQL. Go `database/sql`, TypeScript `pg` and Python `sqlite3` companions stay in their host-language catalogs. Other database dialects are outside this scope.

## YAML

Foundations cover mappings/sequences, scalar types/quoting, multiline blocks, anchors/aliases, multi-document streams and validation. Separately grouped GitHub Actions, CloudFormation and Docker Compose content includes expressions/reuse, conditions, dependencies, configuration composition and validation boundaries. Filename/root-key cues restrict contextual suggestions to the relevant schema; search/reference retain the full YAML catalog.

Search **github actions matrix**, **cloudformation condition** or **docker compose health**. The [YAML playground](../playground/yaml/README.md), [support and limits](yaml-support.md) and [depth/assertion matrix](yaml-depth.md) document pinned parsers/validators and manual checks. `pnpm check:yaml` validates local fixtures without deploying resources or starting containers. The extension uses lexical context and performs no schema validation itself.

## Developer terminals

Terminal context covers shell composition, quoting, environment, files/processes, Git, Cargo, Go, Node/TypeScript tooling and AWS CLI. Executed commands use VS Code shell integration; new Zsh terminals also provide live allowlisted command/subcommand cues. Arguments/output are excluded. **Syntaxiser: Use Active Terminal Context** is the fallback for focus changes the public API does not report.

Search **git status**, **pnpm workspace**, **pipe failure** or **aws s3**. The [shell playground](../playground/shell/README.md) documents setup, local checks and limits; the [shell depth/assertion guide](shell-depth.md) covers scripting tasks. `pnpm check:shell` checks catalog syntax and `pnpm check:shell:depth` runs isolated local behavior. AWS CLI skeleton checks do not establish IAM permissions or real service behavior. Network/write commands remain explicitly documented manual operations; the extension never executes them.
