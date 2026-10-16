# Language coverage and situational test standard

This is the acceptance standard for every supported language or tool context, including expansions. Existing catalogs are not grandfathered in: gaps become scoped tickets, rather than blocking unrelated contributions. Counts are inventory, not a quality score. A large catalog does not compensate for missing fundamentals or untested failure behavior.

## Content depth

1. Cover applicable fundamentals: values/types, declarations, operators, branching, iteration, functions, modules/imports, data structures, abstractions/generics, missing values, errors, resource lifetime, async/concurrency and testing. For HTML/CSS/SQL/YAML/terminal use domain equivalents: document/accessibility/forms, cascade/layout/responsiveness, relations/NULL/constraints/transactions, schemas/interpolation/validation, quoting/processes/pipelines/status respectively. Review the curated required-topic list in `coverage/languages.json`; changing the list requires a rationale, never deletion just to pass.
2. Each topic needs a grouped, independently authored overview with summary, schematic syntax variations, essential rules, supported versions and official learning/API links, plus at least one practical task example explaining assumptions, imports, surrounding variables and limitations. Add distinct variants when ownership, mutability, dialect, schema, async behavior or API versions change semantics. Keep build/package recipes separate from language syntax.
3. Include popular libraries appropriate to the language: serialization/validation, HTTP/server, testing, and UI/data tools where applicable. Each selected library needs its own API overview and practical examples, pinned dependency features/versions, an official reference, success and failure paths. The manifest lists minimum ecosystem topics, not an exhaustive popularity ranking. Review popularity and missing categories against current primary documentation daily; SQL drivers and YAML schemas count as ecosystem contexts. Go's proposed Gin/Chi/Testify scope remains a reviewable gap, not silently added support.
4. Supply a runnable playground and manual cursor/search, copy, pin, reference and language-switch instructions, exposed in the primary checkout before review. Document setup/toolchain/lockfiles and offline limits. Lesson tracks must progress through first steps, beginner, intermediate, advanced and capstone, with useful prerequisites and varied tasks. Lesson snippets contain task comments only. Use `scripts/lesson-coverage.cjs --check` and review lesson suitability separately; counts alone cannot judge progression.

## Situational integration evidence

For **each topic**, register at least three independently asserted situations: happy path, meaningful edge/boundary, and error/recovery (or rejection/invalid state for declarative systems). Across each library also exercise its real integration boundary: serialization/schema rejection, HTTP error/cancellation, UI interaction/unmount, rollback/bindings, config invalidation or resource cleanup as appropriate. State the expected outcome and why the edge matters; do not count merely executing without an assertion as behavioral coverage. A documented non-applicable situation needs human review and a replacement invariant; it cannot silently waive the requirement.

For each practical card, parse and compile/type-check where applicable against pinned real dependencies. Behavioral cases must consume the exact catalog code or generate a fixture from it; hand-copied playground code requires an explicit equivalence check and never automatically counts as testing the card. Use temporary files/databases and local/in-process/mock HTTP transports. No production credentials, public network calls, deployment or destructive global commands are needed. Compiler rejection and runtime assertion results are separate evidence levels. Schematic overviews are reviewed for correctness against primary docs; compiling a schematic form is usually inappropriate.

Adapters need independent fixtures covering imports/aliases, module/function/type scopes, comments, strings, incomplete edits, misleading identifiers, recent edits, language switching and any dialect/schema restrictions. Include at least two natural task searches and two cursor scenarios per context in the common manifest. Expect a concrete topic in the first three cards; broader adapter/UI suites remain required. Test both SQL dialects, JSX/TSX, YAML ecosystems and terminal command families in their dedicated suites. Manually check keyboard access and narrow sidebar rendering when UI changes.

## Repeatable audit

