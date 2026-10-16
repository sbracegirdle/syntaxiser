# Python semantics and workflow expansion

Issue #75 extends the 25-topic / 26-example Python baseline to 41 topics / 67 practical examples, retaining every existing ID and card unchanged. SQL companion cards remain separate. Counts describe inventory; the matrix and asserted scenarios describe depth.

Supported versions remain Python 3.13.7, pytest 8.4.2, HTTPX 0.28.1, Pydantic 2.11.7 and FastAPI 0.116.1, with the existing transitive uv.lock unchanged. Every added example includes its imports and local data. No extension runtime dependencies or network calls are added.

## Before/after scope matrix

| Scope / overview | Before | New practical card IDs | Version / source |
| --- | --- | --- | --- |
| Paths and text files (pathlib) | Existing overview and cards retained; add workflow variant | `pathlib-traversal` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/pathlib.html) |
| JSON serialization (json) | Existing overview and cards retained; add workflow variant | `json-domain` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/json.html) |
| CSV rows and columns (csv) | Existing overview and cards retained; add workflow variant | `csv-validated` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/csv.html) |
| pytest fixtures (pytest-fixtures) | Existing overview and cards retained; add workflow variant | `pytest-fixtures-cleanup` | pytest 8.4.2; [official reference](https://docs.pytest.org/en/stable/how-to/fixtures.html) |
| pytest parametrization (pytest-parametrize) | Existing overview and cards retained; add workflow variant | `pytest-parametrize-boundaries` | pytest 8.4.2; [official reference](https://docs.pytest.org/en/stable/how-to/parametrize.html) |
| HTTPX clients and timeouts (httpx) | Existing overview and cards retained; add workflow variant | `httpx-recovery` | HTTPX 0.28.1; [official reference](https://www.python-httpx.org/advanced/timeouts/) |
| Async HTTPX and cancellation (httpx-async) | Existing overview and cards retained; add workflow variant | `httpx-async-recovery` | HTTPX 0.28.1; [official reference](https://www.python-httpx.org/async/) |
| Pydantic validation (pydantic) | Existing overview and cards retained; add workflow variant | `pydantic-cross-field` | Pydantic 2.11.7; [official reference](https://docs.pydantic.dev/latest/concepts/models/) |
| FastAPI JSON endpoints and request tests (fastapi) | Existing overview and cards retained; add workflow variant | `fastapi-overrides` | FastAPI 0.116.1 / Pydantic 2.11.7; [official reference](https://fastapi.tiangolo.com/tutorial/testing/) |
| Argument kinds and safe defaults (arguments) | Forms incidental or absent; now dedicated overview + two distinct tasks | `arguments-normalize`, `arguments-collect` | Python 3.13.7; [official reference](https://docs.python.org/3.13/tutorial/controlflow.html#more-on-defining-functions) |
| Identity, aliases and copying (copying) | Forms incidental or absent; now dedicated overview + two distinct tasks | `copying-settings`, `copying-rows` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/copy.html) |
| Equality and truthiness (truthiness) | Forms incidental or absent; now dedicated overview + two distinct tasks | `truthiness-limit`, `truthiness-label` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/stdtypes.html#truth-value-testing) |
| Structural match patterns (matching) | Forms incidental or absent; now dedicated overview + two distinct tasks | `matching-command`, `matching-route` | Python 3.13.7; [official reference](https://docs.python.org/3.13/reference/compound_stmts.html#the-match-statement) |
| Decorators and wrapped functions (decorators) | Forms incidental or absent; now dedicated overview + two distinct tasks | `decorators-audit`, `decorators-policy` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/functools.html#functools.wraps) |
| Properties and validated attributes (properties) | Forms incidental or absent; now dedicated overview + two distinct tasks | `properties-stock`, `properties-total` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/functions.html#property) |
| Iterable and iterator protocols (iterators) | Forms incidental or absent; now dedicated overview + two distinct tasks | `iterators-batches`, `iterators-countdown` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/stdtypes.html#iterator-types) |
| Generator send and cleanup (generator-lifecycle) | Forms incidental or absent; now dedicated overview + two distinct tasks | `generator-running-total`, `generator-file-close` | Python 3.13.7; [official reference](https://docs.python.org/3.13/reference/expressions.html#generator-iterator-methods) |
| Text normalization and regular expressions (text-regex) | Forms incidental or absent; now dedicated overview + two distinct tasks | `regex-order-code`, `text-slug` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/re.html) |
| Aware datetimes and time zones (datetime) | Forms incidental or absent; now dedicated overview + two distinct tasks | `datetime-utc`, `datetime-window` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/datetime.html) |
| Decimal arithmetic and rounding (decimal) | Forms incidental or absent; now dedicated overview + two distinct tasks | `decimal-money`, `decimal-share` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/decimal.html) |
| Counter, defaultdict and deque (collection-tools) | Forms incidental or absent; now dedicated overview + two distinct tasks | `counter-words`, `collections-work-queue` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/collections.html) |
| Lazy iterator workflows (itertools) | Forms incidental or absent; now dedicated overview + two distinct tasks | `itertools-group`, `itertools-align` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/itertools.html) |
| Partial application and bounded caching (functools) | Forms incidental or absent; now dedicated overview + two distinct tasks | `functools-parser`, `functools-cache` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/functools.html) |
| Structured asyncio task groups (task-groups) | Forms incidental or absent; now dedicated overview + two distinct tasks | `task-groups-report`, `task-groups-cancel` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/asyncio-task.html#task-groups) |
| Async deadlines and cancellation ownership (timeouts) | Forms incidental or absent; now dedicated overview + two distinct tasks | `timeouts-deadline`, `timeouts-owner` | Python 3.13.7; [official reference](https://docs.python.org/3.13/library/asyncio-task.html#timeouts) |

New topics are grouped in Core syntax or Standard library alongside existing overviews. The required-topic manifest now enforces all 16 new units. Each new overview is independently authored with schematic forms, rules, version baseline and an official source. Existing library topics remain grouped in Libraries.

Argument scope includes positional-only/keyword-only forms, unpacking, duplicate keyword rejection and per-call mutable defaults. Copying separates identity, value equality, shallow aliasing and deep snapshots; truthiness preserves zero and empty text. Matching covers sequence/mapping patterns, guards and unexpected values. Decorators preserve metadata and propagate failures; properties validate before mutation. Iterators cover exhaustion and bounded batching; generator tasks cover send, close, delegation and file cleanup.

Text tasks deliberately use a narrow ASCII identifier/slug grammar, while file fixtures exercise Unicode UTF-8. Datetime tasks require offsets and cover UTC conversion and interval bounds. Decimal tasks select rounding and precision explicitly and reject nonfinite or malformed quantities. Counter/defaultdict/deque tasks exercise missing keys, eviction and empty queue behavior. itertools/functools tasks cover grouping ordering, lazy flattening, strict column alignment, bound options and cache lifetime.

TaskGroup tasks aggregate actual child results, propagate ExceptionGroup, cancel siblings and await finally cleanup using Event handshakes. Deadline tasks distinguish TimeoutError from external CancelledError and use an already expired loop deadline rather than elapsed-time thresholds. Existing async HTTPX cancellation remains covered by its original exact card.

## Exact-card assertion matrix

playground/python/depth-evidence.json is the machine-readable mapping. test_depth.py compiles and runs these exact catalog strings in disposable subprocesses through run_card.py. pytest cards are collected as real tests. Assertions below live in the shipped task examples; no equivalent handwritten implementation is substituted. Three deliberate catalog-only mutations independently demonstrate that changed argument results, Decimal rounding and cancellation cleanup fail validation.

| Card ID | Happy | Meaningful edge | Error / recovery |
| --- | --- | --- | --- |
| arguments-normalize | trim and casefold a record | empty input returns empty list | positional option rejected |
| arguments-collect | caller bucket receives tag | independent omitted defaults and duplicate suppression | duplicate unpacked keyword rejected |
| copying-settings | equal independent snapshot | shallow nested mutation shares original | mutable mapping cannot serve as hash key |
| copying-rows | edit leaves source row intact | empty report copies safely | missing row indexing rejected |
| truthiness-limit | positive and omitted limit | zero retained | bool negative and text rejected |
| truthiness-label | label whitespace normalized | empty label differs from absence | numeric label rejected |
| matching-command | valid addition dispatched | extra mapping keys tolerated | unexpected shape and guard failures rejected |
| matching-route | tail segments captured | empty path and empty tail | text is not a sequence pattern match |
| decorators-audit | successful call recorded | metadata and bypass preserved | failed call propagates without success log |
| decorators-policy | private field removed | empty collection forwarded | omitted authorization denied |
| properties-stock | initial stock exposed | zero accepted | negative assignment rejected without mutation |
| properties-total | sum computed | empty invoice zero | read-only assignment rejected |
| iterators-batches | bounded batches | empty and partial batch | invalid batch size rejected |
| iterators-countdown | custom protocol countdown | stable exhaustion and zero attempts | negative bound rejected |
| generator-running-total | send updates accumulator | zero and closed exhaustion | invalid update triggers finally cleanup |
| generator-file-close | first line read | early close and empty file cleanup | missing file rejected |
| regex-order-code | named fields parsed | zero and surrounding whitespace | suffix empty and non-ASCII digits rejected |
| text-slug | whitespace normalized | existing repeated separators collapsed | blank and punctuation rejected |
| datetime-utc | offset converted to UTC | UTC Z input | naive and malformed timestamps rejected |
| datetime-window | two-hour interval | zero interval | reversed interval rejected |
| decimal-money | half-up decimal rounding | negative tie and zero | malformed and nonfinite rejected |
| decimal-share | exact budget split | repeating fraction and global context unchanged | division by zero propagates with context restored |
| counter-words | normalized frequency ranking | empty input and missing word zero | unhashable input rejected |
| collections-work-queue | group and queue populated | missing get does not invoke factory and oldest evicted | empty dequeue rejected |
| itertools-group | unsorted repeated keys aggregated | empty sales | negative sale rejected |
| itertools-align | flatten and adjacent pairs | empty batches and singleton pairs | strict alignment rejects missing value |
| functools-parser | batch parsing with bound option | keyword override and empty batch | invalid digit rejected |
| functools-cache | normalized immutable value | cache hit clear and empty string | unhashable key rejected |
| task-groups-report | ordered results collected | empty task group | child failure surfaced in ExceptionGroup |
| task-groups-cancel | fresh group recovers | sibling already started before failure | cancelled peer cleanup awaited |
| timeouts-deadline | disabled deadline allows success | expired deadline deterministic next-yield boundary | timeout cleanup and subsequent operation recovery |
| timeouts-owner | worker starts and later work succeeds | cancelling completed task returns false | external CancelledError preserved and cleanup joined |
| pathlib-traversal | nested Unicode files read | no matches and tree cleanup | missing file rejected |
| json-domain | valid JSON quantity | zero and extra Unicode metadata | syntax and domain errors rejected |
| csv-validated | quoted comma and Unicode row | header-only file empty | header width and conversion rejection |
| httpx-recovery | second request succeeds | empty JSON list and client reuse | injected timeout then recovery and disposal |
| httpx-async-recovery | successful async request after failures | empty body collection | malformed JSON and 503 rejected; client closed |
| pydantic-cross-field | ordered interval validated | zero-length interval | cross-field strict missing and extra-field rejection |
| fastapi-overrides | default profile and restored override | empty valid label | query 422 and response model rejection with override cleanup |
| pytest-parametrize-boundaries | positive parser cases | zero and whitespace | malformed negative and empty rejected |
| pytest-fixtures-cleanup | isolated config created | empty and newline replacement | missing file assertion with automatic environment restoration |

Compile/execute/behavior evidence is registered for every new card. Python compile() validates syntax, not static typing. Existing cards keep conservative registrations: historical missing edge/error evidence in unrelated original topics remains visible and is not waived by this expansion. The old test_catalog.py still executes the 26 original cards; test_depth.py owns the 41 added cards, avoiding duplicate execution.

## Real library boundaries and limits

- HTTPX MockTransport injects ReadTimeout, status failures and malformed JSON; a subsequent request verifies recovery on the same client. Async clients close after validation failures. MockTransport does not enforce real socket phase timeouts, connection pooling behavior or TLS.
- Pydantic validates strict/missing/extra fields and a cross-field invariant. FastAPI uses in-process TestClient with a dependency override, query rejection, response validation failure and restoration. It does not test network servers, authentication or deployment.
- pytest runs parametrized edge/rejection cases, tmp_path and monkeypatch isolation. A transitive Starlette/AnyIO deprecation warning may appear with the unchanged lock; checks still pass.
- Datetime examples use fixed offsets/UTC, not ambiguous named-zone DST transitions; use zoneinfo with an explicit fold/gap policy for those workflows. Text regexes are limited grammars, not hostile-input validators. Deepcopy is demonstrated on JSON-like data, not arbitrary resources.
- Caches demonstrate bounded immutable results and explicit invalidation, not distributed coherence. Async cancellation is cooperative; tests use event handshakes and subprocess timeouts to bound accidental hangs.

## Run and inspect

```sh
uv sync --project playground/python --locked
uv run --project playground/python --locked python playground/python/run_card.py --list
uv run --project playground/python --locked python playground/python/run_card.py task-groups-cancel
uv run --project playground/python --locked pytest playground/python/tests -q
```

Initial uv provisioning needs network access; normal checks use only temporary files and local/in-process transports. For Node checks use nvm/pnpm as documented in the coverage standard: pnpm test; pnpm audit:coverage --check; node scripts/lesson-coverage.cjs --check. pnpm audit:runtime python records revision and catalog hashes, with uv on PATH.

## Manual review walkthrough

1. Reload the installed integration extension in the existing VS Code workspace. Open playground/python/tour.py and a disposable .py file. Browse Core syntax, Standard library and Libraries; select all new overview topics and confirm schematic forms remain separate from solved examples.
2. Search keyword only arguments, mutable default, counter words, decimal rounding, timezone datetime and async task cancellation. Confirm the expected concrete examples appear in the first three. Also inspect regex fullmatch, generator send, itertools groupby and functools partial.
3. In a disposable file, import Decimal as D, Counter as C and asyncio as aio; use each alias on the cursor line. Confirm the matching topics. Try function/type/module scopes, an incomplete aio.timeout( call, and quoted/commented mentions that must not supply API cues. Plain misleading identifiers such as DecimalReport should not match Decimal.
4. Copy a new example, verify indentation and text, and run the exact card via run_card.py. Pin it, switch to Rust or TypeScript, return to Python and reload; the Python pin and existing progress must persist. Inspect narrow sidebar scrolling and keyboard topic navigation.
5. Review the existing lesson tasks and their new prerequisite references below. Learners still implement their own solutions; no solved card code or scaffolding is inserted in lesson snippets.

## Existing lesson prerequisite links

| Stable lesson ID | Useful overview prerequisites / practical boundary examples |
| --- | --- |
| functions | arguments, truthiness; arguments-normalize / arguments-collect |
| collections | copying, collection-tools, itertools; counter-words / itertools-group |
| csv-report | pathlib, csv, generator-lifecycle; csv-validated / pathlib-traversal |
| pytest | pytest-parametrize, pytest-fixtures; pytest-parametrize-boundaries / pytest-fixtures-cleanup |
| validation | pydantic, matching; pydantic-cross-field |
| cancellation | task-groups, timeouts; task-groups-cancel / timeouts-owner |
| http-client | httpx, httpx-async, timeouts; httpx-recovery / httpx-async-recovery |
| json-api | fastapi, pydantic; fastapi-overrides |
| capstone | json, csv, decimal, itertools; json-domain / csv-validated / decimal-money |

Content review: each scope item maps to distinct tasks and semantic variants above. The ten lesson identities and task-only starters are preserved; this ticket adds prerequisite guidance rather than claiming a new lesson track. NumPy/pandas, Django/SQLAlchemy and a broad data ecosystem remain separate work.
