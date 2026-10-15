# Language and tool coverage

The current catalogs cover Rust, Go, TypeScript, HTML, CSS, SQL, and developer terminals. The goal is to support learning across languages; coverage varies by catalog. The active supported editor selects its catalog automatically, and pins remain available when you switch.

## Rust

Rust includes 277 practical examples and 115 separate topic overviews, from core syntax to common libraries. Try the runnable [Rust playground](../playground/src/main.rs) in the `playground/` Cargo project, or start with the [cursor tour](../examples/context-tour.rs).

Search common libraries directly: **serde**, **thiserror**, **anyhow**, **clap**, **rand**, **regex**, **tracing**, or **tokio channel**. Focused recipes also cover custom iterators, Send/Sync, borrowed APIs, directory/process handling, doctests, pinned futures and streams, data/configuration helpers, derive macros, and deeper HTTP workflows. Cargo manifests live in a separate tooling area with TOML highlighting. Each new topic has its own overview, independently written from practical examples.

See [Rust coverage and validated versions](rust-coverage.md) for dependency features, supported API versions, recipe layouts and compiler/runtime validation. New snippets are compiled directly from the catalog against pinned Cargo fixtures with `pnpm check:rust:libraries`.

## Go

Go starts with 26 practical examples and 26 separate syntax overviews. Open a `.go` file to switch context suggestions, search, highlighting, and the reference browser to Go. Try [examples/context-tour.go](../examples/context-tour.go): move between imports, declarations, a map lookup, and channel operations. Search **key value lookup**, **propagate error**, or **goroutine**, then choose **Reference** to browse five groups covering declarations, control flow, data, abstraction, and concurrency. Pins from all supported languages remain available when switching files.