Use nvm/pnpm for Node, uv for Python, and gh for GitHub:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
pnpm audit:coverage --json > /tmp/syntaxiser-coverage.json
pnpm audit:coverage --write
pnpm audit:coverage --check
pnpm audit:coverage --strict
pnpm test
node scripts/lesson-coverage.cjs --check
# Explicit opt-in, after following each playground's dependency setup:
pnpm audit:runtime go > /tmp/syntaxiser-runtime-go.json
# Without a language argument, run all registered real-toolchain commands.
```

`audit:coverage` compiles first and measures inventory, required topics, separate overviews, navigation, HTTPS sources, explanations, evidence registration and real adapter/retrieval probes. It performs no network calls or issue writes. `--write` regenerates the deterministic Markdown baseline; `--check` detects drift. `--strict` exits nonzero for any finding; ordinary reporting intentionally exits zero while historical gaps are triaged. Invalid manifests/catalogs always fail. Stable finding keys allow deduplication across runs. The generated report is excluded from the shipped extension along with all audit tools and manifests.

Evidence entries identify a real card, source file, validation kind and `happy`/`edge`/`error` situations. Initial registrations are deliberately conservative: gofmt parsing, TypeScript type-checking, Python execution and Java's explicit assertion map. Other existing checkers are listed as runnable commands but are **not** credited with per-card behavioral coverage until their cases are mapped and inspected. Missing registration means unknown evidence, not proof the existing tests are absent. A source path and a claimed situation cannot mechanically establish assertion quality; the daily reviewer must inspect them.

`audit:runtime [languageId]` runs registered package commands, once per shared command, with a ten-minute timeout each, returning machine-readable logs, exit codes, timestamps, Git revision and catalog/manifest hashes. It does not install dependencies. A missing command, timeout, dependency/toolchain or service failure is visible and must be classified by the reviewer; never describe an environment failure as a snippet defect. Successful execution proves only what that command asserts. Record dirty-tree state and exact dependency/tool versions alongside logs; hashes identify catalog inputs, not the entire build environment. Never commit generated runtime logs or secrets.

## Daily review and ticket protocol

The daily Codex automation runs at 09:00 Australia/Perth and uses a clean worktree from current `origin/main`, preserving the user's edits. While this change awaits merge, it may inspect `origin/codex/64-coverage` explicitly, identifying that revision in its report; it must not claim the proposal is already merged. Its automation memory retains prior finding keys, sampled topics, toolchain blockers, tickets and pending project operations. Read that memory before any external writes.

Every run:

1. Run the deterministic JSON audit, report freshness check, extension tests and lesson matrix check. Set up pinned dependencies and run all available real-toolchain commands; record each passed/failed/unavailable command. Retry neither provisioning failures nor broken services indefinitely. Existing commands may need local DB/browser prerequisites documented in their playgrounds.
2. Review **every context** subjectively for missing foundation/standard-library/ecosystem areas and lesson progression. Inspect at least three rotating topics per context (one foundation, one library/integration if supported, one previously unreviewed), every changed topic/card since the prior audit, and all new/failing findings. Inspect independent references, assumptions, versions and actual runtime assertions. Rotate so every topic is inspected within 30 daily runs; increase sample size when needed. Verify primary documentation for changed APIs/popularity and record links. A first run establishes a full inventory and begins the rotation; it cannot claim exhaustive semantic validation.
3. Check existing open issues, all project statuses and open PRs before creating anything. Group related findings into bounded work, usually one ticket per language/root cause; prioritize actual correctness/retrieval defects, missing fundamentals, missing popular-library support, then evidence registration. Do not file hundreds of one-line unknown-evidence tickets. Skip already tracked work, including In Progress and Human review. Unknown evidence needs an investigation/registration ticket, not a claim code is incorrect. A transient environment blocker belongs in automation memory/summary until reproduced as a repository setup defect.
4. New issue bodies must include a stable marker `<!-- coverage-audit:LANGUAGE:ROOT-CAUSE -->`, audited commit, reproducer/findings, current versus expected behavior, applicable standard clause, exact acceptance criteria, real dependencies/commands, manual checks and primary sources. Use gh to create issues in sbracegirdle/syntaxiser, add them to project 1 (owner sbracegirdle) and set **Ready for work**, resolving current field/option IDs. Persist the issue URL immediately, then project item ID/status; repair incomplete additions on the next run before creating duplicates. Do not move or reopen existing tickets automatically. Do not implement fixes, create builder sessions or spawn other tasks during an audit.
5. Save evidence paths, audited revision, per-context review coverage, finding keys, ticket URLs and time to automation memory. Stay quiet for unchanged/non-actionable results; notify only for new tickets, a meaningful regression, persistent failure or required human decision. If GitHub is unavailable, save pending findings and retry deduplicated writes on the next run.

The daily automation is independent of PR feedback monitoring; merging this PR should remove only its feedback monitor. The daily task continues reviewing main. Local scheduled work needs the desktop app running and access to this checkout ([official scheduled task guidance](https://developers.openai.com/training/walkthroughs/scheduled-tasks)).
