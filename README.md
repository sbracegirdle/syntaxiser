# Syntaxiser

A small VS Code sidebar for remembering language syntax while you work. Open a Rust file and move your cursor: **Relevant now** initially shows twelve curated code cards. Each section has a **Show more** button to browse additional cards, up to sixty. The search box accepts syntax terms or phrases such as “handle a missing value”, “read without moving”, “transform collection”, and “web server”. Search results replace Relevant now while the search box contains text; clearing it restores the contextual cards.

Cards display code only. Hover over a snippet to read a concise explanation in a native tooltip; screen readers can also access the explanation when the code receives keyboard focus. Explanations appear only on hover, add no visible controls, and leave card size, styling, and copied code unchanged. All 209 Rust snippets include explanations, including search results and expanded or collapsed pins.

Cards are fixed reference examples, sometimes fragments with illustrative names. They are not generated completions or standalone programs. The extension has no insertion action, external runtime dependencies, network requests, telemetry, API keys, or LLM requirement. Rust syntax highlighting is bundled locally.

## Try it

Install the generated `syntaxiser-0.4.1.vsix` using **Extensions: Install from VSIX…**, then open a `.rs` file and select the Syntaxiser book icon in the Activity Bar. You can also run **Syntaxiser: Open Reference** from the Command Palette. When replacing an earlier version, accept VS Code's reload prompt.

For development, add this project folder to your existing VS Code workspace, then:

```sh
nvm install
nvm use
npm ci
npm test
```

Select **Run Syntaxiser** in Run and Debug and press F5. This launches a dedicated Extension Development Host with `examples/context-tour.rs`. At the top of the file you should see imports and declarations; in `main`, move onto `Option`, `&self`, or the iterator pipeline to see the cards change. To build an installable package:

```sh
npm run package
```

Rust-analyzer is optional. Its document symbols refine scope detection when available; the built-in scanner supplies immediate results independently.

## Retrieval

The Rust pack contains **209 cards across 83 concepts**, stored in `packs/rust.json`. Searchable metadata includes topics, keywords, scopes, priority, and titles; the card UI renders only `code`. Optional `explanation` metadata supplies plain text for hover tooltips and accessibility descriptions and does not affect search ranking. Packs without explanations continue to work. Content is independently curated from common Rust syntax rather than fetched from documentation.

Coverage includes ownership, borrowing, lifetimes, strings and Unicode, arrays and slices, tuples, pattern matching, Option and Result combinators, iterators, vectors, maps, sets, queues, sorting, numeric operations, traits, conversions, const generics, macros, attributes, tests, file and buffered I/O, paths, command-line arguments, threads, channels, atomics, async syntax, TCP/UDP networking, HTTP clients, and web servers.

Core syntax also includes arithmetic, comparison, boolean and bitwise operators; block values and semicolons; early return, unit and never types; while/continue and labelled loops or blocks; destructuring assignment and let chains; function pointers, closure bounds, returned closures and async closures; const functions and inline const; generic data types and default type parameters; supertraits, default methods, generic associated types and lifetime bounds; type aliases, turbofish and qualified paths; enum discriminants, raw identifiers, unsafe functions, raw pointers, unions and C ABI declarations. Unsafe examples describe their validity requirements in the hover explanation.

The let-chain card requires Rust 1.88+ and edition 2024; async closures require Rust 1.85+. These requirements appear in the corresponding explanations. The FFI example declares a native C function that must be supplied at link time. The pack is a practical reference for common stable syntax, not an exhaustive Rust language specification.

Web references include Axum 0.8 and Actix Web 4 server startup, routes, JSON handlers, path/query parameters, shared state, responses, and middleware. The code names the libraries it uses. Those cards require the corresponding crates in the user's project; serde examples need its derive feature, Reqwest JSON examples need its json feature, and Tokio examples need the runtime/net/io/signal features they use. The extension itself installs none of these crates.

This MVP uses deterministic **concept embeddings**, not pretrained neural embeddings. Each curated language concept forms a vector dimension. Natural-language aliases and syntax patterns encode queries, and weighted topic metadata encodes cards. Cosine similarity combines with TF-IDF lexical similarity. Automatic ranking additionally weights cursor-line code, nearby code, enclosing symbols, imports, recent edits, and scope. Diversity scoring reduces repeated topics. Empty or unrecognized manual queries produce no results.

This is fast and offline, but semantic coverage depends on both the reference content and the aliases in the pack. It cannot invent examples for a topic absent from the pack; arbitrary paraphrases may also need additional aliases. “Web server” previously had neither cards nor a concept entry. It now has both, alongside phrases such as “HTTP server”, “web API”, and “REST API”. `SemanticEncoder` is replaceable with a local neural encoder, provided it supplies compatible vectors for cards and queries; no model is included in this MVP.

The controller retrieves up to sixty candidates per section. The webview renders the configured initial page and appends more on demand, keeping the existing highlighted nodes intact. A new result set resets that section's page; search and automatic reference expand independently.

Use the pin icon on any contextual or search card to keep it in **Pinned**, above the active results. Pins stay available across cursor movement, file/language changes, and searches. A pinned card appears once, rather than repeating in the result list. Click its pin icon again to remove it. Each pin has an expand/collapse arrow; collapsed pins show their first code line. Click the **Pinned** heading to collapse or expand the entire group. Pins do not count toward the initial result-page size.

Pin identifiers and collapse preferences are saved locally per VS Code workspace and survive window reloads. Stored identifiers include the language, and pinned code is resolved from the current reference pack when the extension starts. Removed cards are ignored; updated snippets use the new curated content. Closing and reopening the sidebar preserves pins and their collapse state.

