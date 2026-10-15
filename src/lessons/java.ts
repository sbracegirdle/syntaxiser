import type { Lesson } from '../core/lessons';

// Stable starter path for #36; task instructions contain no implementation scaffold.
const task = (id: string, difficulty: number, title: string, instructions: string, check: string): Lesson =>
  ({ id, difficulty, title, instructions, starter: '', check });

export const javaLessons: Lesson[] = [
  task('java-greeting', 1, 'Print a typed greeting',
    'Prerequisite: Java 21 installed as described in playground/java/README.md. In a disposable folder create Greeting.java with a main entry point. Bind a name and integer score and print one formatted line. Run java Greeting.java; do not change the playground application.',
    'Name Ada and score 5 print exactly Ada: 5. Change the inputs and verify the output follows them.'),
  task('java-clamp', 1, 'Write a bounded value method',
    'Prerequisite: greeting. Write a static method accepting a value, minimum and maximum. Clamp the value into the inclusive bounds. Reject reversed bounds with an IllegalArgumentException. Call it from a main method and run with java.',
    'Bounds 0..10 map -1 to 0, 5 to 5 and 11 to 10. Bounds 10..0 throw the expected exception.'),
  task('java-records', 2, 'Validate order records',
    'Prerequisite: clamp. Create an order record with name and integer quantity. Reject null/blank names and nonpositive quantities in its compact constructor. Run a small main program that checks accessors and equality.',
    'Two tea orders with quantity 2 compare equal. Empty/null names and quantities 0 or -1 throw. The valid record exposes the original name and quantity.'),
  task('java-word-count', 2, 'Count words in insertion order',
    'Prerequisite: records and basic loops. Count whitespace-separated case-sensitive words into a LinkedHashMap. Keep counting in a method and use a disposable main program to inspect empty input and repeated words.',
    'red blue red gives red=2 and blue=1, in that iteration order. Whitespace-only input produces an empty map. Red and red remain distinct keys.'),
  task('java-junit', 3, 'Test clamp boundaries with JUnit',
    'Prerequisite: clamp. Follow the Java playground tooling guide and create a new test under src/test/java/syntaxiser/playground. Use JUnit Jupiter Test, ParameterizedTest and CsvSource to test your own clamp method; include an assertThrows case. Run pnpm check:java from the repository root.',
    'Maven discovers separate boundary cases below, at, inside and above the bounds, plus reversed bounds. Intentionally change one expected value to confirm the test fails, then restore it.'),
  task('java-file-report', 3, 'Read a temporary report safely',
    'Prerequisite: JUnit and exceptions. Use JUnit TempDir to create a UTF-8 file with two lines. Read the first line using a BufferedReader in try-with-resources. Write tests for an empty file and missing path. Run pnpm check:java.',
    'The first line matches exactly including non-ASCII characters. Empty input returns an explicitly chosen absence result; a missing file reports IOException. The reader closes on every path.'),
  task('java-stream-totals', 4, 'Aggregate order quantities',
    'Prerequisite: records, maps and JUnit. Group a list of order records by name with a stream collector and sum quantities. Return a name-sorted map without modifying the source. Add tests in the Java playground and run pnpm check:java.',
    'tea quantities 1 and 2 total 3; coffee quantity 4 totals 4. Keys iterate coffee then tea. Empty input returns an empty map and the original list is unchanged.'),
  task('java-async', 4, 'Observe asynchronous work and failures',
    'Prerequisite: JUnit and exceptions. Submit two independent calculations to an owned ExecutorService, combine their results, and separately exercise a failed task. Bound test waits and close the executor using the Java 21 lifecycle API. Run pnpm check:java.',
    'The two sums of 1..3 and 4..6 combine to 21. A deliberately failed computation has its original cause observed. No executor remains running after the tests.'),
  task('java-json-api', 5, 'Create a tested order endpoint',
    'Prerequisite: records, JUnit and JSON basics. Using the pinned playground dependencies, add a distinct POST /practice/orders controller with Jakarta constraints, status 201 on success and a stable JSON error contract. Add MockMvc tests for valid, malformed and invalid input. Run pnpm check:java.',
    'A tea order with quantity 3 returns 201 and matching JSON. Blank names, quantity zero and malformed JSON return 400 with stable public errors. Tests run in process without external services.'),
  task('java-capstone', 5, 'Build a validated JSON order report',
    'Prerequisite: stream totals, file report, async and JSON API. In the playground, build a library method reading JSON orders from a temporary file with Jackson, validating each record and returning sorted aggregate quantities. Expose the pure aggregation behavior through a new endpoint. Add JUnit and MockMvc tests; run pnpm check:java.',
    'Repeated tea quantities 1 and 2 total 3 in deterministic name order. Tests cover empty input, malformed JSON, missing files and invalid quantities. Endpoint tests verify body and error status without accessing remote resources.'),
];
