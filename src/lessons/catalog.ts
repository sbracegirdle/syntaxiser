import type { Lesson } from '../core/lessons';
import { curatedCategoryGroups, type LessonCategory } from './categories';
import { rustFoundations } from './rust-foundations';
import { expandedExercises } from './expanded';
import { csharpLessons } from './csharp';
import { javaLessons } from './java';

// Stable IDs preserve progress across wording changes. Exercises stay separate
// from syntax overviews and practical reference snippets.
const lesson = (id: string, difficulty: number, title: string, instructions: string, check: string): Lesson =>
  ({ id, difficulty, title, instructions, starter: '', check });

export const builtinLessons: Record<string, Lesson[]> = {
  yaml: [
    lesson('yaml-nested-config', 1, 'Describe a local application',
      'Reference prerequisites: yaml-tags / yaml-tags-identifiers; yaml-validation / yaml-validation-unique. Create config.yaml in a disposable directory. Describe a named application with a boolean enabled flag, a nested server port, and two ordered targets. Quote an identifier with leading zeros. Follow playground/yaml/README.md to parse it with the locked YAML 1.2 parser.',
      'The parsed port is numeric, enabled is boolean, the identifier remains a string and the target order is preserved. A duplicate key or indentation tab is rejected.'),
    lesson('yaml-reusable-text', 2, 'Preserve text and reuse a list',
      'Reference prerequisites: yaml-multiline / yaml-multiline-chomping and yaml-multiline-indent; yaml-anchors / yaml-anchors-identity; yaml-merge / yaml-merge-nested. In a generic YAML file, write a two-line literal block and a folded description without a final newline. Define an anchored two-item list and refer to it through an alias. Parse with ruamel.yaml from the playground; keep this exercise outside CloudFormation.',
      'The literal keeps both line breaks, the folded description is one line without a trailing newline, and both list fields contain the same ordered values.'),
    lesson('yaml-workflow-matrix', 3, 'Design a read-only test matrix',
      'Reference prerequisites: github-reusable / yaml-reusable-label; github-job-conditions / yaml-conditions-summary; github-concurrency / yaml-concurrency-branch. In a disposable .github/workflows/check.yml, define push and pull_request triggers and contents read permission. Check Node 22 and 24 using a matrix. Add a summary job depending on the matrix job. Validate with the pinned actionlint command in playground/yaml/README.md; do not publish the workflow.',
      'actionlint reports no errors. The matrix has two runtime versions, summary names the correct dependency and no write permission is granted.'),
    lesson('yaml-compose-health', 4, 'Describe a persistent healthy service',
      'Reference prerequisites: compose-profiles / yaml-profiles-test; compose-overrides / yaml-override-environment; compose-health / yaml-health-completion. Create a disposable compose.yaml using Redis 7.4 Alpine. Add a named /data volume, a redis-cli ping health check and a second service that waits for service_healthy. Use docker compose config as described in the playground, without starting containers.',
      'The normalized configuration contains the declared volume, a valid health check and the dependent service condition. No image pull, container or volume creation is required.'),
    lesson('yaml-stack-capstone', 5, 'Validate a configurable queue template',
      'Reference prerequisites: cfn-mappings / yaml-mapping-retention; cfn-properties / yaml-properties-redrive; cfn-composition / yaml-composition-join. Create a disposable CloudFormation template with an SQS queue. Add a dev/prod parameter, conditionally select one-day or fourteen-day retention, and output the queue ARN with GetAtt. Use cfn-lint from the locked playground environment. Do not deploy the template.',
      'cfn-lint reports no errors, the parameter has an allowed-value constraint, both retention branches are valid and the ARN output references the declared queue. No cloud credentials are needed.'),
  ],
  java: javaLessons,
  csharp: csharpLessons,
  python: [
    lesson('hello', 1, 'Print a greeting', 'Create greeting.py in a disposable folder. Bind a name and integer score, then print them using an f-string. Run it with uv run --python 3.13 greeting.py.',
      'Name Ada and score 5 print exactly Ada: 5. Change both inputs and confirm the output follows them.'),
    lesson('functions', 1, 'Write a total function', 'Write a function accepting two integers and returning their sum. Call it with positive, zero and negative inputs. Use assertions outside the function. Review Reference arguments and truthiness, plus docs/python-depth.md for the safe-default and argument-kind prerequisites.',
      'Inputs 2, 3 return 5; 0, 0 return 0; -2, 1 return -1. Every assertion passes under uv run.'),
    lesson('collections', 2, 'Count repeated words', 'Count whitespace-separated words in a dictionary without changing their case. Return an empty dictionary for empty input. Use a function so the behavior is easy to test. Review Reference copying and collection-tools; docs/python-depth.md links the relevant aggregation prerequisites.',
      'red blue red gives red=2 and blue=1. Empty and whitespace-only input produce an empty dictionary.'),
    lesson('csv-report', 2, 'Read a CSV total', 'Use a temporary directory and write a CSV file with quantity values 1, 2 and 3. Read with csv.DictReader, convert quantities to integers and compute a total. Use with and newline handling.',
      'The total is 6. A nonnumeric quantity produces a clearly reported error; all files close before cleanup.'),
    lesson('pytest', 3, 'Test a parser with pytest', 'Use the locked Python playground dependencies in a separate test file. Write a nonnegative integer parser and parametrized pytest cases. Test invalid input with pytest.raises and use tmp_path for a file fixture.',
      'uv run pytest passes zero, positive, negative and malformed cases. The fixture creates files only under tmp_path.'),
    lesson('validation', 3, 'Validate an order', 'With Pydantic 2, define an order with a text name and a strictly positive integer quantity. Validate external dictionaries in strict mode, inspect structured errors and serialize valid data.',
      'Quantity 3 validates and round-trips through JSON. Zero, negative and string quantities fail with a quantity field error.'),
    lesson('cancellation', 4, 'Cancel a worker cleanly', 'Create an asyncio worker that signals when it starts, waits for cancellation and records cleanup in finally. Cancel it after the start signal and await its completion explicitly. Review Reference task-groups and timeouts, with prerequisite links in docs/python-depth.md.',
      'The task ends with CancelledError and records cleanup exactly once. No worker is left pending when the event loop exits.'),
    lesson('http-client', 4, 'Test an HTTP client locally', 'Use HTTPX MockTransport to provide a valid JSON response, a 503 response and a simulated ReadTimeout. Reuse a client with an explicit timeout and handle each failure separately.',
      'Success yields the expected JSON; 503 and ReadTimeout take distinct error paths. The client closes and no external request occurs.'),
    lesson('json-api', 5, 'Build a tested JSON endpoint', 'Create a FastAPI POST /items endpoint using a Pydantic model with a positive quantity. Return 201 with the validated item, reject an unavailable name with 409 and test through TestClient using the locked playground dependencies.',
      'In-process tests verify the 201 JSON body, 422 for quantity zero and 409 for an unavailable name. No listening server is needed.'),
    lesson('capstone', 5, 'Build a validated CSV report', 'Combine pathlib, csv, Pydantic and pytest in a disposable project. Read named rows, validate quantities, aggregate totals by name and emit JSON in sorted name order. Keep file I/O separate from aggregation. Review Reference json, csv, decimal and itertools; docs/python-depth.md maps the prerequisite validation and aggregation topics.',
      'Tests cover empty input, duplicate names, invalid quantities and missing files. For tea quantities 1 and 2, JSON reports tea=3; output order is deterministic.'),
  ],
  sql: [
    lesson('sql-first-report', 1, 'List customer names',
      'Use playground/sql and its seeded database. Create a SQL file that returns customer names in id order. Run it against SQLite or the disposable PostgreSQL server described in the playground README.',
      'The names are Ada, Ben, Cy, Dee, in that order. Return only the requested column.'),
    lesson('sql-missing-orders', 2, 'Find customers without orders',
      'Using the seeded customers and orders tables, find customers with no orders. Compare a left join with a correlated subquery. Keep both queries in a SQL file and execute them.',
      'Both queries return only customer id 4, Dee. Explain how NULL participates in the left-join result.'),
    lesson('sql-paid-totals', 3, 'Report paid customer totals',
      'Aggregate only paid orders by customer. Return customer ids and totals of at least 50, ordered by customer id. Explain the difference between filtering rows and filtering groups.',
      'Rows are (1, 100) and (2, 50). Pending and cancelled orders contribute nothing.'),
    lesson('sql-ranked-orders', 4, 'Rank and select each customer’s largest order',
      'Rank orders within each customer by total descending, breaking ties by order id. Use a CTE or subquery to return one largest order per customer. Execute the query on both playground engines.',
      'Customer/order pairs are (1, 1), (2, 3), (3, 4). Adding a tied order must keep the choice deterministic.'),
    lesson('sql-safe-change', 5, 'Recover from a failed transaction',
      'In the disposable playground, start a transaction, create a savepoint, and deliberately violate a uniqueness constraint. Recover, change an order total, then roll back the outer transaction. Add a host-language lookup that binds an input value through sqlite3, database/sql or pg. Follow the playground setup for your chosen client.',
      'After rollback, order 1 still totals 100. A subsequent query succeeds. A name containing quotes is treated as data. Explain PostgreSQL’s aborted-transaction behavior and explicitly close client resources.'),
  ],
  rust: [
    lesson('hello', 1, 'Say hello', 'Create a binary with cargo new hello. Change main to print Hello, Rust! and run it with cargo run.',
      'The terminal prints exactly Hello, Rust! on one line.'),
    lesson('variables', 1, 'Change a score', 'Declare a mutable score starting at 2, add 3, then print it. Try removing mut and read the compiler error.',
      'cargo run prints 5. Explain why the binding needs mut.'),
    lesson('functions', 1, 'Write your first function', 'Implement double so main prints 12. Use a parameter, return type, and a tail expression.',
      'double(0) is 0 and double(-3) is -6. Add assertions for both.'),
    lesson('branches-loops', 2, 'Add only even numbers', 'Loop through 1..=10 and add only even values to a total. Use a condition inside the loop.',
      'The total is 30. Change the upper bound to 4 and verify 6.'),
    lesson('borrowing', 2, 'Borrow a greeting', 'Implement shout with a borrowed &str input and an owned uppercase String result. Keep using the caller\'s original String afterward.',
      'Output is HELLO then hello. Explain why the original value was not moved.'),
    lesson('structs-options', 2, 'Find a user safely', 'Define User with name: String. Implement first_name over a borrowed slice using first() and Option, without indexing or unwrap.',
      'An empty slice returns None; a one-user slice returns Some with the name. Add tests.'),
    lesson('results', 3, 'Parse a fallible total', 'Parse two &str inputs as i32 and return their sum in Result. Propagate parse failures with ? instead of panicking.',
      'total("2", "3") returns Ok(5); total("oops", "3") returns Err. Test both.'),
    lesson('iterator-pipeline', 3, 'Build an iterator pipeline', 'Return doubled positive numbers from a borrowed slice using an iterator pipeline. Preserve the input and handle an empty slice.',
      'Input [-2, 0, 3, 5] returns [6, 10]; empty input returns an empty Vec.'),
    lesson('traits', 3, 'Share behavior through a trait', 'Define a Describe trait returning String, implement it for two structs, and write a generic function that accepts either type.',
      'Call the same generic function with both types. Each returns a different nonempty description.'),
    lesson('word-count', 4, 'Count words with a map', 'Write word_counts to count whitespace-separated words in a map. Borrow keys from the input and add a lifetime only where needed.',
      '"red blue red" gives red=2, blue=1. Empty text gives an empty map. Add unit tests.'),
    lesson('threads', 4, 'Collect results from worker threads', 'Split owned numbers between two std::thread workers, sum each chunk, join the handles and combine results. Handle a panicked worker explicitly.',
      'Print 21 for chunks [1, 2, 3] and [4, 5, 6]. Explain why each spawned closure owns its input and why join returns Result.'),
    lesson('capstone', 5, 'Build a tested command-line report', 'Create a library plus binary that reads a file path from arguments and reports sorted word frequencies. Return errors from the library; report failures and exit unsuccessfully from the binary. Keep I/O separate from counting.',
      'cargo test passes unit and public-API integration tests. A missing file exits unsuccessfully; tied frequencies have a deterministic word order.'),
  ],
  go: [
    lesson('hello', 1, 'Say hello', 'Run go mod init example.com/hello in a new folder. Create main.go and print Hello, Go! with fmt.Println. Run go run .',
      'The terminal prints exactly Hello, Go! on one line.'),
    lesson('variables', 1, 'Change a score', 'Declare score starting at 2 with :=, add 3, then print it. Try declaring an unused variable and read the compiler error.',
      'go run . prints 5. Explain the difference between declaration and assignment.'),
    lesson('functions', 1, 'Write your first function', 'Implement double with an int parameter and result. Call it with 6 from main.',
      'Output is 12. Check that double(0) is 0 and double(-3) is -6.'),
    lesson('branches-loops', 2, 'Add only even numbers', 'Use a for loop and if to total the even integers from 1 through 10.',
      'The total is 30. With an upper bound of 4, it is 6.'),
    lesson('slices', 2, 'Filter a slice', 'Return a new slice containing positive values. Use range and append without changing the input.',
      '[-2, 0, 3, 5] returns [3, 5]. Empty input has length 0. Original input stays unchanged.'),
    lesson('structs', 2, 'Update a user', 'Define User with Name and Visits fields. Implement a pointer receiver method Visit that increments Visits.',
      'Calling Visit twice changes the original User. Explain why a value receiver would not update it.'),
    lesson('errors', 3, 'Parse a fallible total', 'Use strconv.Atoi to parse two strings and return their sum and an error. Return early on each error.',
      '"2", "3" returns 5, nil. "oops", "3" returns a non-nil error; do not panic.'),
    lesson('interfaces', 3, 'Share behavior through an interface', 'Define a Describer interface with Describe() string. Implement it for two structs and call both through a function accepting Describer.',
      'Both types work without an explicit implements declaration and return different descriptions.'),
    lesson('table-tests', 3, 'Test boundary cases', 'Implement a Clamp function and write table-driven tests in clamp_test.go using testing and t.Run.',
      'go test ./... passes cases below, within, and above the range, plus exact boundaries.'),
    lesson('word-count', 4, 'Count words with a map', 'Use strings.Fields and a map to count occurrences. Return an empty map for empty input and add tests.',
      '"red blue red" gives red=2, blue=1. Tests cover whitespace and empty input.'),
    lesson('goroutines', 4, 'Collect results from workers', 'Launch two goroutines to sum separate slices, send subtotals on a channel, and collect exactly two results. Avoid unsynchronized shared writes.',
      'Print 21 for chunks [1, 2, 3] and [4, 5, 6]. Run go run -race . and explain what would happen if no one received from the channel.'),
    lesson('capstone', 5, 'Build a cancellable worker report', 'Create a library plus cmd/report binary that processes file paths with a bounded worker pool. Use context cancellation, close channels from their owning sender, return file errors, and produce deterministic output.',
      'go test -race ./... passes. Tests cover empty input, a missing file, cancellation, and sorted output. All workers exit after cancellation.'),
  ],
};

// Stable sorting keeps existing lessons in their original order within each level.
for (const [languageId, exercises] of Object.entries(expandedExercises)) {
  builtinLessons[languageId] = [...(builtinLessons[languageId] ?? []), ...exercises.map(exercise => exercise.lesson)]
    .sort((a, b) => a.difficulty - b.difficulty);
}

// Theme metadata is additive; persisted identities and progress never change.
for (const [languageId, groups] of Object.entries(curatedCategoryGroups)) {
  for (const [category, ids] of Object.entries(groups)) {
    for (const id of ids ?? []) {
      const item = builtinLessons[languageId]?.find(lesson => lesson.id === id);
      if (item) item.category = category as LessonCategory;
    }
  }
}
for (const exercise of rustFoundations) {
  const title = exercise.lesson.instructions.match(/^Prerequisites: (.*?)\./)?.[1];
  const prerequisite = builtinLessons.rust?.find(lesson => lesson.title === title);
  if (!prerequisite) throw new Error(`Unknown prerequisite for ${exercise.lesson.id}: ${title}`);
  exercise.prerequisites = [prerequisite.id];
}
