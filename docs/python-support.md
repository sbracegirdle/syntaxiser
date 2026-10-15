# Python foundations

Python editors use a separate offline catalog: 25 independently authored syntax/API overviews and 26 runnable practical examples. The SQL integration also adds two sqlite3 client examples and one dedicated topic at activation. All topics have learning references; examples remain primary in contextual results. Python pins and lesson progress use the canonical python identity and preserve other languages' state.

| Area | Coverage |
| --- | --- |
| Core syntax | Variables/scalars, collections, slicing, comprehensions, branches/loops, function arguments, modules/packages, exceptions, classes/dataclasses, generators, context managers, typing, asyncio tasks/cancellation |
| Standard library | pathlib, streamed file I/O, JSON, CSV, logging; explicit cleanup and expected error handling |
| pytest | tmp_path fixtures, parametrization, expected exceptions |
| HTTPX | reusable clients, phase timeouts, status failures, async clients and cancellation; local transports |
| Pydantic | v2 models, constraints, strict input validation, structured errors, serialization |
| FastAPI | JSON POST, request/response models, 201/422/409 behavior, in-process request tests |

## Supported runtime and dependencies

The [uv playground](../playground/python/README.md) pins Python **3.13.7**, pytest **8.4.2**, HTTPX **0.28.1**, Pydantic **2.11.7**, FastAPI **0.116.1** and all transitive dependencies in uv.lock (including Starlette). These are the tested versions, rather than a claim to cover every newer release. No third-party package is installed or imported by the extension itself. Library examples name their required dependencies. Examples use Pydantic v2 APIs; type aliases in the overview use Python 3.12+ syntax. Dataclass/type hints do not provide runtime validation.

Run `pnpm test` for retrieval, adapter, controller, state and rendered reference checks. Run `pnpm check:python` with uv on PATH for executable catalog and library behavior checks. See the playground guide for direct uv commands, expected output and manual editor/search/pin walkthroughs.

## Context extraction

The bounded lexical scanner preserves offsets while hiding comments, escaped strings, raw/byte strings and triple-quoted docstrings. F-strings are hidden in full, including embedded expressions. Indentation, tabs, continued bracket expressions and multiline declarations inform function/type/module scope; available document symbols refine it. Real import/from declarations retain module names, including renamed bindings and parenthesized imports. Used bindings add library cues to the cursor line; unrelated imports have low ranking weight and do not create quick-reference previews on a neutral line.

This fallback is not a Python parser or import resolver: it does not track alias reassignment, nested shadowing, dynamic imports, star imports or project-wide re-exports. Semicolon-separated imports and malformed indentation can be approximate. The controller bounds context to 180 KB before and 16 KB after the cursor, so imports or enclosing declarations outside that window can be absent. No language server is required.

## Progressive learning and follow-ups

Ten stable Python lessons seed the #36 learning-path expansion. Levels 1–2 cover greetings, functions, collections and CSV; level 3 adds pytest and validation; level 4 introduces cancellation and local HTTP testing; level 5 combines JSON endpoints and a validated CSV report. Each task names its expected behavior and setup, with an empty starter so no solution/scaffolding appears. The playground proves the underlying APIs and checks; learners write their own implementations. #36 owns deeper intermediate/advanced exercise coverage. NumPy, pandas, Matplotlib, scikit-learn, SQLAlchemy and Django remain future catalog work.

## Primary learning sources

- [Python 3.13 tutorial](https://docs.python.org/3.13/tutorial/) and [standard library](https://docs.python.org/3.13/library/)
- [pytest fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html) and [parametrization](https://docs.pytest.org/en/stable/how-to/parametrize.html)
- [HTTPX timeouts](https://www.python-httpx.org/advanced/timeouts/), [async clients](https://www.python-httpx.org/async/) and [transports](https://www.python-httpx.org/advanced/transports/)
- [Pydantic models](https://docs.pydantic.dev/latest/concepts/models/)
- [FastAPI request testing](https://fastapi.tiangolo.com/tutorial/testing/)

Each topic links its relevant official page from the Reference browser. External learning pages require internet access; contextual extraction, search, highlighting, pins and lessons run locally.