Go topic overviews in `packs/go-reference.json` describe syntax forms and essential rules separately from the practical examples in `packs/go.json`. Snippets may require the imports and surrounding variables described by their code; they are reference fragments rather than complete programs. The initial catalog covers core Go syntax, not every standard-library API. Generics require Go 1.18+, integer range 1.22+, and iterator-function range 1.23+. Content is independently authored using the [Go specification](https://go.dev/ref/spec) and [Effective Go](https://go.dev/doc/effective_go).

## TypeScript

TypeScript includes 54 examples across 40 core and popular-library topics. Open a `.ts` or `.tsx` file to switch context suggestions, search, highlighting, and the reference browser to TypeScript. Try [examples/context-tour.ts](../examples/context-tour.ts): move between an import, an interface, a map lookup, optional chaining, and an async function. Search **type guard**, **handle missing value**, **partial update**, or **key value lookup**. Pins from all supported languages remain available when switching editors.

The TypeScript catalog covers declarations, object and generic types, narrowing, collections, async/error handling, classes, enums, type transformations, and 14 popular libraries: React, Next.js, Vue, Angular, Express, Zod, Axios, Lodash, date-fns, RxJS, TanStack Query, Zustand, Jest, and Vitest. Practical examples live in `packs/typescript.json`; dedicated syntax forms and essential rules live separately in `packs/typescript-reference.json`. TSX files use the same catalog, including React components and hooks. Library names and task phrases are searchable; imported APIs and aliases guide contextual suggestions. Vue Composition API and Angular core snippets work in .ts files; .vue files and Angular templates have separate language IDs outside this adapter. The `satisfies` example requires TypeScript 4.9+. Content is independently authored with reference to the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

For a runnable project with broader cursor contexts, open [playground/typescript/main.ts](../playground/typescript/main.ts) and follow its [playground instructions](../playground/typescript/README.md). It exercises types, collections, async work, search, Reference, and switching languages with retained pins.

The [library playground](../playground/typescript/libraries/README.md) provides runnable examples and Jest/Vitest checks. Install its dependencies with `pnpm --dir playground/typescript/libraries install --ignore-scripts`, then run `pnpm check:typescript` to type-check all 54 practical examples against the real library declarations without executing them. The core local-import example uses a small `models.ts` fixture supplied by the checker. Library versions, usage evidence, and source links are listed in [TypeScript library coverage](typescript-libraries.md). The extension bundles catalog text only; it does not install or execute these libraries in your project. Overview syntax is schematic and is not compiled.

## HTML and CSS

Open a `.html` or `.css` file to switch context, search, highlighting, and the reference browser. HTML has 17 topics/examples covering document structure, semantics, text, links, images, lists, tables, forms, native disclosure, accessibility, and Bootstrap/Tailwind. CSS has 20 topics/examples covering selectors, cascade/layers, boxes, values, colors, typography, flex/grid, positioning, overflow, focus, responsive/container queries, custom properties, motion, and Bootstrap/Tailwind customization. Each topic has a separately authored overview and learning-source links.

Try **email validation**, **responsive images**, **responsive grid**, **focus visible**, **bootstrap button**, or **tailwind theme**. Pins survive language switches; custom lessons and their progress are tracked independently for HTML and CSS. Built-in lessons currently cover Rust and Go. HTML snippets display and copy as literal markup, and never execute in the sidebar.

See the [runnable garden journal and manual checks](../playground/web/README.md). The native page works without framework dependencies; the separate library page uses pinned Bootstrap 5.3.8 and compiled Tailwind CSS 4.3.3. The initial catalogs target modern browsers and separate HTML/CSS files; they do not route embedded CSS/JavaScript or support SCSS/Less. The extension stays offline and bundles no CSS frameworks.

## SQL

Open a `.sql` file for practical queries and a separate grouped SQL reference. Shared SQLite/PostgreSQL examples cover querying, joins, missing relationships, aggregates, NULL, CTEs, window functions, data changes, constraints, indexes, transactions and bound parameters. **Syntaxiser: Sql Dialect** defaults to SQLite; choose PostgreSQL in workspace/folder settings to browse its identity/RETURNING, upsert and JSONB topics. Dialect-specific cards carry an explicit first-line label. Saved SQL pins keep their identity across dialect changes.

Try [examples/context-tour.sql](../examples/context-tour.sql) and search **join tables**, **missing related rows**, **group totals**, **rank within group**, **null comparison**, **transaction rollback** or **parameterized query**. Go `database/sql` and TypeScript `pg` companions stay in their host-language catalogs; Python `sqlite3` content activates when the Python adapter is available. Five progressive SQL lessons provide a starter path for #36.

The [SQL playground](../playground/sql/README.md) executes all applicable cards on pinned SQLite and native PostgreSQL, verifies client bindings against real dependencies, and documents setup, supported versions, dialect differences and manual cursor/search/pin checks. The extension itself never opens a database or executes a query.

## Developer terminals

Select an integrated terminal or run **Syntaxiser: Use Active Terminal Context**. The sidebar switches to Terminal with 79 practical examples and 62 separately authored quick references covering shell navigation, files, pipelines, quoting, environment variables, Git, Cargo, Go, Node/package managers, TypeScript, HTTP, processes, and AWS CLI v2. Search **TypeScript**, **find files**, or **cargo test**; pins remain available across editors and terminals. Shell-script editors also use this catalog.

Node/TypeScript tooling now covers nvm, reproducible installs, package scripts and arguments, adding/removing/updating dependencies, dependency trees, audits, workspace filtering, local executables, Node tests/watch/debug/environment files, TypeScript config diagnostics and project-reference builds, ESLint, Prettier, Vitest, Vite, and package-content previews. Try `pnpm add`, `pnpm why`, `node --test`, `pnpm exec eslint`, or `tsc --build` in a new Zsh terminal, or search **dependency tree**, **script arguments**, or **test coverage**. Browse the separate **Node runtime and package managers** and **TypeScript, lint, test and build tools** reference groups. See the [pinned CLI tour and manual checks](../playground/shell/README.md#node-and-typescript-cli-tour).

AWS coverage includes profiles/SSO/STS, help, JMESPath/output/pagination, S3 transfers and sync, S3 API metadata, EC2, IAM, CloudWatch Logs/metrics/alarms, Lambda, CloudFormation, DynamoDB, Parameter Store/SSM sessions, Secrets Manager, ECR, ECS, and EKS. Type `aws s3 sync`, `aws logs tail`, or `aws --profile dev ec2 describe-instances` to get service-specific suggestions; search **SSO login**, **S3 backup**, or **AWS pagination**. The reference groups separate setup/data topics from service APIs. Every AWS overview links to [official AWS documentation](https://docs.aws.amazon.com/cli/latest/reference/).

AWS examples target CLI v2 and Bash/Zsh. Resource names are illustrative, live commands require your own account/permissions, and explanations identify writes, dependencies and sensitive output. Try the [offline AWS tour and manual test guide](../playground/shell/README.md#aws-cli-offline-tour) without an account; it validates representative commands locally using CLI-generated sample data. AWS CLI and service SDKs are not bundled with the extension.

With [VS Code shell integration](https://code.visualstudio.com/docs/terminal/shell-integration) enabled, starting or finishing a command in the active terminal updates suggestions using known tool names and subcommands. For example, `cargo test` suggests Rust testing, `go test ./...` suggests Go testing, and `pnpm exec tsc --noEmit` suggests TypeScript checks. Background terminals do not change the selected context. Move the editor cursor to resume Rust, Go, or TypeScript suggestions.

**Live typing in Zsh:** reload VS Code after installing, then create a **new Zsh terminal**. Type `git` and pause: the examples narrow to Git and matching quick references appear without pressing Enter. Type `git diff` to prioritize diff syntax; clear the line to restore general examples. The existing debounce setting controls the pause. New terminals load a small Zsh line-editor hook through a private temporary startup directory, preserving your normal `.zshenv` and `.zshrc`. Existing terminals must be recreated; no shell configuration files are edited.

VS Code's stable API does not expose the unfinished input line or reliable terminal focus changes, so live typing uses this Zsh hook. Other shells retain executed-command suggestions through shell integration and searchable references. Clicking an already selected terminal without typing may require **Use Active Terminal Context**. Without integration or live cues, the catalog remains searchable and browsable with a visible explanation. The hook writes only recognized tool names/subcommands into private temporary cue files; arguments, paths, values, output, and raw command history are never written. Cue files and watchers are removed on extension shutdown. The extension does not execute the commands you type.

Examples target Bash/Zsh and POSIX-style syntax, with Linux options where noted. PowerShell and fish syntax may differ. Developer tools must be installed separately; Terminal TypeScript examples reference the toolchain; TypeScript editors use the separate language catalog. Commands are copied as text and never executed by the sidebar.

[Back to the learning guide](../README.md).
