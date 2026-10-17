# Python data workflows (#96)

Baseline: clean origin/main 6b4d81c had 41 topics/overviews, 67 practical cards and ten Python lessons; NumPy/pandas had no shipped units. This change adds eight units, sixteen practical cards and nine exercises: **49 topics/overviews, 83 cards, nineteen lessons**. Existing content/identities stay intact. The separately activated sqlite3 companion is additional to these Python catalog counts.

## Versions, semantics and boundaries

The committed uv lock uses Python **3.13.7**, NumPy **2.5.4**, pandas **3.0.6**, pytest **8.4.2** and the existing HTTPX/Pydantic/FastAPI pins. Both requested data pins installed and imported together without a compatibility revision. NumPy basic slices share memory; advanced indexing and explicit copies isolate changes. pandas 3 uses Copy-on-Write: modifications of a derived object do not modify its parent; single-step loc assignment is the supported update form. Series assignment aligns labels. These distinctions are tested on exact catalog code.

All examples use tiny local fixtures; integer counts/products/totals assume values fit int64 and are not arbitrary-precision accounting. Array conversion to integer can truncate fractional inputs; integer-grid/price/reduction tasks expect integer inputs. Sensor arrays use float64 and reject nonfinite values; observed means permit NaN but reject infinity. pandas CSV defaults classify blank and standard NA tokens as missing; missing names fail, missing quantities remain unknown. Null join keys are explicitly rejected because pandas otherwise matches null to null. The supported task functions specify schema and dtype contracts, not a general untrusted-data validation layer. No visualization, ML, SQLAlchemy or Django coverage is claimed.

## Before/after units and primary sources

Every unit had zero cards/overviews before this change. Its overview ID below is separate from its two concrete task cards, and appears under NumPy arrays or pandas tables in Reference. NumPy rows use 2.5.4, pandas rows use 3.0.6.

