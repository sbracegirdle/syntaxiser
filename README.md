# Syntaxiser

**Learn programming languages while you write code.** Syntaxiser helps you understand unfamiliar syntax, see how it solves real tasks, and build confidence through practice. Its VS Code sidebar brings relevant examples and explorable syntax references beside your work, so you can connect what you're learning to the code in front of you.

Move your cursor to discover examples, search for a task in your own words, open a topic to understand its syntax, and pin useful examples to revisit. Current support includes Rust, Go, JavaScript/JSX, TypeScript/TSX, Python, HTML, CSS, SQL, and developer terminals; see [language and tool coverage](#supported-languages-and-tools) for details.

Everything runs locally: no API key, network requests, telemetry, or language model. Language-server symbols improve context detection when available, but are optional.
## SQL support

Open a `.sql` file for practical queries and a separate grouped SQL reference. Shared SQLite/PostgreSQL examples cover querying, joins, missing relationships, aggregates, NULL, CTEs, window functions, data changes, constraints, indexes, transactions and bound parameters. **Syntaxiser: Sql Dialect** defaults to SQLite; choose PostgreSQL in workspace/folder settings to browse its identity/RETURNING, upsert and JSONB topics. Dialect-specific cards carry an explicit first-line label. Saved SQL pins keep their identity across dialect changes.

Try [examples/context-tour.sql](examples/context-tour.sql) and search **join tables**, **missing related rows**, **group totals**, **rank within group**, **null comparison**, **transaction rollback** or **parameterized query**. Go `database/sql` and TypeScript `pg` companions stay in their host-language catalogs; Python `sqlite3` content activates when the Python adapter is available. Five progressive SQL lessons provide a starter path for #36.

The [SQL playground](playground/sql/README.md) executes all applicable cards on pinned SQLite and native PostgreSQL, verifies client bindings against real dependencies, and documents setup, supported versions, dialect differences and manual cursor/search/pin checks. The extension itself never opens a database or executes a query.

| Move your cursor | Search in plain language |
| --- | --- |
| [![Syntaxiser showing iterator examples in Relevant now](docs/screenshots/context.png)](docs/screenshots/context.png) | [![Search results for handle a missing value, including Option match and combinators](docs/screenshots/search.png)](docs/screenshots/search.png) |

*Click a screenshot to enlarge it. These captures use the extension's actual sidebar renderer and Rust retrieval results with a dark theme and five cards selected; editor chrome is omitted.*

## Start learning in a minute

Open a supported source file, select the Syntaxiser book icon in the Activity Bar, or run **Syntaxiser: Open Reference** from the Command Palette. Use your own project, or try a short cursor tour: [Rust](examples/context-tour.rs), [Go](examples/context-tour.go), or [TypeScript](examples/context-tour.ts).

1. **Discover an example.** Move onto a declaration, loop, or function call. **Example snippets** changes with the code around your cursor.
2. **Ask about a task.** Search for something you want to do, such as **handle a missing value**. Read a matching snippet and open **ⓘ** for its explanation.
3. **Understand the topic.** Use **↗ Browse reference** on a snippet to explore its syntax forms and rules. Topic overviews and practical examples stay separate, so you can study both the general idea and its application.
4. **Try it yourself.** Adapt the example in your project or a [playground](#supported-languages-and-tools), run it, and change an input or approach to check your understanding. Some snippets need surrounding code or dependencies described in their explanations.
5. **Keep what helps.** Pin an example to revisit during your next task. Clear the search to return to cursor-based suggestions.

Cards show code only. Hover over a snippet or its **ⓘ** button for a short explanation in a styled panel that follows VS Code's theme. Click **ⓘ** to keep it open, or focus the button and press Enter or Space. Close it with Escape, the close button, or a click outside. The panel wraps within the sidebar and opens above the snippet when needed; card dimensions and copied code stay unchanged. The examples are fixed reference snippets; some use illustrative names or require surrounding code and dependencies.

## Understand the syntax behind an example

Each topic in **Reference** includes a **References** list below its syntax and rules, linking to official documentation and other high-quality learning material. Use a contextual snippet's topic link or a quick-reference heading to reach these sources. Rust, Go, JavaScript/JSX, TypeScript (including its libraries), Python, HTML, CSS, and Terminal topics all include links. Browsing and searching remain offline; opening an external source requires internet access.

Choose **Reference** beside **Context** to browse the local catalog for the active language (Rust by default before a supported file is opened). Reference uses left/right panes: the expanded vertical topic list on the left and the syntax overview on the right. Each pane scrolls independently. Type in **Search topics** to filter topic names, area headings, and aliases; Enter opens the first match and Escape clears the filter. The topic search is separate from contextual snippet search. With one topic per row under its area heading, choose a topic for a dedicated quick-reference overview of its syntax forms, variations, and essential rules. These overviews are independently written; contextual snippets remain practical examples of use.

Use a snippet’s **↗ Browse reference** button in contextual results, search results, or pins to explore all the topics it covers. All related overviews appear together. Choose a topic directly from the always-visible tree to open a single overview. Pins remain available alongside the overview. Return to **Context** to resume contextual suggestions or your existing search. The selected mode and topics survive webview reloads.

On **Context**, **Quick reference** shows up to two matching syntax overviews above **Example snippets**. Each preview has an accent edge, a topic link, and three visible lines of syntax; scroll within it to read more, or choose its title to open the full summary, syntax, and rules in Reference. For example, selecting `for` in a loop suggests **Loops**. Context matches use the word under the cursor, current line, and nearby code, and clear when no supported editor is active.

Searching updates both sections for the query: overview matches are ranked independently from practical examples, with at most two previews regardless of your example-card count. Recognized concepts take precedence over incidental mentions in other overviews; queries without recognized concepts can also match overview text. Clearing search restores cursor-based previews. Returning from Reference preserves your search. The previews use the separate overview catalogs and never substitute practical snippets.

## Find an example for your task

Search uses the active language or terminal catalog. For example, try **type guard** in TypeScript, **goroutine** in Go, or **find files** in Terminal. In Rust, you can search by syntax (`split_at_mut`, `sort_by_key`, `get_or_insert_with`) or by the task you're trying to remember:

| Search for | Examples you'll find |
| --- | --- |
| `handle a missing value` | `Option`, `Some` / `None`, `match`, converting to `Result` |
| `read without moving` | Shared references and borrowing with `&str` |
| `change through reference` | `&mut` and mutable borrowing |
| `transform collection` | `.iter()`, `.filter()`, `.map()`, `.collect()` |
| `string arrays` | Fixed arrays of `&str` and `String`, plus initialization with `from_fn` |
| `string vectors` | Growable `Vec<&str>` and `Vec<String>` collections |
| `propagate error` | `Result` and the `?` operator |
| `key value lookup table` | `HashMap`, lookup, and updating entries |
| `read file line by line` | `BufReader` and `.lines()` |
| `stop on first error` | Collecting an iterator into `Result<Vec<_>, _>` |
| `web server` | Axum and Actix Web startup, routing, and server state |

Search replaces the contextual **Example snippets** while the box contains text. Clear it to resume cursor-based suggestions. Queries outside the curated pack may return no cards; try a concept or library name.

## Learn from practical examples

These Rust examples show how to connect a task to its syntax. Use the same approach in any supported language: read an example, open its topic overview, then try a small variation in your own project or a playground.

### Handle an optional value

Search **handle a missing value** when you need to remember the shape of a `match`:

```rust
let value: Option<i32> = Some(42);

let number = match value {
    Some(number) => number,
    None => 0,
};
```

The same search also finds ways to filter an `Option`, flatten nested options, or turn a missing value into an error.

### Borrow a string and keep using it

Search **read without moving** for an example of accepting a shared reference:

```rust
fn length(text: &str) -> usize {
    text.len()
}

let text = String::from("hello");
let size = length(&text);
println!("{text}: {size}");
```

The caller still owns `text` after the function returns. For a function that changes the value, try **change through reference** instead.

### Filter, transform, and collect

Move onto an iterator chain or search **transform collection**:

```rust
let values = vec![1, 2, 3, 4];
let doubled: Vec<i32> = values
    .iter()
    .copied()
    .filter(|n| n % 2 == 0)
    .map(|n| n * 2)
    .collect();
```

This produces `[4, 8]`. Nearby cards cover `fold`, `sum`, `enumerate`, `zip`, and choosing between `iter`, `iter_mut`, and `into_iter`.

### Return early on an error

Search **propagate error** for a function that uses `?` for both file I/O and parsing:

```rust
fn read_number(path: &str)
    -> Result<i32, Box<dyn std::error::Error>>
{
    let text = std::fs::read_to_string(path)?;
    let number = text.trim().parse()?;
    Ok(number)
}
```

For a file containing `42`, this returns `Ok(42)`. A missing file or invalid integer returns an error to the caller.

### Read a file one line at a time

Search **read file line by line** for buffered reading:

```rust
use std::fs::File;
use std::io::{BufRead, BufReader};

let reader = BufReader::new(File::open("input.txt")?);
for line in reader.lines() {
    let line = line?;
    println!("{line}");
}
```

Use this fragment inside a function that returns a compatible `Result`. Related cards cover buffered writing and reading standard input.

### Remember how to start a web server

Search **web server** for Axum and Actix Web alternatives. For example, the Axum card shows a `/health` route:

```rust
use axum::{routing::get, Router};

let app = Router::new()
    .route("/health", get(|| async { "healthy" }));
let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
axum::serve(listener, app).await?;
```

This fragment needs Axum 0.8, Tokio with the runtime and networking features it uses, and an async function returning a compatible `Result`. The sidebar supplies reference code; add the crates to your own project. More specific searches include **axum json response**, **actix query parameters**, and **request middleware**.

## Keep a small personal reference

Pin a borrowing example and an iterator pipeline, then search **propagate error**. Both pins stay at the top while the search results change:

<a href="https://github.com/sbracegirdle/syntaxiser/blob/main/docs/screenshots/pins.png"><img src="docs/screenshots/pins.png" alt="Two collapsed pinned cards stay above search results for propagate error" width="460"></a>

- Click a card's pin icon to keep it; click it again to unpin.
- Use the arrow on a pin to collapse it to its first line, or click **Pinned** to fold the entire group.
- Pins and collapse choices survive cursor movement, searches, and VS Code reloads in the same workspace.
- Choose 5, 12, 20, or 30 initial cards in the header. **Show more** reveals further results, up to sixty; pins have their own space above the list.

## Learn with small challenges

Open **Lesson browser** to explore 12 Rust challenges, 12 Go challenges and 10 Python challenges, progressing from your first greeting to tested command-line projects and concurrency. A difficulty tree on the left lists lesson titles; select one to read its complete task and completion check on the right. The selected lesson is remembered separately for each language. Lessons follow the sidebar's current language context automatically and do not provide solutions. Write your solution in the editor and mark your own progress; Syntaxiser does not execute or grade it.

- Use the single filter row to select difficulty and status. The **↑ / ↓** button switches easiest/hardest first; the **✓** toggle hides completed tasks. Choose the **Done** status filter to see completed tasks again.
- Built-in tasks start untracked in the browser. Click **In progress** while working, **To do** for an upcoming task, or **Done** when satisfied. **Lesson tracker** shows tracked work as cards: In progress first, To do next, and Done last. Difficulty sorting applies within each group. Click the selected status again to stop tracking; the lesson remains available in the browser.
- Status labels, symbols, colored borders, and subtle backgrounds distinguish to-do, in-progress, and completed cards; completed lessons show a green tick.
- Click a lesson's **⊘** button to hide it. Hidden lessons stay out of normal results and completion totals, and remain hidden after reloading. Select **Hidden** in the status filter, then click **↶** to restore a lesson, or choose a new status directly.
- Tracker cards show instructions immediately, with **Show more** for long content. The browser shows the full selected lesson in its scrollable content pane. Status changes, hidden lessons, and personal edits are shared between both tabs.
- **New lesson** needs only a **Title** and **Description**. Include any code or completion check in the description. Your lessons start as **To do**, use a dashed outline and **Your lesson** label, and offer **Edit** and **Delete…** controls. New lessons use the selected difficulty level, or level 1 when all levels are shown. Each language can hold up to 200 custom lessons.
- Progress and custom lessons survive VS Code reloads in the same workspace, separately for each language. Filters and the selected tab are restored when the sidebar reopens.
- **Reset this language…** or **Reset all languages…** asks whether to reset progress alone or also remove custom lessons. Resetting does not change reference-card pins.

For a manual check, select a Rust lesson in the browser and mark it in progress. Switch to the tracker and confirm its card appears. Add another To do task, then switch to a Go file and select a different lesson. Reload and confirm each language retains its browser selection and progress. Create a personal lesson, try the filters and hidden recovery, cancel a reset, then reset one language and confirm the other is unchanged.

## HTML and CSS support

Open a `.html` or `.css` file to switch context, search, highlighting, and the reference browser. HTML has 17 topics/examples covering document structure, semantics, text, links, images, lists, tables, forms, native disclosure, accessibility, and Bootstrap/Tailwind. CSS has 20 topics/examples covering selectors, cascade/layers, boxes, values, colors, typography, flex/grid, positioning, overflow, focus, responsive/container queries, custom properties, motion, and Bootstrap/Tailwind customization. Each topic has a separately authored overview and learning-source links.

Try **email validation**, **responsive images**, **responsive grid**, **focus visible**, **bootstrap button**, or **tailwind theme**. Pins survive language switches; custom lessons and their progress are tracked independently for HTML and CSS. Built-in lessons currently cover Rust. HTML snippets display and copy as literal markup, and never execute in the sidebar.

See the [runnable garden journal and manual checks](playground/web/README.md). The native page works without framework dependencies; the separate library page uses pinned Bootstrap 5.3.8 and compiled Tailwind CSS 4.3.3. The initial catalogs target modern browsers and separate HTML/CSS files; they do not route embedded CSS/JavaScript or support SCSS/Less. The extension stays offline and bundles no CSS frameworks.

## Python support

Open a .py file for Python Context, Search, Reference and Pins. The catalog includes 25 separate overviews and 26 practical examples covering fundamentals, pathlib/JSON/CSV/logging, pytest, HTTPX, Pydantic and FastAPI. Try **read csv**, **read file with pathlib**, **pytest fixture**, **httpx timeout**, **pydantic validation** or **fastapi request**. Ten progressive Python tasks are available in Lesson browser.

The [locked uv playground](playground/python/README.md) runs every practical example with Python 3.13.7 and real pinned dependencies using local files and in-process/mock HTTP. It includes a runnable editor tour and manual search, copy, pin and language-switching checks. See [Python coverage and limitations](docs/python-support.md) for versions, official learning sources and validation commands.

## JavaScript and JSX support

Open a `.js` or `.jsx` file for JavaScript examples, React/JSX tasks, Express routes and errors, and Vitest/Testing Library recipes. Search **react props**, **click handler**, **effect cleanup**, **fetch cancel**, **read file node**, or **express error middleware**. JavaScript cards contain no TypeScript syntax. TSX has corresponding typed props, events and refs.

Follow the [runnable four-file playground](playground/javascript/README.md) for browser interactions and manual sidebar testing. See [coverage, state identity, versions and checks](docs/javascript-support.md). JS/JSX share their own pins and personal lesson progress; TS/TSX retain their existing TypeScript state.

## Supported languages and tools

The current catalogs cover Rust, Go, JavaScript/JSX, TypeScript/TSX, Python, HTML, CSS, and developer terminals. The goal is to support learning across languages; coverage varies by catalog. The active supported editor selects its catalog automatically, and pins remain available when you switch.

### Rust

Rust includes 277 practical examples and 115 separate topic overviews, from core syntax to common libraries. Try the runnable [Rust playground](playground/src/main.rs) in the `playground/` Cargo project, or start with the [cursor tour](examples/context-tour.rs).

Search common libraries directly: **serde**, **thiserror**, **anyhow**, **clap**, **rand**, **regex**, **tracing**, or **tokio channel**. Focused recipes also cover custom iterators, Send/Sync, borrowed APIs, directory/process handling, doctests, pinned futures and streams, data/configuration helpers, derive macros, and deeper HTTP workflows. Cargo manifests live in a separate tooling area with TOML highlighting. Each new topic has its own overview, independently written from practical examples.

See [Rust coverage and validated versions](docs/rust-coverage.md) for dependency features, supported API versions, recipe layouts and compiler/runtime validation. New snippets are compiled directly from the catalog against pinned Cargo fixtures with `pnpm check:rust:libraries`.

### Go

Go starts with 26 practical examples and 26 separate syntax overviews. Open a `.go` file to switch context suggestions, search, highlighting, and the reference browser to Go. Try [examples/context-tour.go](examples/context-tour.go): move between imports, declarations, a map lookup, and channel operations. Search **key value lookup**, **propagate error**, or **goroutine**, then choose **Reference** to browse five groups covering declarations, control flow, data, abstraction, and concurrency. Pins from all supported languages remain available when switching files.

Go topic overviews in `packs/go-reference.json` describe syntax forms and essential rules separately from the practical examples in `packs/go.json`. Snippets may require the imports and surrounding variables described by their code; they are reference fragments rather than complete programs. The initial catalog covers core Go syntax, not every standard-library API. Generics require Go 1.18+, integer range 1.22+, and iterator-function range 1.23+. Content is independently authored using the [Go specification](https://go.dev/ref/spec) and [Effective Go](https://go.dev/doc/effective_go).

### TypeScript

TypeScript includes 65 examples across 51 core and popular-library topics. Open a `.ts` or `.tsx` file to switch context suggestions, search, highlighting, and the reference browser to TypeScript. Try [examples/context-tour.ts](examples/context-tour.ts): move between an import, an interface, a map lookup, optional chaining, and an async function. Search **type guard**, **handle missing value**, **partial update**, or **key value lookup**. Pins from all supported languages remain available when switching editors.

The TypeScript catalog covers declarations, object and generic types, narrowing, collections, async/error handling, classes, enums, type transformations, and 14 popular libraries: React, Next.js, Vue, Angular, Express, Zod, Axios, Lodash, date-fns, RxJS, TanStack Query, Zustand, Jest, and Vitest. Practical examples live in `packs/typescript.json`; dedicated syntax forms and essential rules live separately in `packs/typescript-reference.json`. TSX files use the same catalog, including React components and hooks. Library names and task phrases are searchable; imported APIs and aliases guide contextual suggestions. Vue Composition API and Angular core snippets work in .ts files; .vue files and Angular templates have separate language IDs outside this adapter. The `satisfies` example requires TypeScript 4.9+. Content is independently authored with reference to the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

For a runnable project with broader cursor contexts, open [playground/typescript/main.ts](playground/typescript/main.ts) and follow its [playground instructions](playground/typescript/README.md). It exercises types, collections, async work, search, Reference, and switching languages with retained pins.

The [library playground](playground/typescript/libraries/README.md) provides runnable examples and Jest/Vitest checks. Install its dependencies with `pnpm --dir playground/typescript/libraries install --ignore-scripts`, then run `pnpm check:typescript` to type-check all 54 practical examples against the real library declarations without executing them. The core local-import example uses a small `models.ts` fixture supplied by the checker. Library versions, usage evidence, and source links are listed in [TypeScript library coverage](docs/typescript-libraries.md). The extension bundles catalog text only; it does not install or execute these libraries in your project. Overview syntax is schematic and is not compiled.

### Developer terminals

Select an integrated terminal or run **Syntaxiser: Use Active Terminal Context**. The sidebar switches to Terminal with 79 practical examples and 62 separately authored quick references covering shell navigation, files, pipelines, quoting, environment variables, Git, Cargo, Go, Node/package managers, TypeScript, HTTP, processes, and AWS CLI v2. Search **TypeScript**, **find files**, or **cargo test**; pins remain available across editors and terminals. Shell-script editors also use this catalog.

Node/TypeScript tooling now covers nvm, reproducible installs, package scripts and arguments, adding/removing/updating dependencies, dependency trees, audits, workspace filtering, local executables, Node tests/watch/debug/environment files, TypeScript config diagnostics and project-reference builds, ESLint, Prettier, Vitest, Vite, and package-content previews. Try `pnpm add`, `pnpm why`, `node --test`, `pnpm exec eslint`, or `tsc --build` in a new Zsh terminal, or search **dependency tree**, **script arguments**, or **test coverage**. Browse the separate **Node runtime and package managers** and **TypeScript, lint, test and build tools** reference groups. See the [pinned CLI tour and manual checks](playground/shell/README.md#node-and-typescript-cli-tour).

AWS coverage includes profiles/SSO/STS, help, JMESPath/output/pagination, S3 transfers and sync, S3 API metadata, EC2, IAM, CloudWatch Logs/metrics/alarms, Lambda, CloudFormation, DynamoDB, Parameter Store/SSM sessions, Secrets Manager, ECR, ECS, and EKS. Type `aws s3 sync`, `aws logs tail`, or `aws --profile dev ec2 describe-instances` to get service-specific suggestions; search **SSO login**, **S3 backup**, or **AWS pagination**. The reference groups separate setup/data topics from service APIs. Every AWS overview links to [official AWS documentation](https://docs.aws.amazon.com/cli/latest/reference/).

AWS examples target CLI v2 and Bash/Zsh. Resource names are illustrative, live commands require your own account/permissions, and explanations identify writes, dependencies and sensitive output. Try the [offline AWS tour and manual test guide](playground/shell/README.md#aws-cli-offline-tour) without an account; it validates representative commands locally using CLI-generated sample data. AWS CLI and service SDKs are not bundled with the extension.

With [VS Code shell integration](https://code.visualstudio.com/docs/terminal/shell-integration) enabled, starting or finishing a command in the active terminal updates suggestions using known tool names and subcommands. For example, `cargo test` suggests Rust testing, `go test ./...` suggests Go testing, and `pnpm exec tsc --noEmit` suggests TypeScript checks. Background terminals do not change the selected context. Move the editor cursor to resume Rust, Go, or TypeScript suggestions.

**Live typing in Zsh:** reload VS Code after installing, then create a **new Zsh terminal**. Type `git` and pause: the examples narrow to Git and matching quick references appear without pressing Enter. Type `git diff` to prioritize diff syntax; clear the line to restore general examples. The existing debounce setting controls the pause. New terminals load a small Zsh line-editor hook through a private temporary startup directory, preserving your normal `.zshenv` and `.zshrc`. Existing terminals must be recreated; no shell configuration files are edited.

VS Code's stable API does not expose the unfinished input line or reliable terminal focus changes, so live typing uses this Zsh hook. Other shells retain executed-command suggestions through shell integration and searchable references. Clicking an already selected terminal without typing may require **Use Active Terminal Context**. Without integration or live cues, the catalog remains searchable and browsable with a visible explanation. The hook writes only recognized tool names/subcommands into private temporary cue files; arguments, paths, values, output, and raw command history are never written. Cue files and watchers are removed on extension shutdown. The extension does not execute the commands you type.

Examples target Bash/Zsh and POSIX-style syntax, with Linux options where noted. PowerShell and fish syntax may differ. Developer tools must be installed separately; Terminal TypeScript examples reference the toolchain; TypeScript editors use the separate language catalog. Commands are copied as text and never executed by the sidebar.

## Install from source

Requires VS Code 1.93 or newer, plus Node for building the package. The Node version is recorded in [.nvmrc](.nvmrc).

```sh
git clone https://github.com/sbracegirdle/syntaxiser.git
cd syntaxiser
nvm install
nvm use
pnpm install
pnpm package
```

In VS Code, run **Extensions: Install from VSIX…** and select the generated `syntaxiser-0.4.3.vsix`. Open a Rust, Go, or TypeScript file and run **Syntaxiser: Open Reference**. When updating an installed version, accept the reload prompt.

## Settings

The default is twelve cards per section, with updates after a 350 ms pause in cursor movement or edits.

```json
{
  "syntaxiser.maxCards": 5,
  "syntaxiser.debounceMs": 350
}
```

| Setting | Default | Range |
| --- | --- | --- |
| `syntaxiser.maxCards` | 12 | 3–30 initial cards; Show more reveals additional cards |
| `syntaxiser.debounceMs` | 350 | 100–2000 ms |

The card-count menu saves to the existing setting's scope, or to user settings when there is no override. Settings follow the active document, including workspace-folder and language overrides.

## Develop and contribute

Add this project folder to your existing VS Code workspace. After installing dependencies, run `pnpm test`, select **Run Syntaxiser** in Run and Debug, and press F5 to open the Extension Development Host with the tour file.

The test suite covers retrieval, scope scanning, controller events, rendering, search, pins, paging, settings, and syntax highlighting. With `rustfmt` installed, `pnpm check:rust` also parses the reference cards as Rust fragments.

See [how Syntaxiser works](docs/how-it-works.md) for ranking, offline behavior, accessibility, implementation limits, adding a language, and validation details. To extend the learning material, keep topic syntax/API overviews separate from practical task examples and validate both against the language or library they teach. The contextual examples live in [packs/rust.json](packs/rust.json), [packs/go.json](packs/go.json), and [packs/typescript.json](packs/typescript.json); [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) covers bundled highlighting licenses.

Licensed under [MIT](LICENSE).

## Public website (local preview)

The learning-focused landing page lives in [website/](website/README.md). Preview it with `pnpm exec node website/server.cjs`, then open `http://127.0.0.1:4188`. It includes examples, sidebar screenshots, and source installation instructions. It has not been deployed and is excluded from the extension package.
