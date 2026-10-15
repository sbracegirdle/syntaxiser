# Syntaxiser

**Rust, Go, TypeScript, and developer terminal references beside the code you're writing.** Syntaxiser is an offline VS Code sidebar with contextual examples and a browsable language reference. Rust includes 211 snippets across 83 topics; Go and TypeScript each start with 26 examples and 26 separate syntax overviews. Move your cursor to see relevant examples, search for what you want to do, and pin the ones you keep reaching for.

Everything runs locally: no API key, network requests, telemetry, or language model. Language-server symbols improve context detection when available, but are optional. The active editor selects the language automatically.

| Move your cursor | Search in plain language |
| --- | --- |
| [![Syntaxiser showing iterator examples in Relevant now](docs/screenshots/context.png)](docs/screenshots/context.png) | [![Search results for handle a missing value, including Option match and combinators](docs/screenshots/search.png)](docs/screenshots/search.png) |

*Click a screenshot to enlarge it. These captures use the extension's actual sidebar renderer and Rust retrieval results with a dark theme and five cards selected; editor chrome is omitted.*

## A one-minute tour

Open a `.rs` file, select the Syntaxiser book icon in the Activity Bar, or run **Syntaxiser: Open Reference** from the Command Palette. Try [examples/context-tour.rs](examples/context-tour.rs):

1. Put your cursor near the top-level `use` statement. **Example snippets** shows file-scope examples such as imports and declarations.
2. Move to `let maybe_user: Option<User> = …` inside `main`. The examples shift toward handling optional values.
3. Move to the `.iter().map(…).collect()` line. Iterator and collection examples move up the list.
4. Search for **read without moving**. The list switches to search results, including borrowing with `&str`.
5. Pin a useful card, then clear the search. Contextual examples return, and your pin stays above them.

Cards show code only. Hover over a snippet or its **ⓘ** button for a short explanation in a styled panel that follows VS Code's theme. Click **ⓘ** to keep it open, or focus the button and press Enter or Space. Close it with Escape, the close button, or a click outside. The panel wraps within the sidebar and opens above the snippet when needed; card dimensions and copied code stay unchanged. The examples are fixed reference snippets; some use illustrative names or require surrounding code and dependencies.

## Go support

Open a `.go` file to switch context suggestions, search, highlighting, and the reference browser to Go. Try [examples/context-tour.go](examples/context-tour.go): move between imports, declarations, a map lookup, and channel operations. Search **key value lookup**, **propagate error**, or **goroutine**, then choose **Reference** to browse five groups covering declarations, control flow, data, abstraction, and concurrency. Pins from all supported languages remain available when switching files.

