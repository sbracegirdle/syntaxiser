# SQL depth expansion (#79)

Baseline: 21 topics / 22 cards at 6b4d81c. Expanded: 37 topics / 63 exact executable SQL cards. Existing IDs remain unchanged. New units have independent schematic overviews and distinct tasks, grouped by shared SQL or dialect. Host-language APIs remain in sql-companions.json.

## Scope and evidence matrix

Every row names the grouped overview ID and its practical cards. SQL source/version assumptions appear in each overview/card; all shared cards target SQLite 3.53.1 and PostgreSQL 18.4. No compatibility with other SQL engines is claimed.

| Overview ID | Practical card IDs | Official references |
| --- | --- | --- |
| select | `sql-select` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| filter | `sql-filter` | [source](https://www.sqlite.org/lang_expr.html), [source](https://www.postgresql.org/docs/18/queries-table-expressions.html) |
| order-limit | `sql-order-limit` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/queries-order.html) |
| joins | `sql-joins` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/queries-table-expressions.html) |
| missing | `sql-missing` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/queries-table-expressions.html) |
| aggregates | `sql-aggregates` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/queries-table-expressions.html) |
| null | `sql-null` | [source](https://www.sqlite.org/lang_expr.html), [source](https://www.postgresql.org/docs/18/functions-comparison.html) |
| subqueries | `sql-subqueries`, `sql-subqueries-antipaid` | [source](https://www.sqlite.org/lang_expr.html), [source](https://www.postgresql.org/docs/18/functions-subquery.html) |
| cte | `sql-cte` | [source](https://www.sqlite.org/lang_with.html), [source](https://www.postgresql.org/docs/18/queries-with.html) |
| windows | `sql-windows` | [source](https://www.sqlite.org/windowfunctions.html), [source](https://www.postgresql.org/docs/18/tutorial-window.html) |
| insert | `sql-insert` | [source](https://www.sqlite.org/lang_insert.html), [source](https://www.postgresql.org/docs/18/sql-insert.html) |
| update | `sql-update` | [source](https://www.sqlite.org/lang_update.html), [source](https://www.postgresql.org/docs/18/sql-update.html) |
| delete | `sql-delete` | [source](https://www.sqlite.org/lang_delete.html), [source](https://www.postgresql.org/docs/18/sql-delete.html) |
| constraints | `sql-constraints` | [source](https://www.sqlite.org/lang_createtable.html), [source](https://www.postgresql.org/docs/18/ddl-constraints.html) |
| indexes | `sql-indexes`, `sql-indexes-partial`, `sql-indexes-expression` | [source](https://www.sqlite.org/queryplanner.html), [source](https://www.postgresql.org/docs/18/indexes.html) |
| transactions | `sql-transactions` | [source](https://www.sqlite.org/lang_transaction.html), [source](https://www.postgresql.org/docs/18/tutorial-transactions.html) |
| parameters | `sql-parameters`, `sql-parameters-postgresql`, `sql-parameters-prepared` | [source](https://www.sqlite.org/lang_expr.html), [source](https://www.postgresql.org/docs/18/sql-prepare.html) |
| sqlite-setup | `sql-sqlite-setup` | [source](https://www.sqlite.org/foreignkeys.html), [source](https://www.sqlite.org/autoinc.html) |
| pg-returning | `sql-pg-returning` | [source](https://www.postgresql.org/docs/18/ddl-identity-columns.html), [source](https://www.postgresql.org/docs/18/dml-returning.html) |
| pg-upsert | `sql-pg-upsert` | [source](https://www.postgresql.org/docs/18/sql-insert.html) |
| pg-json | `sql-pg-json`, `sql-pg-json-missing`, `sql-pg-json-patch` | [source](https://www.postgresql.org/docs/18/functions-json.html) |
| distinct | `sql-distinct-statuses`, `sql-distinct-contacts` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| set-operations | `sql-set-operations-union`, `sql-set-operations-intersect`, `sql-set-operations-except`, `sql-set-operations-all` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| conditional | `sql-conditional-contact`, `sql-conditional-ratio` | [source](https://www.sqlite.org/lang_expr.html), [source](https://www.postgresql.org/docs/18/functions-conditional.html) |
| join-multiplicity | `sql-join-multiplicity-managers`, `sql-join-multiplicity-preaggregate` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| pagination | `sql-pagination-keyset`, `sql-pagination-offset` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| aggregate-filter | `sql-aggregate-filter-report`, `sql-aggregate-filter-having` | [source](https://www.sqlite.org/lang_select.html), [source](https://www.postgresql.org/docs/18/sql-select.html) |
| window-frames | `sql-window-frames-ties`, `sql-window-frames-peers`, `sql-window-frames-last` | [source](https://www.sqlite.org/windowfunctions.html), [source](https://www.postgresql.org/docs/18/functions-window.html) |
| recursive-cte | `sql-recursive-cte-descendants`, `sql-recursive-cte-ancestors` | [source](https://www.sqlite.org/lang_with.html), [source](https://www.postgresql.org/docs/18/queries-with.html) |
| schema-evolution | `sql-schema-evolution-default`, `sql-schema-evolution-rename` | [source](https://www.sqlite.org/lang_altertable.html), [source](https://www.postgresql.org/docs/18/ddl-alter.html) |
| savepoints | `sql-savepoints-optional`, `sql-savepoints-outer` | [source](https://www.sqlite.org/lang_savepoint.html), [source](https://www.postgresql.org/docs/18/sql-savepoint.html) |
| sqlite-conflict | `sql-sqlite-conflict-update`, `sql-sqlite-conflict-ignore` | [source](https://www.sqlite.org/lang_upsert.html), [source](https://www.sqlite.org/lang_conflict.html) |
| sqlite-isolation | `sql-sqlite-isolation-writer`, `sql-sqlite-isolation-guard` | [source](https://www.sqlite.org/isolation.html), [source](https://www.sqlite.org/lang_transaction.html) |
| pg-isolation | `sql-pg-isolation-snapshot`, `sql-pg-isolation-increment` | [source](https://www.postgresql.org/docs/18/transaction-iso.html) |
| sqlite-json | `sql-sqlite-json-guard`, `sql-sqlite-json-missing` | [source](https://www.sqlite.org/json1.html) |
| sqlite-time | `sql-sqlite-time-normalize`, `sql-sqlite-time-range` | [source](https://www.sqlite.org/lang_datefunc.html) |
| pg-time | `sql-pg-time-normalize`, `sql-pg-time-range` | [source](https://www.postgresql.org/docs/18/datatype-datetime.html), [source](https://www.postgresql.org/docs/18/functions-datetime.html) |

Exact assertions live in playground/sql/cases.json, executed by verify.mjs; each new card has separate happy, edge and rejection/recovery cases. Engine-specific concurrency assertions live in concurrency.mjs and exercise independent connections. Plan assertions avoid assuming that tiny fixtures must use an index. Driver fixtures compile exact catalog text against the existing pinned pg/pgx/Python APIs.

Safe migrations cover additive defaults and column rename; arbitrary rebuild migrations and production locking strategy remain outside the sample scope. JSON imports deliberately contain malformed text to demonstrate validation boundaries. Timestamp cards use fixed UTC/offset inputs and explicit reporting zones, not the host clock.

## Manual review

Follow playground/sql/README.md for setup and all search/cursor/copy/pin/reference/switch checks. Search union distinct, case null, recursive cte, window frame ties, savepoint rollback and explain index scan in both dialects. Run the exact copied practical SQL against disposable databases. Compare ties and empty results, reject malformed JSON/time input and invalid constraints, then verify a successful operation after rollback.