Cursor and edit events are debounced by 350 ms. Repeated movement within the same word and line is ignored. Recent edits are per document, limited to eight entries, and expire after 45 seconds. Symbol results are cached per document version for 15 seconds, with an 800 ms timeout and stale-response guards. Hidden views skip retrieval until reopened. All source context stays in extension-host memory; only reference cards and UI state reach the webview. The manual search text is retained in VS Code's webview state; pin identifiers and collapse preferences use local workspace storage.

The scanner handles strings, raw strings, char literals, lifetimes, and nested comments. It is a lightweight fallback, not a Rust parser. Work is bounded to 180 KB before and 16 KB after the cursor; on very large files whose containing declaration is outside that window, language-server symbols improve scope accuracy. No project-wide scan is performed.

## Syntax highlighting

The webview bundles only Highlight.js core and its Rust grammar (about 24 KB minified). Keywords, types, functions, literals, attributes, and macros receive token colors. Palettes follow VS Code's light, dark, and high-contrast theme classes and adapt when the theme changes; custom TextMate token overrides are not imported. Code remains selectable as plain text when copied. Unknown language grammars fall back to plain text.

Highlighting runs only when a card's content or language changes. The renderer starts from text nodes, and the highlighter escapes markup before adding token spans. Everything loads from extension-local resources under the existing content security policy. Third-party license terms are included in `THIRD_PARTY_NOTICES.md`.

## Settings

The sidebar header offers 5, 12, 20, or 30 cards per section, with twelve as the default; **Show more** still reveals up to sixty. Custom counts from settings appear as one extra option while active. Changes save to the existing setting's scope, or to user settings when no override exists. Settings follow the active document, including language and workspace-folder overrides. The runtime uses twelve when no explicit preference exists, even if an older extension manifest remains cached during an update. Run **Developer: Reload Window** after installing updates to load the new extension code and sidebar assets.

| Setting | Default | Range |
| --- | --- | --- |
| `syntaxiser.debounceMs` | 350 | 100–2000 ms |
| `syntaxiser.maxCards` | 12 | 3–30 cards initially; Show more reveals additional cards |

## Add a language

1. Add a JSON pack following `packs/reference-pack.schema.json`: concepts with aliases and syntax patterns, and concise code cards with matching topic IDs. Each card may include a nonempty, plain-text `explanation` for its hover tooltip.
2. Add a `LanguageAdapter` in `src/languages` that produces the generic `EditorContext` shape.
3. Load and validate the pack in `src/extension.ts`, register the adapter with `ReferenceController`, and add the `onLanguage` activation event to `package.json`.
4. Import and register that language's highlighting grammar in `src/webview/highlight.js`, then rebuild with `npm run compile`.

The controller, retrieval engine, and sidebar are shared. Search uses the active supported language; with no supported editor, it retains the last supported pack (Rust by default). Unsupported languages show an explicit empty state for automatic reference.

## Validation

`npm test` runs 33 tests covering pack integrity, natural-language retrieval, core syntax searches and cursor context, web-server searches, contextual relevance, scope scanning, controller events, debouncing, stale symbol responses, webview rendering, search messaging, paging, state restoration, syntax highlighting, and card-count preferences. Concept regressions distinguish boolean operators from closures and control flow labels from lifetimes, and cover arbitrary generic parameter names and 128-bit numeric types. Explanation checks cover optional metadata, hover and accessibility attributes, safe text handling, updates, paging, and expanded or collapsed pins without adding visible content. Pin tests cover persistence across context changes and reloads, invalid or duplicate identifiers, collapse controls, keyboard focus, and deduplication against active results. The count regression simulates an older manifest's five-card default, explicit overrides, and changes through the sidebar control. Every card is checked for exact text preservation and safe token markup. A stylesheet regression check verifies that code blocks override the default inline-code background and padding. Tests run outside VS Code with a small API mock and a DOM harness; F5 remains the manual check in a real extension host.

With Rust 1.88+ and `rustfmt` installed, `npm run check:rust` also parses all cards as Rust fragments using edition 2024. This verifies syntax, without type-checking illustrative symbols or requiring each card to be a standalone program. `npm run check:rust:core` additionally type-checks all 29 core coverage additions with `rustc`. It emits metadata only, so it neither links the FFI example nor executes any snippet. The search cases in `test/fixtures/rust-core.json` also select these self-contained examples for compiler verification.

VS Code API references: [webviews](https://code.visualstudio.com/api/extension-guides/webview), [document symbol command](https://code.visualstudio.com/api/references/commands). Rust syntax reference: [The Rust Programming Language](https://doc.rust-lang.org/book/).

Core syntax review references: [Rust Reference items](https://doc.rust-lang.org/reference/items.html), [operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html), [blocks](https://doc.rust-lang.org/reference/expressions/block-expr.html), [loops and labels](https://doc.rust-lang.org/reference/expressions/loop-expr.html), [generics](https://doc.rust-lang.org/reference/items/generics.html), [qualified paths](https://doc.rust-lang.org/reference/paths.html), [closures](https://doc.rust-lang.org/reference/types/closure.html), [unions](https://doc.rust-lang.org/reference/items/unions.html), [external blocks](https://doc.rust-lang.org/reference/items/external-blocks.html), and [edition 2024 let chains](https://doc.rust-lang.org/edition-guide/rust-2024/let-chains.html).

Web and networking API references: [Axum](https://docs.rs/axum/latest/axum/), [Actix Web](https://docs.rs/actix-web/latest/actix_web/), [standard-library TCP](https://doc.rust-lang.org/std/net/struct.TcpListener.html), [Tokio TCP](https://docs.rs/tokio/latest/tokio/net/struct.TcpListener.html).