Go topic overviews in `packs/go-reference.json` describe syntax forms and essential rules separately from the practical examples in `packs/go.json`. Snippets may require the imports and surrounding variables described by their code; they are reference fragments rather than complete programs. The initial catalog covers core Go syntax, not every standard-library API. Generics require Go 1.18+, integer range 1.22+, and iterator-function range 1.23+. Content is independently authored using the [Go specification](https://go.dev/ref/spec) and [Effective Go](https://go.dev/doc/effective_go).

## TypeScript support

Open a `.ts` or `.tsx` file to switch context suggestions, search, highlighting, and the reference browser to TypeScript. Try [examples/context-tour.ts](examples/context-tour.ts): move between an import, an interface, a map lookup, optional chaining, and an async function. Search **type guard**, **handle missing value**, **partial update**, or **key value lookup**. Pins from all supported languages remain available when switching editors.

The initial TypeScript catalog covers declarations, object and generic types, narrowing, collections, async/error handling, classes, enums, and common type transformations. Practical examples live in `packs/typescript.json`; dedicated syntax forms and essential rules live separately in `packs/typescript-reference.json`. TSX files use the same core TypeScript catalog; JSX and framework-specific examples are not included yet. The `satisfies` example requires TypeScript 4.9+. Content is independently authored with reference to the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

For a runnable project with broader cursor contexts, open [playground/typescript/main.ts](playground/typescript/main.ts) and follow its [playground instructions](playground/typescript/README.md). It exercises types, collections, async work, search, Reference, and switching languages with retained pins.

Run `pnpm check:typescript` to type-check all practical examples as independent strict modules without executing them. The local import example uses a small `models.ts` fixture supplied by the checker. Overview syntax is schematic and is not compiled.

## Terminal support

Select an integrated terminal or run **Syntaxiser: Use Active Terminal Context**. The sidebar switches to Terminal with 26 practical examples and 26 separately authored quick references covering shell navigation, files, pipelines, quoting, environment variables, Git, Cargo, Go, Node/package managers, TypeScript, HTTP, and processes. Search **TypeScript**, **find files**, or **cargo test**; pins remain available across editors and terminals. Shell-script editors also use this catalog.

With [VS Code shell integration](https://code.visualstudio.com/docs/terminal/shell-integration) enabled, starting or finishing a command in the active terminal updates suggestions using known tool names and subcommands. For example, `cargo test` suggests Rust testing, `go test ./...` suggests Go testing, and `pnpm exec tsc --noEmit` suggests TypeScript checks. Background terminals do not change the selected context. Move the editor cursor to resume Rust, Go, or TypeScript suggestions.

**Live typing in Zsh:** reload VS Code after installing, then create a **new Zsh terminal**. Type `git` and pause: the examples narrow to Git and matching quick references appear without pressing Enter. Type `git diff` to prioritize diff syntax; clear the line to restore general examples. The existing debounce setting controls the pause. New terminals load a small Zsh line-editor hook through a private temporary startup directory, preserving your normal `.zshenv` and `.zshrc`. Existing terminals must be recreated; no shell configuration files are edited.

VS Code's stable API does not expose the unfinished input line or reliable terminal focus changes, so live typing uses this Zsh hook. Other shells retain executed-command suggestions through shell integration and searchable references. Clicking an already selected terminal without typing may require **Use Active Terminal Context**. Without integration or live cues, the catalog remains searchable and browsable with a visible explanation. The hook writes only recognized tool names/subcommands into private temporary cue files; arguments, paths, values, output, and raw command history are never written. Cue files and watchers are removed on extension shutdown. The extension does not execute the commands you type.

Examples target Bash/Zsh and POSIX-style syntax, with Linux options where noted. PowerShell and fish syntax may differ. Developer tools must be installed separately; Terminal TypeScript examples reference the toolchain; TypeScript editors use the separate language catalog. Commands are copied as text and never executed by the sidebar.

## Rust search recipes

You can search by syntax (`split_at_mut`, `sort_by_key`, `get_or_insert_with`) or by the task you're trying to remember:

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

Search replaces **Relevant now** while the box contains text. Clear it to resume cursor-based suggestions. Queries outside the curated pack may return no cards; try a concept or library name.

## Examples you can keep beside your code

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

See [how Syntaxiser works](docs/how-it-works.md) for ranking, offline behavior, accessibility, implementation limits, adding a language, and validation details. The contextual examples live in [packs/rust.json](packs/rust.json), [packs/go.json](packs/go.json), and [packs/typescript.json](packs/typescript.json); [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) covers bundled highlighting licenses.

Licensed under [MIT](LICENSE).

### Browse the language reference

Choose **Reference** beside **Context** to browse the local catalog for the active language (Rust by default before a supported file is opened). Reference uses left/right panes: the expanded vertical topic list on the left and the syntax overview on the right. Each pane scrolls independently. Type in **Search topics** to filter topic names, area headings, and aliases; Enter opens the first match and Escape clears the filter. The topic search is separate from contextual snippet search. With one topic per row under its area heading, choose a topic for a dedicated quick-reference overview of its syntax forms, variations, and essential rules. These overviews are independently written; contextual snippets remain practical examples of use.

Use a snippet’s **↗ Browse reference** button in contextual results, search results, or pins to explore all the topics it covers. All related overviews appear together. Choose a topic directly from the always-visible tree to open a single overview. Pins remain available alongside the overview. Return to **Context** to resume contextual suggestions or your existing search. The selected mode and topics survive webview reloads.

On **Context**, **Quick reference** shows up to two matching syntax overviews above **Example snippets**. Each preview has an accent edge, a topic link, and three visible lines of syntax; scroll within it to read more, or choose its title to open the full summary, syntax, and rules in Reference. For example, selecting `for` in a loop suggests **Loops**. Context matches use the word under the cursor, current line, and nearby code, and clear when no supported editor is active.

Searching updates both sections for the query: overview matches are ranked independently from practical examples, with at most two previews regardless of your example-card count. Recognized concepts take precedence over incidental mentions in other overviews; queries without recognized concepts can also match overview text. Clearing search restores cursor-based previews. Returning from Reference preserves your search. The previews use the separate overview catalogs and never substitute practical snippets.

The 83 Rust topic overviews live in `packs/rust-reference.json`, separately from the 211 practical examples in `packs/rust.json`. Overview syntax uses schematic names and may show several independent forms rather than a standalone compilable program.

Language packs can supply optional `referenceGroups` metadata: an ordered list of groups with `id`, `title`, and concept IDs in `topics`. Optional `referenceTopics` contains overviews with `id`, `title`, `summary`, `syntax`, and `rules`, linked by concept ID. Ungrouped concepts appear under Other topics; missing overview content is explicitly marked as unavailable. Future language and library catalogs should keep the same content distinction.
