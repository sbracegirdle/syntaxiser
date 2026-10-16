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
  }
];