| Unit / overview ID | New concrete card IDs | Version / official source |
| --- | --- | --- |
| numpy-arrays | numpy-sensor-matrix, numpy-count-grid | NumPy 2.5.4 — [NumPy construction and dtypes](https://numpy.org/doc/stable/user/basics.creation.html) |
| numpy-indexing | numpy-calibrate-view, numpy-isolate-selection | NumPy 2.5.4 — [NumPy indexing, views and copies](https://numpy.org/doc/stable/user/basics.copies.html) |
| numpy-broadcasting | numpy-scale-columns, numpy-price-table | NumPy 2.5.4 — [NumPy broadcasting and shape contracts](https://numpy.org/doc/stable/user/basics.broadcasting.html) |
| numpy-reductions | numpy-row-totals, numpy-observed-means | NumPy 2.5.4 — [NumPy axis reductions](https://numpy.org/doc/stable/reference/routines.statistics.html) |
| pandas-ingestion | pandas-read-orders, pandas-clean-quantities | pandas 3.0.6 — [pandas typed CSV and missing values](https://pandas.pydata.org/docs/user_guide/missing_data.html) |
| pandas-selection | pandas-select-active, pandas-align-scores | pandas 3.0.6 — [pandas labels, positions and Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html) |
| pandas-grouping | pandas-group-totals, pandas-group-quality | pandas 3.0.6 — [pandas grouping and aggregation](https://pandas.pydata.org/docs/user_guide/groupby.html) |
| pandas-joins | pandas-join-products, pandas-reconcile-ids | pandas 3.0.6 — [pandas validated joins and cardinality](https://pandas.pydata.org/docs/user_guide/merging.html) |

## Actual assertion locations

[tests/test_data.py](../playground/python/tests/test_data.py) independently compiles and executes each exact catalog card in a temporary working directory and calls the task functions from that namespace. It does not assert against a rewritten implementation. Each function below contains result, boundary, rejection and subsequent recovery assertions. [data-evidence.json](../playground/python/data-evidence.json) maps these inspected cases to overview/card IDs; coverage/languages.json registers parse, execute and behavior evidence for every card. Python compile() checks syntax, **not static types**; no static typechecking evidence is registered. Existing audit findings remain visible.

| Test function (same file) / card | Happy assertions | Boundary assertions | Rejection / recovery assertions |
| --- | --- | --- | --- |
| test_numpy_sensor_matrix / numpy-sensor-matrix | float64 two-column matrix | (0,2) preserves dimensions | ragged/text/nonfinite/rank errors; valid negative reading afterward |
| test_numpy_count_grid / numpy-count-grid | typed zero grid and cell increment | (0,3) and (1,0) shapes | negative dimension; valid allocation afterward |
| test_numpy_calibrate_view / numpy-calibrate-view | shares_memory and source mutation | empty interval unchanged | negative/reversed/out-of-range interval; later calibration succeeds |
| test_numpy_isolate_selection / numpy-isolate-selection | advanced-index order and isolated mutation | empty selection and explicit slice copy | out-of-bounds position; valid negative index afterward |
| test_numpy_scale_columns / numpy-scale-columns | column-scaled values and unchanged buffers | zero-row matrix shape | factor shape validation and actual np.multiply broadcast rejection; valid scale afterward |
| test_numpy_price_table / numpy-price-table | outer quantity-price values/dtype | zero quantities and empty axes | negative/vector-rank rejection; valid zero-price table afterward |
| test_numpy_row_totals / numpy-row-totals | axis=1 totals/dtype | empty rows/columns and zero identity | negative/rank rejection; later total succeeds |
| test_numpy_observed_means / numpy-observed-means | per-column observed means | all-missing and zero-row NaN output | infinity/rank rejection; later finite means succeed |
| test_pandas_read_orders / pandas-read-orders | quoted CSV name and nullable dtypes | header-only and blank quantity | missing fields/header, invalid/fractional/negative quantity; corrected CSV succeeds |
| test_pandas_clean_quantities / pandas-clean-quantities | stripped counts and retained index | empty and missing values | malformed/fractional/negative rejection; zero and valid count afterward |
| test_pandas_select_active / pandas-select-active | nullable-mask exclusion and independent preview | empty/all-NA masks | missing column and ambiguous pd.NA boolean; source remains usable |
| test_pandas_align_scores / pandas-align-scores | reversed labels align; independent shallow result | empty matching labels | duplicate/missing/mismatched labels; corrected labels succeed |
| test_pandas_group_totals / pandas-group-totals | sorted tea sum and unknown coffee total | empty frame and shuffled input | missing group name rejected; valid aggregation afterward |
| test_pandas_group_quality / pandas-group-quality | size versus count; retained null key | empty/all-missing readings | negative reading rejected; later missing-only report succeeds |
| test_pandas_join_products / pandas-join-products | many-to-one values and stable order | empty orders | duplicate keys MergeError, null/unmatched keys and duplicate order IDs; corrected lookup succeeds |
| test_pandas_reconcile_ids / pandas-reconcile-ids | one-to-one outer membership statuses | empty/both-empty frames | duplicates on either side and null id; valid reconciliation afterward |

## Setup and verification

From the repository root:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
uv sync --project playground/python --locked
uv run --project playground/python --locked python playground/python/data_tour.py
uv run --project playground/python --locked pytest playground/python/tests/test_data.py -q
uv run --project playground/python --locked python playground/python/run_card.py numpy-scale-columns
uv run --project playground/python --locked python playground/python/run_card.py pandas-join-products
pnpm test
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime python
```

Initial interpreter/package provisioning needs network access. With the interpreter/wheels cached, use uv sync/run --offline to forbid network access. The tour prints [[10.0, 200.0], [30.0, 400.0]] and sorted order IDs [1, 2]. Tests use isolated data and temporary CSVs without data downloads or external services. run_card.py executes the exact code shown/copied by the extension, in a fresh directory. The full Python suite also executes all original cards and existing library/cleanup/error tests.

## Manual editor acceptance

1. In the existing monolithic VS Code workspace, reload the integration VSIX and open playground/python/data_tour.py from the primary checkout. Confirm Python is active and Reference has separate NumPy arrays and pandas tables groups. Open all eight overviews, check rules/official links and compare each with its two practical cards.
2. Search numpy broadcast, numpy view copy, pandas missing values, pandas group report and pandas validated join. A concrete corresponding task must appear in the first three examples; inspect separate quick references.
3. Place the cursor on np.array, np.multiply, pd.read_csv and pd.merge. Repeat with from-import aliases, inside functions/classes, and incomplete numeric.multiply( or table.DataFrame( edits. A comment/string mentioning another library must not supply a cue; unused imports and numpyReport/pandasReport identifiers must not create data overviews. Documented fallback limits on alias shadowing/reassignment still apply.
4. Copy numpy-scale-columns and pandas-join-products into disposable scripts and run in the locked playground environment; compare copied code/indentation to catalog text. Run their exact IDs with run_card.py and use test_data.py to inspect happy/empty/invalid inputs and recovery. Check shape rejection, source/view/copy mutation, nullable selection, all-missing groups and duplicate join-key errors.
5. Pin one NumPy and one pandas card, switch to Rust or TypeScript, return to Python and reload. Pins remain labeled Python with exact text; search follows the active language. Verify scrolling/highlighting and the copy control at narrow sidebar widths.
6. Python lessons now include nine data tasks at levels 3–5. Inspect prerequisites, mark a task In progress, reload, hide/restore a done task and confirm legacy progress remains. Starter snippets remain empty: all tasks are unsolved and contain no implementation scaffolding.

## Learning progression

The stable py-data-array → py-data-view → py-data-broadcast → py-data-reduce path builds from collections/pytest. The py-data-csv → py-data-labels → py-data-group → py-data-join path builds from CSV/pytest. Both lead to py-data-capstone, a deterministic tabular report. [python-data.ts](../src/lessons/python-data.ts) records prerequisite IDs, expected outputs, local setup and official reading; [lesson coverage](lesson-coverage.md) records counts and order. The boundary examples above establish that the APIs and task outcomes are achievable; learners write their own solutions.
