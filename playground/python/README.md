# Python playground

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/). Run from the repository root:

```sh
uv sync --project playground/python --locked
uv run --project playground/python --locked python playground/python/tour.py
uv run --project playground/python --locked pytest playground/python/tests -q
```

The tour prints `{"coffee": 2, "tea": 4}` and verifies local API requests. Python 3.13.7 is selected by .python-version; uv downloads it when missing. uv.lock pins all transitive dependencies; initial setup needs network access. Once installed, examples use only temporary files, fixture data, mock HTTP transports and in-process FastAPI requests. No credentials or listening server are needed. Nothing runs automatically in the extension.

From the extension build environment, `pnpm check:python` runs the same checks when uv is on PATH. `test_catalog.py` executes every shipped practical card in an independent process and directory; pytest examples are collected as real tests. Additional tests reject invalid strict models, round-trip JSON, exercise async success and an overall deadline. Catalog assertions cover file cleanup, malformed JSON, CSV conversion, HTTP timeout/status failures, cancellation cleanup and API success/validation/conflict responses. MockTransport simulates failures; it does not implement socket timeout timing.

## Manual VS Code check

1. Install the built VSIX, reload the existing workspace window, and open tour.py. Select the Syntaxiser sidebar. Confirm Python appears and Reference lists Core syntax, Standard library and Libraries.
2. Place the cursor on `rows.DictReader`, `FilePath`, `Order.model_validate`, `FastAPI`, `TestClient` and `web.AsyncClient`. CSV, pathlib, Pydantic, FastAPI and HTTPX examples/overviews should appear. The aliases rows, FilePath and web should retain their library associations.
3. Move between module imports, the Order class and read_orders body. Confirm file, type and function scope changes. Add a comment or triple-quoted string mentioning another library and confirm it supplies no library cue. The real surrounding code may still supply nearby context.
4. Search `read csv`, `read file with pathlib`, `handle exception`, `pytest fixture`, `httpx timeout`, `pydantic validation` and `fastapi request`. Practical examples should lead the example list and separate quick references should open full overviews with learning links.
5. Select code and copy it into a disposable .py file. Confirm indentation, quotes and text match the card. For pytest examples, use test_example.py and run uv run pytest; other cards run as scripts using the playground environment.
6. Pin CSV, switch to a Rust/Go/TypeScript file, then return. Search follows the active language; the Python pin remains labeled Python. Reload and confirm the pin persists.
7. In Lesson browser, Python has nineteen tasks spanning levels 1–5. Mark one In progress and create a personal task. Switch language, reload, confirm independent progress, then try hiding/restoring a task and resetting Python alone. Instructions contain no solution or code scaffolding.

See [coverage, versions and limitations](../../docs/python-support.md). The nine data tasks add prerequisite-linked intermediate/advanced practice and a tabular capstone.

## Expanded semantics and workflows

Use `uv run --project playground/python --locked python playground/python/run_card.py --list` to list every exact catalog card, then replace `--list` with a card ID to execute it in a disposable directory. `test_depth.py` compiles and executes all 41 new cards, including collected pytest tasks; three deliberate catalog mutations must fail. The original 26 cards remain checked independently. See [the complete matrix, assertion cases, limitations, lesson prerequisites and manual walkthrough](../../docs/python-depth.md).

## NumPy and pandas data workflows

The lock includes NumPy **2.5.4** and pandas **3.0.6**, using Python **3.13.7**. Run `uv run --project playground/python --locked pytest playground/python/tests/test_data.py -q` for independent happy/boundary/error/recovery assertions on all sixteen exact data cards. `compile()` is a syntax check, not static type checking. Use `run_card.py numpy-scale-columns` or `run_card.py pandas-join-products` with the same uv prefix to execute the exact copied example.

Open `data_tour.py` for runnable alias/cursor targets, or follow [the before/after matrix and complete manual walkthrough](../../docs/python-data.md). Initial provisioning needs network access; after caching the interpreter and wheels, add `--offline` to uv sync/run to forbid network access. Fixtures contain no public data downloads, credentials or external services. Official learning links need a browser connection.
