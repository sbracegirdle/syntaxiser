import type { Lesson } from '../core/lessons';

export const csharpLessons: Lesson[] = [
  {
    "id": "csharp-greeting",
    "difficulty": 1,
    "title": "Print a typed greeting",
    "instructions": "Create a disposable console project following playground/csharp/tooling.md. Bind a name and integer score and print them using interpolation. Run dotnet run.",
    "starter": "",
    "check": "Ada and 5 print exactly Ada: 5. Changing both inputs changes the output.",
    "category": "text"
  },
  {
    "id": "csharp-clamp",
    "difficulty": 1,
    "title": "Write a bounded method",
    "instructions": "Prerequisite: greeting. Write a method clamping an integer to inclusive bounds; reject reversed bounds with ArgumentException. Call it from your console program.",
    "starter": "",
    "check": "Bounds 0..10 map -1, 5 and 11 to 0, 5 and 10. Reversed bounds throw.",
    "category": "numbers"
  },
  {
    "id": "csharp-boolean-guard",
    "difficulty": 1,
    "title": "Guard a zero divisor",
    "instructions": "Prerequisite: csharp-greeting. Write a predicate that compares an integer ratio only if its denominator is nonzero. Explain short-circuiting. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Guard a zero divisor.",
    "check": "6/3 passes, 3/2 fails after integer truncation, and zero denominator returns false without dividing.",
    "category": "numbers"
  },
  {
    "id": "csharp-ordinal-command",
    "difficulty": 1,
    "title": "Match an ordinal command token",
    "instructions": "Prerequisite: csharp-greeting. Accept a nullable command, reject null, trim and compare the entire token case-insensitively using ordinal rules. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Match an ordinal command token.",
    "check": "QUIT and padded quit match; acquit and empty input do not; null is rejected and the next valid input succeeds.",
    "category": "text"
  },
  {
    "id": "csharp-day-interval",
    "difficulty": 1,
    "title": "Count calendar days",
    "instructions": "Prerequisite: csharp-clamp. Parse exact yyyy-MM-dd dates with invariant culture and count the exclusive interval. Reject reversed dates. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Count calendar days.",
    "check": "2024-02-28 to 2024-03-01 is two days; equal dates yield zero; invalid leap dates and reversed intervals fail.",
    "category": "data"
  },
  {
    "id": "csharp-sentinel-loop",
    "difficulty": 1,
    "title": "Stop a sum at a sentinel",
    "instructions": "Prerequisite: csharp-clamp. Sum positive integers until zero. Reject negative values encountered before zero and detect overflow. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Stop a sum at a sentinel.",
    "check": "1,2,0,99 yields 3; empty input yields 0; a negative before zero fails; a negative after zero is ignored.",
    "category": "collections"
  },
  {
    "id": "csharp-nullable",
    "difficulty": 2,
    "title": "Handle an absent display name",
    "instructions": "Prerequisite: greeting. Enable nullable analysis. Accept a nullable name, trim a present value, and return Guest for null or blank. Avoid the null-forgiving operator.",
    "starter": "",
    "check": "Null, empty and whitespace yield Guest; a padded Ada yields Ada. Build without warnings.",
    "category": "text"
  },
  {
    "id": "csharp-records",
    "difficulty": 2,
    "title": "Copy an order record",
    "instructions": "Prerequisite: clamp. Define an order record and a method returning a copy with one more item. Compare equality and confirm the original is unchanged.",
    "starter": "",
    "check": "Tea quantity 2 produces tea quantity 3 while the original stays 2. Equivalent records compare equal.",
    "category": "data"
  },
  {
    "id": "csharp-money-rounding",
    "difficulty": 2,
    "title": "Parse an invariant invoice amount",
    "instructions": "Prerequisite: csharp-ordinal-command. Accept unsigned decimal text without grouping or currency symbols and round to two places using midpoint-to-even. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Parse an invariant invoice amount.",
    "check": "12.345 becomes 12.34 and 12.355 becomes 12.36; 0 is valid; comma decimal input fails then 1.00 succeeds.",
    "category": "numbers"
  },
  {
    "id": "csharp-value-point",
    "difficulty": 2,
    "title": "Move an immutable value point",
    "instructions": "Prerequisite: csharp-records. Define a readonly record struct and return a point one column right with checked arithmetic. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Move an immutable value point.",
    "check": "2,3 becomes 3,3 without changing the original; default becomes 1,0; maximum X rejects overflow.",
    "category": "data"
  },
  {
    "id": "csharp-casefold-inventory",
    "difficulty": 2,
    "title": "Reject duplicate inventory keys",
    "instructions": "Prerequisite: csharp-sentinel-loop. Build an ordinal case-insensitive dictionary from name/count pairs; allow zero counts and reject negatives or duplicate logical keys. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Reject duplicate inventory keys.",
    "check": "Tea can be retrieved as tea; Tea and tea together fail; empty input yields an empty dictionary; recovery succeeds.",
    "category": "collections"
  },
  {
    "id": "csharp-account-invariant",
    "difficulty": 2,
    "title": "Protect a balance with private setters",
    "instructions": "Prerequisite: csharp-clamp. Provide deposit/withdraw methods enforcing positive amounts and no overdraft. Write state assertions after rejection. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Protect a balance with private setters.",
    "check": "Deposit 5 then withdraw 2 leaves 3; a new balance is zero; overdraft and zero deposit fail without mutation.",
    "category": "data"
  },
  {
    "id": "csharp-theory",
    "difficulty": 3,
    "title": "Test clamp boundaries with xUnit",
    "instructions": "Prerequisite: clamp. Add your method to the playground library in a separate file, and a test under Tests. Use Theory and InlineData for below, exact, inside and above bounds, and Fact for reversed bounds. Run dotnet test Syntaxiser.sln.",
    "starter": "",
    "check": "All rows pass. Change one expectation to confirm failure, then restore it.",
    "category": "testing"
  },
  {
    "id": "csharp-file",
    "difficulty": 3,
    "title": "Read a temporary UTF-8 report",
    "instructions": "Prerequisite: theory. Write xUnit tests creating temporary files. Read a first line with a using-owned reader and test empty input and a missing file. Delete all fixtures in finally.",
    "starter": "",
    "check": "The first line preserves café; empty input returns an explicit absence result; missing input reports IOException. No fixtures remain.",
    "category": "files"
  },
  {
    "id": "csharp-snapshot-view",
    "difficulty": 3,
    "title": "Compare live views with snapshots",
    "instructions": "Prerequisite: csharp-casefold-inventory. Capture a readonly list view and a copied array, mutate the original, and explain each result. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Compare live views with snapshots.",
    "check": "The view sees an appended row, the snapshot does not; changing the snapshot does not change the source; test empty input.",
    "category": "collections"
  },
  {
    "id": "csharp-event-cleanup",
    "difficulty": 3,
    "title": "Limit an event subscription lifetime",
    "instructions": "Prerequisite: csharp-account-invariant. Subscribe a handler only while a supplied operation runs; unsubscribe in finally on both exits. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Limit an event subscription lifetime.",
    "check": "A publication during work invokes once, publication afterward does not; failing work still unsubscribes and later subscriptions work.",
    "category": "concurrency"
  },
  {
    "id": "csharp-strict-json",
    "difficulty": 3,
    "title": "Separate JSON presence from domain validation",
    "instructions": "Prerequisite: csharp-theory. Define a required name contract, reject unknown fields, and validate nonblank name and positive quantity after deserialization. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Separate JSON presence from domain validation.",
    "check": "Valid JSON succeeds; missing, null, unknown, malformed and zero quantity cases fail for the intended reason; a subsequent valid parse succeeds.",
    "category": "data"
  },
  {
    "id": "csharp-strict-encoding",
    "difficulty": 3,
    "title": "Decode a caller-owned stream strictly",
    "instructions": "Prerequisite: csharp-file. Read UTF-8 without replacement fallback or BOM autodetection and leave the supplied stream open. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Decode a caller-owned stream strictly.",
    "check": "café round-trips; empty input is empty; 0xff fails decoding; the stream remains open; another valid read works.",
    "category": "files"
  },
  {
    "id": "csharp-linq",
    "difficulty": 4,
    "title": "Aggregate order quantities",
    "instructions": "Prerequisite: records and theory. Use LINQ to group orders by name and sum quantities. Return a name-sorted snapshot without mutating the input. Test duplicate names and empty input.",
    "starter": "",
    "check": "Tea 1 and 2 total 3; coffee 4 totals 4; keys are coffee then tea. Empty input yields no rows.",
    "category": "collections"
  },
  {
    "id": "csharp-cancel",
    "difficulty": 4,
    "title": "Observe cancellation and cleanup",
    "instructions": "Prerequisite: theory. Write a Task-returning method accepting CancellationToken and passing it into an asynchronous wait. Await cancellation assertions and record cleanup in finally.",
    "starter": "",
    "check": "A cancelled token yields OperationCanceledException and exactly one cleanup record. An uncancelled call produces its expected result.",
    "category": "concurrency"
  },
  {
    "id": "csharp-left-join",
    "difficulty": 4,
    "title": "Preserve unmatched customers in a left join",
    "instructions": "Prerequisite: csharp-linq. Produce sorted customer:item rows, using none when no order matches. Reject duplicate customer keys and document right-side multiplicity. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Preserve unmatched customers in a left join.",
    "check": "Ada with tea and Bo without orders yields Ada:tea,Bo:none; empty input is empty; duplicate customer IDs fail.",
    "category": "collections"
  },
  {
    "id": "csharp-bounded-batch",
    "difficulty": 4,
    "title": "Bound concurrency without changing row order",
    "instructions": "Prerequisite: csharp-cancel. Transform integer inputs with configurable parallelism. Return an ordered result and observe transform failures. Test the maximum active count with gates instead of sleeps. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Bound concurrency without changing row order.",
    "check": "Outputs preserve input order; active work never exceeds two; empty input completes; zero concurrency and transform failures are observed.",
    "category": "concurrency"
  },
  {
    "id": "csharp-http-contract",
    "difficulty": 4,
    "title": "Read bounded HTTP JSON with cleanup",
    "instructions": "Prerequisite: csharp-strict-json. Use a reused HttpClient and a local handler to reject non-success/malformed/domain-invalid responses. Dispose every response, distinguish deadlines from caller cancellation. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Read bounded HTTP JSON with cleanup.",
    "check": "Valid JSON returns the order; null/malformed/non-success fail; zero deadline and cancelled caller have distinct exception types; tracked content closes; recovery works.",
    "category": "web"
  },
  {
    "id": "csharp-relational-conflict",
    "difficulty": 4,
    "title": "Handle a stale SQLite edit",
    "instructions": "Prerequisite: csharp-casefold-inventory. Use separate EF contexts against one disposable SQLite database, an application-managed concurrency token and at most one retry after reload. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Handle a stale SQLite edit.",
    "check": "The stale writer is rejected; reload sees the latest quantity; recomputed retry succeeds; a deleted row cannot be resurrected accidentally.",
    "category": "data"
  },
  {
    "id": "csharp-api",
    "difficulty": 5,
    "title": "Create a tested order endpoint",
    "instructions": "Prerequisite: records, theory and JSON basics. Add a distinct POST /practice/orders endpoint to the playground API. Validate name and positive quantity explicitly. Use WebApplicationFactory for success, invalid domain input and malformed JSON tests.",
    "starter": "",
    "check": "Valid input returns 201 and matching JSON; invalid fields and malformed JSON return 400. Tests use no external service.",
    "category": "web"
  },
  {
    "id": "csharp-capstone",
    "difficulty": 5,
    "title": "Build a validated JSON order report",
    "instructions": "Prerequisite: file, linq, cancel and api. Read a temporary JSON order file with System.Text.Json, validate each record and return deterministic name totals. Keep aggregation separate from I/O. Add a new endpoint and xUnit request tests.",
    "starter": "",
    "check": "Tests cover empty input, repeated names, invalid quantities, malformed JSON, missing files and cancellation. Tea 1 and 2 total 3; the endpoint has predictable status and error responses.",
    "category": "data"
  },
  {
    "id": "csharp-capstone-relational",
    "difficulty": 5,
    "title": "Build a transactional inventory import",
    "instructions": "Prerequisite: csharp-relational-conflict and csharp-strict-json. Import two validated rows with multiple saves in one EF SQLite transaction. Verify unique, foreign-key and quantity constraints; discard failed tracking state and retry a corrected batch. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Build a transactional inventory import.",
    "check": "A duplicate second name rolls back the first save; no orphan owner is committed; corrected import commits exactly two rows. All tests use fresh SQLite databases.",
    "category": "data"
  },
  {
    "id": "csharp-capstone-stream",
    "difficulty": 5,
    "title": "Build a cancellable streaming report",
    "instructions": "Prerequisite: csharp-bounded-batch and csharp-strict-encoding. Read isolated file data, transform rows through an async iterator and bounded channel, and expose a deterministic aggregate. Propagate cancellation and complete the producer after failure. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Build a cancellable streaming report.",
    "check": "Empty input terminates; output order is deterministic; producer failure is observed; cancellation leaves no pending producer; later runs succeed.",
    "category": "concurrency"
  },
  {
    "id": "csharp-capstone-host",
    "difficulty": 5,
    "title": "Build a validated local report API",
    "instructions": "Prerequisite: csharp-api and csharp-http-contract. Compose routing/query binding, validated options, scoped services, endpoint filters and structured request logging. Test it through WebApplicationFactory. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Build a validated local report API.",
    "check": "Assert JSON bodies, 200/400/404/503 statuses, stable public codes, response headers and a successful request after rejection; no private exception detail leaks.",
    "category": "web"
  },
  {
    "id": "csharp-capstone-lifecycle",
    "difficulty": 5,
    "title": "Build an isolated async test fixture",
    "instructions": "Prerequisite: csharp-theory and csharp-capstone-relational. Use xUnit async lifecycle and class fixtures for temporary reports and disposable relational storage; add MemberData edge cases. Make fixtures independent of test order. Use the pinned playground and run the relevant xUnit tests; see docs/csharp-depth.md for validation cases.",
    "starter": "// Build an isolated async test fixture.",
    "check": "Each fixture owns a unique resource; happy/empty/invalid cases pass; teardown removes files after failure; reruns do not share state.",
    "category": "testing"
  }
];
