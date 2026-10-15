import { rustFoundations } from './rust-foundations';
import type { Lesson } from '../core/lessons';

export interface LessonExercise {
  lesson: Lesson;
  topics: string[];
  prerequisites: string[];
  reference: string;
}

export const expandedExercises: Record<string, LessonExercise[]> = {
  "typescript": [
    {
      "lesson": {
        "id": "ts-values",
        "difficulty": 1,
        "title": "Describe a typed score",
        "instructions": "Prerequisites: none; start here.\n\nGoal: Declare a player name, a numeric score of 2 and a boolean active flag. Increase the score by 3 and print a typed summary.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Strict compilation passes; the summary includes score 5. Assigning a string to score produces a diagnostic; restore the valid version."
      },
      "topics": [
        "variables",
        "types"
      ],
      "prerequisites": [],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-functions",
        "difficulty": 1,
        "title": "Calculate a total",
        "instructions": "Prerequisites: Describe a typed score.\n\nGoal: Write a function taking readonly number[] and returning the sum without changing the input. Call it from a separate module.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Assert totals of 6 for [1,2,3] and 0 for []; strict compilation and the assertions pass."
      },
      "topics": [
        "functions",
        "arrays"
      ],
      "prerequisites": [
        "ts-values"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-optional",
        "difficulty": 2,
        "title": "Format optional labels",
        "instructions": "Prerequisites: Calculate a total.\n\nGoal: Model a user with an optional nickname. Format the nickname when present and otherwise the name, preserving an empty nickname.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Assert that undefined falls back to the name while an empty nickname stays empty. Avoid non-null assertions."
      },
      "topics": [
        "optional",
        "nullability"
      ],
      "prerequisites": [
        "ts-functions"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-unions",
        "difficulty": 2,
        "title": "Narrow an unknown value",
        "instructions": "Prerequisites: Format optional labels.\n\nGoal: Accept unknown input and return a numeric score only for finite numbers. Reject strings, null and NaN using runtime narrowing.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Tests accept 0 and 2.5; reject \"2\", null and NaN. No any or unchecked type assertion is needed."
      },
      "topics": [
        "narrowing",
        "unions"
      ],
      "prerequisites": [
        "ts-optional"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-collections",
        "difficulty": 2,
        "title": "Group purchases",
        "instructions": "Prerequisites: Narrow an unknown value.\n\nGoal: Group [{category:\"book\",amount:3},{category:\"food\",amount:2},{category:\"book\",amount:4}] by category using a Map. Preserve the records.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Book totals 7 and food totals 2; empty input produces an empty Map. Assert input records remain unchanged."
      },
      "topics": [
        "collections",
        "maps"
      ],
      "prerequisites": [
        "ts-unions"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-generics",
        "difficulty": 2,
        "title": "Select a typed first value",
        "instructions": "Prerequisites: Group purchases.\n\nGoal: Write a generic first function for readonly arrays. Preserve the element type and represent the empty case explicitly.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "A string array yields string or undefined and a numeric array yields number or undefined. Empty input returns undefined."
      },
      "topics": [
        "generics",
        "arrays"
      ],
      "prerequisites": [
        "ts-collections"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-discriminants",
        "difficulty": 3,
        "title": "Handle every request state",
        "instructions": "Prerequisites: Select a typed first value.\n\nGoal: Model idle, loading, success with data, and error with message as a discriminated union. Render a description with an exhaustive check.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Test all four states. Adding a new state causes a compile error at the exhaustive check until handled."
      },
      "topics": [
        "narrowing",
        "unions"
      ],
      "prerequisites": [
        "ts-generics"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-parse",
        "difficulty": 3,
        "title": "Validate external JSON",
        "instructions": "Prerequisites: Handle every request state.\n\nGoal: Use the pinned Zod dependency to validate an object with a nonempty name and positive integer quantity. Parse JSON and report syntax and schema failures separately.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Accept {\"name\":\"Ada\",\"quantity\":2}; reject zero, fractions and missing names. Malformed JSON returns a useful error without crashing."
      },
      "topics": [
        "zod",
        "validation"
      ],
      "prerequisites": [
        "ts-discriminants"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-async",
        "difficulty": 3,
        "title": "Report asynchronous failures",
        "instructions": "Prerequisites: Validate external JSON.\n\nGoal: Write an async loader that accepts a supplied fetch function, checks response status and parses JSON. Test it with local fake responses.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "A successful response returns data; a 500 response and rejected fetch each produce a controlled failure. Tests make no network requests."
      },
      "topics": [
        "async",
        "errors"
      ],
      "prerequisites": [
        "ts-parse"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-cancel",
        "difficulty": 3,
        "title": "Cancel stale requests",
        "instructions": "Prerequisites: Report asynchronous failures.\n\nGoal: Implement a request helper accepting AbortSignal and a React-free caller that aborts its previous request. Use an injected delayed loader in tests.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Starting B cancels A; only B updates displayed state. An intentional abort is distinguishable from a server error."
      },
      "topics": [
        "async",
        "abort"
      ],
      "prerequisites": [
        "ts-async"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-tests",
        "difficulty": 3,
        "title": "Table-test a price rule",
        "instructions": "Prerequisites: Cancel stale requests.\n\nGoal: Write a discount function: purchases of at least 100 receive 10 percent off. Add Vitest table cases including exact boundaries and negative input rejection.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "99 gives 99; 100 gives 90; 200 gives 180; negative input throws. pnpm exec vitest run passes."
      },
      "topics": [
        "vitest",
        "testing"
      ],
      "prerequisites": [
        "ts-cancel"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-props",
        "difficulty": 3,
        "title": "Build typed counter controls",
        "instructions": "Prerequisites: Table-test a price rule.\n\nGoal: Create a TSX button component with typed label, disabled and onIncrement props. Mount it in the browser playground; provide an accessible name.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "One click invokes the callback once; disabled blocks clicks. A callback with an incompatible parameter is rejected by TypeScript."
      },
      "topics": [
        "react",
        "props",
        "tsx"
      ],
      "prerequisites": [
        "ts-tests"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-reducer",
        "difficulty": 4,
        "title": "Model cart transitions",
        "instructions": "Prerequisites: Build typed counter controls.\n\nGoal: Build a typed reducer for adding, removing and clearing cart lines. Define add behavior as incrementing the quantity for an existing product id.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Tests add the same id twice, remove it and clear the cart. Unknown state is impossible through the typed action union."
      },
      "topics": [
        "react",
        "state",
        "reducer"
      ],
      "prerequisites": [
        "ts-props"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-events",
        "difficulty": 4,
        "title": "Handle a typed search form",
        "instructions": "Prerequisites: Model cart transitions.\n\nGoal: Implement a controlled search field and submit handler in TSX with typed form/input events. Trim only on submit.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Typing preserves spaces; submitting \" Ada \" calls the search callback with \"Ada\" exactly once without navigation."
      },
      "topics": [
        "react",
        "events",
        "forms"
      ],
      "prerequisites": [
        "ts-reducer"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-effect",
        "difficulty": 4,
        "title": "Clean up a subscription",
        "instructions": "Prerequisites: Handle a typed search form.\n\nGoal: Implement a component subscribing to a supplied event source. Unsubscribe on source change and unmount; test with Testing Library in jsdom.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Emit once and see one update; replace the source and confirm the old one has no listeners. Unmount leaves no listener; account for StrictMode setup/cleanup."
      },
      "topics": [
        "react",
        "effects",
        "cleanup"
      ],
      "prerequisites": [
        "ts-events"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-express",
        "difficulty": 4,
        "title": "Validate a local endpoint",
        "instructions": "Prerequisites: Clean up a subscription.\n\nGoal: Build a local Express JSON POST /items route validating name and quantity with Zod. Return 201 for valid data and 400 for invalid data; keep storage in memory.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Local request tests cover valid, missing-name and malformed-JSON requests. Close the test server; no database or external service is used."
      },
      "topics": [
        "express",
        "zod",
        "http"
      ],
      "prerequisites": [
        "ts-effect"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-query",
        "difficulty": 4,
        "title": "Cache a local query",
        "instructions": "Prerequisites: Validate a local endpoint.\n\nGoal: Use TanStack Query with an injected local loader and an isolated QueryClient per test. Render loading, error and successful states; configure retries off for deterministic error tests.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Repeated reads share cached data. Invalidating the key triggers another load; error state appears without a hanging retry timer."
      },
      "topics": [
        "react",
        "tanstack-query"
      ],
      "prerequisites": [
        "ts-express"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-store",
        "difficulty": 5,
        "title": "Build an isolated cart store",
        "instructions": "Prerequisites: Cache a local query.\n\nGoal: Build a Zustand cart store factory with add, remove and total operations. Keep two instances independent and expose a typed React selector.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Adding a 3-unit item twice totals 6. Removing resets total to 0; the other instance never changes. Component tests assert the displayed total."
      },
      "topics": [
        "zustand",
        "state",
        "testing"
      ],
      "prerequisites": [
        "ts-query"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-capstone",
        "difficulty": 5,
        "title": "Ship a tested local task board",
        "instructions": "Prerequisites: Build an isolated cart store.\n\nGoal: Combine typed task records, a reducer, controlled input and status filters in a small TSX board. Assign unique ids; reject blank titles; keep tasks in memory.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Browser tests add two tasks, complete one, filter open/done and delete a task. Strict compilation passes; keyboard submission works and ids remain stable."
      },
      "topics": [
        "react",
        "typescript",
        "testing"
      ],
      "prerequisites": [
        "ts-store"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
    {
      "lesson": {
        "id": "ts-api-capstone",
        "difficulty": 5,
        "title": "Build a typed report service",
        "instructions": "Prerequisites: Ship a tested local task board.\n\nGoal: Combine a validated Express endpoint and a typed client using injected fetch. Return grouped totals from in-memory records; propagate errors without leaking stack traces.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock; add exercise .ts/.tsx files and lesson.test.tsx tests at its root. Its Vitest config uses jsdom; use the node environment for server-only tests. Run nvm use, pnpm install --frozen-lockfile --ignore-scripts, pnpm exec tsc --noEmit and pnpm exec vitest run. Browser mounting uses the pinned esbuild/static-server setup in docs/lesson-library.md.\n\nLearning reference: https://www.typescriptlang.org/docs/handbook/intro.html",
        "starter": "",
        "check": "Request tests verify totals, invalid payloads, non-2xx client behavior and malformed JSON. Stop all listeners and keep tests offline."
      },
      "topics": [
        "express",
        "zod",
        "async"
      ],
      "prerequisites": [
        "ts-capstone"
      ],
      "reference": "https://www.typescriptlang.org/docs/handbook/intro.html"
    },
  ],
  "shellscript": [
    {
      "lesson": {
        "id": "sh-location",
        "difficulty": 1,
        "title": "Explore a disposable workspace",
        "instructions": "Prerequisites: none; start here.\n\nGoal: Create a temporary directory with mktemp -d and work only inside it. Make nested notes/archive folders, print the current directory and list the tree.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "pwd points inside the temporary directory; both nested folders exist. Remove only the recorded temporary directory at the end."
      },
      "topics": [
        "navigation",
        "files"
      ],
      "prerequisites": [],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-spaces",
        "difficulty": 1,
        "title": "Handle a filename with spaces",
        "instructions": "Prerequisites: Explore a disposable workspace.\n\nGoal: Inside the disposable workspace create a file named daily notes.txt containing two lines. Copy it into archive using quoted paths.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "The copied file has exactly two lines and identical bytes. No accidental daily or notes.txt sibling exists."
      },
      "topics": [
        "quoting",
        "files"
      ],
      "prerequisites": [
        "sh-location"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-env",
        "difficulty": 2,
        "title": "Pass a scoped environment value",
        "instructions": "Prerequisites: Handle a filename with spaces.\n\nGoal: Run a child shell with a scoped COURSE_NAME containing spaces. Print the value in the child without using eval; compare the parent environment.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Child output preserves the spaces; an unset parent variable stays unset after the command. Never print unrelated environment variables."
      },
      "topics": [
        "environment",
        "quoting"
      ],
      "prerequisites": [
        "sh-spaces"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-pipes",
        "difficulty": 2,
        "title": "Count repeated words",
        "instructions": "Prerequisites: Pass a scoped environment value.\n\nGoal: Write red, blue, red on separate lines to a local fixture. Build a pipeline producing sorted word counts.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "The counts are blue=1 and red=2. Empty input produces no rows, and the fixture file is unchanged."
      },
      "topics": [
        "pipes",
        "sort",
        "uniq"
      ],
      "prerequisites": [
        "sh-env"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-search",
        "difficulty": 2,
        "title": "Search files deliberately",
        "instructions": "Prerequisites: Count repeated words.\n\nGoal: Create two .txt files and one .log file with a known marker. Find only .txt files and search for the marker while handling spaces in paths.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Only matching .txt filenames appear; the .log is excluded. A missing marker gives a nonzero search status without deleting files."
      },
      "topics": [
        "find",
        "search"
      ],
      "prerequisites": [
        "sh-pipes"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-status",
        "difficulty": 3,
        "title": "Preserve a command failure",
        "instructions": "Prerequisites: Search files deliberately.\n\nGoal: Write a Bash script that runs a failing command inside an if condition, prints a useful diagnostic and exits with a chosen nonzero status.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Running the script returns status 7 and one diagnostic. A successful variant returns 0; no reliance on set -e alone."
      },
      "topics": [
        "exit-status",
        "conditions"
      ],
      "prerequisites": [
        "sh-search"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-args",
        "difficulty": 3,
        "title": "Validate script arguments",
        "instructions": "Prerequisites: Preserve a command failure.\n\nGoal: Write a Bash script requiring one existing input-file argument. Count its lines and report missing arguments or files on stderr.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "A two-line file with spaces in its name gives 2. Zero arguments or a missing file exits nonzero and writes no success output."
      },
      "topics": [
        "arguments",
        "quoting"
      ],
      "prerequisites": [
        "sh-status"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-trap",
        "difficulty": 3,
        "title": "Clean up temporary work",
        "instructions": "Prerequisites: Validate script arguments.\n\nGoal: Write a Bash script creating a temporary folder and registering an EXIT cleanup trap immediately. Add success and forced-failure paths.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "The folder disappears after both paths, preserving the intended exit status. The trap quotes the captured path."
      },
      "topics": [
        "trap",
        "cleanup"
      ],
      "prerequisites": [
        "sh-args"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-git-review",
        "difficulty": 3,
        "title": "Inspect a local change",
        "instructions": "Prerequisites: Clean up temporary work.\n\nGoal: Initialize a Git repository only inside the disposable workspace. Configure identity locally, commit a text file and modify one line; inspect status and diff.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Status reports one modified file; diff shows exactly one replacement. No remote is configured and no global Git configuration changes."
      },
      "topics": [
        "git",
        "diff"
      ],
      "prerequisites": [
        "sh-trap"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-git-branch",
        "difficulty": 4,
        "title": "Isolate a local feature",
        "instructions": "Prerequisites: Inspect a local change.\n\nGoal: In the disposable repository create a feature branch, commit a second file, then return to the original branch and merge the feature.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "The feature file is absent before merge and present afterward. git status is clean; log shows the feature commit; no push is used."
      },
      "topics": [
        "git",
        "branches"
      ],
      "prerequisites": [
        "sh-git-review"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-git-conflict",
        "difficulty": 4,
        "title": "Resolve a reproducible conflict",
        "instructions": "Prerequisites: Isolate a local feature.\n\nGoal: From a common local commit make different edits to the same line on two branches. Merge and resolve with a third agreed line.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Merge first reports a conflict. After resolution the file has the agreed text, no conflict markers and a clean status; no reset --hard is needed."
      },
      "topics": [
        "git",
        "conflicts"
      ],
      "prerequisites": [
        "sh-git-branch"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-node-tools",
        "difficulty": 4,
        "title": "Check a local Node project",
        "instructions": "Prerequisites: Resolve a reproducible conflict.\n\nGoal: Use the pinned shell/node-cli fixture after nvm use and pnpm install --frozen-lockfile --ignore-scripts. Run type checking, tests and a package-content preview without publishing.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "Type checks and local tests pass. Preview lists expected package files; explain why a preview differs from publication. Work on a disposable copy if editing."
      },
      "topics": [
        "node",
        "pnpm",
        "typescript"
      ],
      "prerequisites": [
        "sh-git-conflict"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-language-tools",
        "difficulty": 4,
        "title": "Compare language test commands",
        "instructions": "Prerequisites: Check a local Node project.\n\nGoal: Create disposable Rust and Go projects using cargo new and go mod init. Add one passing and one temporarily failing unit test to each.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "cargo test and go test ./... return nonzero for failing assertions and zero after correction. Each fixture stays inside the temporary workspace."
      },
      "topics": [
        "cargo",
        "go",
        "testing"
      ],
      "prerequisites": [
        "sh-node-tools"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-report",
        "difficulty": 5,
        "title": "Build a robust file report",
        "instructions": "Prerequisites: Compare language test commands.\n\nGoal: Write a Bash script accepting a directory and reporting sorted .txt filenames with line counts. Handle spaces, empty folders, missing input and temporary cleanup without eval.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "A fixture with two .txt files and one .log yields only the two sorted .txt rows. Missing directory fails on stderr; an empty folder succeeds with no rows."
      },
      "topics": [
        "bash",
        "pipelines",
        "errors"
      ],
      "prerequisites": [
        "sh-language-tools"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
    {
      "lesson": {
        "id": "sh-quality",
        "difficulty": 5,
        "title": "Build an offline quality gate",
        "instructions": "Prerequisites: Build a robust file report.\n\nGoal: Write a local script running formatting/type/tests for a disposable Node fixture, stopping with a useful diagnostic when a check fails. Restore deliberately invalid edits afterward.\n\nSetup and run: Use Bash in a fresh mktemp -d workspace; quote its path and never work on your real repository. Run scripts with bash and inspect exit status immediately. Tooling exercises use the named locked fixture copies; no remote resources or credentials.\n\nLearning reference: https://www.gnu.org/software/bash/manual/bash.html",
        "starter": "",
        "check": "A valid project exits 0. A syntax error or failing test exits nonzero; no later success message masks it. Never commit, push or publish automatically."
      },
      "topics": [
        "git",
        "tooling",
        "exit-status"
      ],
      "prerequisites": [
        "sh-report"
      ],
      "reference": "https://www.gnu.org/software/bash/manual/bash.html"
    },
  ],
  "rust": [
    {
      "lesson": {
        "id": "rs-match",
        "difficulty": 2,
        "title": "Classify a command",
        "instructions": "Prerequisites: Add only even numbers.\n\nGoal: Define an enum for Start, Stop and Unknown(String). Parse text and use exhaustive matching to return a description.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Test all variants including unknown text; adding a variant requires handling it. No panic on unknown input."
      },
      "topics": [
        "match",
        "enums"
      ],
      "prerequisites": [
        "branches-loops"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-slice",
        "difficulty": 2,
        "title": "Borrow a window",
        "instructions": "Prerequisites: Classify a command.\n\nGoal: Return the middle portion of a slice, excluding its first and last elements, as a borrowed slice. Handle lengths below two explicitly.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "[1,2,3,4] yields [2,3]; lengths 0,1,2 yield an empty slice. The input is still usable and no allocation is necessary."
      },
      "topics": [
        "slices",
        "borrowing"
      ],
      "prerequisites": [
        "rs-match"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-sort",
        "difficulty": 2,
        "title": "Sort ranked records",
        "instructions": "Prerequisites: Borrow a window.\n\nGoal: Define named scores and sort by score descending, then name ascending to break ties. Keep the caller's original records unchanged.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "[(Ben,2),(Ada,2),(Cy,3)] ranks Cy,Ada,Ben. Empty input works; tests assert deterministic tie order."
      },
      "topics": [
        "collections",
        "ordering"
      ],
      "prerequisites": [
        "rs-slice"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-entry",
        "difficulty": 3,
        "title": "Accumulate inventory",
        "instructions": "Prerequisites: Sort ranked records.\n\nGoal: Use HashMap entry operations to add quantities by product name and remove products whose quantity becomes zero. Define rejection of negative final quantities.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Adding 2 then 3 gives 5; subtracting 5 removes the entry. Subtracting from empty inventory returns an error without mutation."
      },
      "topics": [
        "hashmap",
        "entry"
      ],
      "prerequisites": [
        "rs-sort"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-io",
        "difficulty": 3,
        "title": "Read lines with context",
        "instructions": "Prerequisites: Accumulate inventory.\n\nGoal: Read a UTF-8 text file and return numbered nonempty lines. Propagate I/O errors and keep parsing independent from filesystem access.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "A fixture with a blank second line preserves original line numbers. Missing files return errors; temporary fixture files are removed."
      },
      "topics": [
        "files",
        "errors"
      ],
      "prerequisites": [
        "rs-entry"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-serde",
        "difficulty": 3,
        "title": "Validate a JSON record",
        "instructions": "Prerequisites: Read lines with context.\n\nGoal: Use the locked Rust library fixture dependencies to deserialize a named quantity record. Reject a zero quantity in a separate validation step.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Valid JSON round-trips; malformed JSON and quantity 0 produce distinct controlled errors. Tests use local strings only."
      },
      "topics": [
        "serde",
        "json"
      ],
      "prerequisites": [
        "rs-io"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-serde-default",
        "difficulty": 3,
        "title": "Evolve a config format",
        "instructions": "Prerequisites: Validate a JSON record.\n\nGoal: Create a config with a default retry count and a renamed serialized field. Skip a runtime-only secret field when serializing.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Old JSON lacking retries gets the documented default 3. Serialized JSON uses the external field name and never contains the runtime secret."
      },
      "topics": [
        "serde",
        "defaults"
      ],
      "prerequisites": [
        "rs-serde"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-errors",
        "difficulty": 3,
        "title": "Design a library error",
        "instructions": "Prerequisites: Evolve a config format.\n\nGoal: Define a thiserror enum separating read and parse failures with source errors. Return it from a small config reader.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Tests distinguish missing file and invalid number without matching display strings; source() exposes the underlying cause."
      },
      "topics": [
        "thiserror",
        "result"
      ],
      "prerequisites": [
        "rs-serde-default"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-context",
        "difficulty": 3,
        "title": "Explain application errors",
        "instructions": "Prerequisites: Design a library error.\n\nGoal: Wrap the config reader in an anyhow application boundary. Add filename context and return errors rather than panicking.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "A missing config produces a nonzero binary exit and names the file. Successful input prints its parsed value; library errors remain typed."
      },
      "topics": [
        "anyhow",
        "errors"
      ],
      "prerequisites": [
        "rs-errors"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-clap",
        "difficulty": 3,
        "title": "Parse validated options",
        "instructions": "Prerequisites: Explain application errors.\n\nGoal: Build a derive-based CLI with an input path, optional verbose flag and count constrained to 1..=5. Parse test arguments without launching a process.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Missing input and counts 0 or 6 fail parsing; count 3 succeeds. Help contains usage and option descriptions."
      },
      "topics": [
        "clap",
        "cli"
      ],
      "prerequisites": [
        "rs-context"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-regex",
        "difficulty": 3,
        "title": "Extract labelled ids",
        "instructions": "Prerequisites: Parse validated options.\n\nGoal: Compile a regex once to extract ids from text such as id=12 and id=7. Ignore malformed entries and convert captures fallibly.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Text \"id=12 x id=7\" yields [12,7]; empty input yields []. Extremely large captured digits return a controlled conversion failure."
      },
      "topics": [
        "regex",
        "captures"
      ],
      "prerequisites": [
        "rs-clap"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-timeout",
        "difficulty": 4,
        "title": "Bound asynchronous work",
        "instructions": "Prerequisites: Extract labelled ids.\n\nGoal: Use Tokio timeout around a controllable async operation. Test immediate success and a pending operation timing out without external networking.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Fast work returns its value; delayed work returns timeout. Use an immediately ready future and a permanently pending future; bound the timeout locally and never rely on a live server."
      },
      "topics": [
        "tokio",
        "timeout"
      ],
      "prerequisites": [
        "rs-regex"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-channel",
        "difficulty": 4,
        "title": "Drain an async channel",
        "instructions": "Prerequisites: Bound asynchronous work.\n\nGoal: Use a bounded Tokio channel with two producers and one consumer. Drop all sender handles after producing and await the consumer.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "All six sent values are received exactly once; the consumer terminates after senders close. Do not assert arrival order between producers."
      },
      "topics": [
        "tokio",
        "mpsc"
      ],
      "prerequisites": [
        "rs-timeout"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-cancel",
        "difficulty": 4,
        "title": "Cancel a background loop",
        "instructions": "Prerequisites: Drain an async channel.\n\nGoal: Implement a periodic worker selecting between work and a shutdown signal. Await its handle after sending shutdown.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "The worker reports progress before shutdown and exits afterward. A closed shutdown channel also exits; tests do not hang."
      },
      "topics": [
        "tokio",
        "select"
      ],
      "prerequisites": [
        "rs-channel"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-blocking",
        "difficulty": 4,
        "title": "Offload blocking work",
        "instructions": "Prerequisites: Cancel a background loop.\n\nGoal: Use spawn_blocking for a CPU calculation, await the handle and distinguish a join failure from a calculation error.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "A normal calculation returns 21. A deliberately panicking worker is reported as a join error without panicking the caller."
      },
      "topics": [
        "tokio",
        "spawn-blocking"
      ],
      "prerequisites": [
        "rs-cancel"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-http",
        "difficulty": 4,
        "title": "Test a local JSON route",
        "instructions": "Prerequisites: Offload blocking work.\n\nGoal: Using the locked Rust libraries, implement an Axum route returning a JSON item and validate an input field. Test the router locally without an external server.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "A valid request succeeds; an invalid field gets a documented 4xx response. Tests assert status and response JSON rather than only compilation."
      },
      "topics": [
        "axum",
        "http"
      ],
      "prerequisites": [
        "rs-blocking"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-client",
        "difficulty": 4,
        "title": "Handle HTTP status failures",
        "instructions": "Prerequisites: Test a local JSON route.\n\nGoal: Write a Reqwest client helper against a loopback-only test server. Set a request timeout and reject error status before decoding JSON.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Tests cover 200 JSON, 500 status and invalid JSON. Stop the server and keep all requests on loopback."
      },
      "topics": [
        "reqwest",
        "http"
      ],
      "prerequisites": [
        "rs-http"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-tracing",
        "difficulty": 4,
        "title": "Trace a report operation",
        "instructions": "Prerequisites: Handle HTTP status failures.\n\nGoal: Instrument a report operation with a request id and elapsed/result fields. Avoid logging raw credentials or full input payloads.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "A captured local subscriber records the request id and outcome. Success and failure both produce useful structured events."
      },
      "topics": [
        "tracing",
        "logging"
      ],
      "prerequisites": [
        "rs-client"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-rand",
        "difficulty": 4,
        "title": "Make random tests repeatable",
        "instructions": "Prerequisites: Trace a report operation.\n\nGoal: Use the pinned rand API to shuffle an owned collection with a seeded generator. Check permutation properties rather than memorizing one shuffle.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Two freshly seeded generators with the same seed produce identical results; sorted shuffled values equal sorted inputs; empty input works."
      },
      "topics": [
        "rand",
        "testing"
      ],
      "prerequisites": [
        "rs-tracing"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-toml",
        "difficulty": 4,
        "title": "Summarize structured config",
        "instructions": "Prerequisites: Make random tests repeatable.\n\nGoal: Read named quantities from a TOML array of tables using serde records. Sum valid entries and report invalid quantities.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Two entries of 2 and 3 total 5; missing required fields and invalid numbers fail. Tests include quoted names containing spaces."
      },
      "topics": [
        "toml",
        "serde"
      ],
      "prerequisites": [
        "rs-rand"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-config-capstone",
        "difficulty": 5,
        "title": "Build a validated config CLI",
        "instructions": "Prerequisites: Summarize structured config.\n\nGoal: Combine a clap path option, serde config parsing and typed validation errors in a library/binary. Define retries 1..=5 and sorted enabled names.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Tests cover defaults, malformed JSON, invalid retries and missing files. Binary exits nonzero on failure and never prints secrets."
      },
      "topics": [
        "clap",
        "serde",
        "thiserror"
      ],
      "prerequisites": [
        "rs-toml"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-worker-capstone",
        "difficulty": 5,
        "title": "Build a bounded async report",
        "instructions": "Prerequisites: Build a validated config CLI.\n\nGoal: Combine bounded channels, two worker tasks and shutdown to transform six numbered jobs. Preserve output order by job id rather than completion time.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Each id appears once in sorted output; cancellation exits every task; producer errors reach the caller. Test channel closure and empty input."
      },
      "topics": [
        "tokio",
        "channels",
        "cancellation"
      ],
      "prerequisites": [
        "rs-config-capstone"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-api-capstone",
        "difficulty": 5,
        "title": "Build a tested in-memory API",
        "instructions": "Prerequisites: Build a bounded async report.\n\nGoal: Create JSON POST/GET endpoints for uniquely named items using in-memory state. Reject duplicates and invalid quantities; expose no external database.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Local request tests verify creation, retrieval, 404, duplicate 409 and invalid 4xx responses. Tests use isolated state and cannot depend on order."
      },
      "topics": [
        "axum",
        "serde",
        "testing"
      ],
      "prerequisites": [
        "rs-worker-capstone"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
    {
      "lesson": {
        "id": "rs-report-capstone",
        "difficulty": 5,
        "title": "Extend a CLI with structured input",
        "instructions": "Prerequisites: Build a tested in-memory API.\n\nGoal: Extend the existing word-report skills into a TOML inventory report with explicit sort order and validated quantities. Keep parsing, aggregation and formatting separate.\n\nSetup and run: Use a disposable Cargo project; for libraries use the locked manifest/versions from test/fixtures/rust-libraries/Cargo.toml and Cargo.lock (documented in docs/rust-coverage.md). Run cargo test and cargo run; enable only the fixture features needed by the task.\n\nLearning reference: https://doc.rust-lang.org/book/",
        "starter": "",
        "check": "Duplicate product rows combine; ties sort by name; malformed input reports parse context and a nonzero exit. Unit and binary integration tests pass."
      },
      "topics": [
        "toml",
        "clap",
        "errors"
      ],
      "prerequisites": [
        "rs-api-capstone"
      ],
      "reference": "https://doc.rust-lang.org/book/"
    },
  ],
  "go": [
    {
      "lesson": {
        "id": "go-map-update",
        "difficulty": 2,
        "title": "Maintain inventory counts",
        "instructions": "Prerequisites: Add only even numbers.\n\nGoal: Write an inventory updater accepting product and quantity delta. Reject a negative final count and delete entries reaching zero.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Adding 2 then 3 yields 5; subtracting 5 removes the key. Rejected updates leave the original map unchanged."
      },
      "topics": [
        "maps",
        "values"
      ],
      "prerequisites": [
        "branches-loops"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-copy",
        "difficulty": 2,
        "title": "Copy a slice safely",
        "instructions": "Prerequisites: Maintain inventory counts.\n\nGoal: Return an independently owned copy of a slice and prove mutation of the copy does not change the original.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Changing element 0 of a nonempty copy leaves the source unchanged. Empty input returns length 0 without panic."
      },
      "topics": [
        "slices",
        "aliasing"
      ],
      "prerequisites": [
        "go-map-update"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-defer",
        "difficulty": 2,
        "title": "Close a resource",
        "instructions": "Prerequisites: Copy a slice safely.\n\nGoal: Open a temporary text file, read it, and close it on every successful-open path using defer. Keep fixture creation and cleanup in tests.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Contents match exactly; a missing file returns an error. Tests clean their temporary directory with t.TempDir."
      },
      "topics": [
        "defer",
        "files"
      ],
      "prerequisites": [
        "go-copy"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-wrap",
        "difficulty": 3,
        "title": "Keep the original error",
        "instructions": "Prerequisites: Close a resource.\n\nGoal: Return wrapped filesystem errors with operation context using %w. Detect missing files with errors.Is.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Missing file is recognized through the wrapper. An unrelated custom error is not mistaken for a missing file; no string matching."
      },
      "topics": [
        "errors",
        "wrapping"
      ],
      "prerequisites": [
        "go-defer"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-json",
        "difficulty": 3,
        "title": "Validate a decoded record",
        "instructions": "Prerequisites: Keep the original error.\n\nGoal: Decode a JSON quantity record, reject unknown fields with a Decoder and reject a second JSON value. Validate positive quantities separately.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Valid input succeeds; unknown keys, trailing objects, malformed JSON and zero quantity fail. Tests verify each failure path."
      },
      "topics": [
        "json",
        "validation"
      ],
      "prerequisites": [
        "go-wrap"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-files",
        "difficulty": 3,
        "title": "Report numbered lines",
        "instructions": "Prerequisites: Validate a decoded record.\n\nGoal: Read nonempty lines with original line numbers through an io.Reader. Handle Scanner errors and document its line-size limit.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Blank lines preserve numbering; empty input returns no rows. An oversized token fails explicitly rather than returning a truncated success."
      },
      "topics": [
        "files",
        "scanner"
      ],
      "prerequisites": [
        "go-json"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-sort",
        "difficulty": 3,
        "title": "Sort a deterministic report",
        "instructions": "Prerequisites: Report numbered lines.\n\nGoal: Convert name counts into rows sorted by count descending and name ascending. Do not rely on map iteration order.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "For Ada=2,Ben=2,Cy=3 output is Cy,Ada,Ben on repeated runs. Empty maps yield no rows."
      },
      "topics": [
        "sort",
        "maps"
      ],
      "prerequisites": [
        "go-files"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-reader",
        "difficulty": 3,
        "title": "Inject an input source",
        "instructions": "Prerequisites: Sort a deterministic report.\n\nGoal: Write a parser accepting io.Reader rather than a filename. Use strings.NewReader and a custom failing reader in tests.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Valid input parses without filesystem access; a reader error is returned. The parser does not close a reader it does not own."
      },
      "topics": [
        "interfaces",
        "io"
      ],
      "prerequisites": [
        "go-sort"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-fuzz",
        "difficulty": 3,
        "title": "Probe a parser invariant",
        "instructions": "Prerequisites: Inject an input source.\n\nGoal: Write a parser for comma-separated positive integers and a Go fuzz test checking it never panics. Add ordinary examples for invalid values.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Regular tests accept \"1,2\" and reject \"1,x\" and \"0\". Run a short fuzz session; failures save reproducible inputs."
      },
      "topics": [
        "testing",
        "fuzz"
      ],
      "prerequisites": [
        "go-reader"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-json-output",
        "difficulty": 3,
        "title": "Encode an HTTP response",
        "instructions": "Prerequisites: Probe a parser invariant.\n\nGoal: Implement a net/http handler returning a JSON item with Content-Type application/json. Test it with httptest.ResponseRecorder.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "GET returns 200 and decoded expected data; unsupported methods return 405. Assert headers before decoding the body."
      },
      "topics": [
        "http",
        "json"
      ],
      "prerequisites": [
        "go-fuzz"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-http-input",
        "difficulty": 3,
        "title": "Reject invalid requests",
        "instructions": "Prerequisites: Encode an HTTP response.\n\nGoal: Implement a POST handler with a bounded request body and JSON validation. Reject unknown fields and an empty name.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "httptest cases cover valid 201, wrong method 405, invalid 400 and oversized body 413. Do not start a production listener."
      },
      "topics": [
        "http",
        "json"
      ],
      "prerequisites": [
        "go-json-output"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-subtests",
        "difficulty": 4,
        "title": "Test isolated handler cases",
        "instructions": "Prerequisites: Reject invalid requests.\n\nGoal: Use table-driven request tests with a fresh handler state per subtest. Include create, duplicate and lookup behavior.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Tests pass independently and in repeated/shuffled runs. A duplicate gives 409; missing lookup gives 404."
      },
      "topics": [
        "httptest",
        "testing"
      ],
      "prerequisites": [
        "go-http-input"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-context",
        "difficulty": 4,
        "title": "Respect cancellation",
        "instructions": "Prerequisites: Test isolated handler cases.\n\nGoal: Write a worker selecting between an input channel and ctx.Done. Define cancellation as abandoning queued work and returning ctx.Err.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "A pre-cancelled context exits; normal closed input succeeds. No goroutine waits forever after cancellation."
      },
      "topics": [
        "context",
        "select"
      ],
      "prerequisites": [
        "go-subtests"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-deadline",
        "difficulty": 4,
        "title": "Propagate a client deadline",
        "instructions": "Prerequisites: Respect cancellation.\n\nGoal: Use an httptest server and an HTTP client request built with context. Cancel a slow request and close the response body on successful paths.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Fast response succeeds; pre-cancelled request returns an error recognized as cancellation. Tests use synchronization instead of arbitrary sleeps."
      },
      "topics": [
        "http",
        "context"
      ],
      "prerequisites": [
        "go-context"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-channel-close",
        "difficulty": 4,
        "title": "Own channel closure",
        "instructions": "Prerequisites: Propagate a client deadline.\n\nGoal: Launch multiple producers and close their shared result channel only after all producers complete. Collect through range.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Six values arrive exactly once and the range terminates. go test -race ./... passes; no producer closes the shared channel itself."
      },
      "topics": [
        "channels",
        "waitgroup"
      ],
      "prerequisites": [
        "go-deadline"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-bounded",
        "difficulty": 4,
        "title": "Limit concurrent work",
        "instructions": "Prerequisites: Own channel closure.\n\nGoal: Build a worker pool with at most two active jobs. Instrument peak activity in tests using synchronized counters.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Six jobs complete once each and peak active work never exceeds two. Empty input terminates and race detection is clean."
      },
      "topics": [
        "goroutines",
        "channels"
      ],
      "prerequisites": [
        "go-channel-close"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-mutex",
        "difficulty": 4,
        "title": "Protect shared state",
        "instructions": "Prerequisites: Limit concurrent work.\n\nGoal: Build a count store with synchronized increment and snapshot operations. Return a copied map from snapshot.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "100 concurrent increments produce 100; modifying a returned snapshot cannot mutate the store. Race detection passes."
      },
      "topics": [
        "mutex",
        "maps"
      ],
      "prerequisites": [
        "go-bounded"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-slog",
        "difficulty": 4,
        "title": "Capture structured events",
        "instructions": "Prerequisites: Protect shared state.\n\nGoal: Accept an injected slog.Logger in a report function. Log operation, id and outcome without logging raw data.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Capture JSON logs in a buffer and decode them. Success/error records contain the expected fields and omit a supplied secret value."
      },
      "topics": [
        "slog",
        "logging"
      ],
      "prerequisites": [
        "go-mutex"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-errors-as",
        "difficulty": 4,
        "title": "Classify typed failures",
        "instructions": "Prerequisites: Capture structured events.\n\nGoal: Define a validation error carrying a field name. Wrap it at a service boundary and use errors.As at the caller.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Invalid quantity reports field quantity after wrapping. An ordinary I/O error does not match the validation type."
      },
      "topics": [
        "errors",
        "types"
      ],
      "prerequisites": [
        "go-slog"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-sql",
        "difficulty": 4,
        "title": "Bind a local database lookup",
        "instructions": "Prerequisites: Classify typed failures.\n\nGoal: Use the SQL playground's pinned Go client fixture to query a seeded database by a bound name parameter. Use context and close rows/client resources.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Ada matches expected data; a quote-containing name is treated as data. Test missing rows and query failure using the documented local database."
      },
      "topics": [
        "database-sql",
        "parameters"
      ],
      "prerequisites": [
        "go-errors-as"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-service-capstone",
        "difficulty": 5,
        "title": "Build a local JSON service",
        "instructions": "Prerequisites: Bind a local database lookup.\n\nGoal: Combine validated create/list handlers with synchronized in-memory state and deterministic ordering. Inject storage rather than using globals.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "httptest covers 201, 400, 409 and sorted list output. go test -race ./... passes without an external service."
      },
      "topics": [
        "http",
        "json",
        "testing"
      ],
      "prerequisites": [
        "go-sql"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-pipeline-capstone",
        "difficulty": 5,
        "title": "Build a cancellable pipeline",
        "instructions": "Prerequisites: Build a local JSON service.\n\nGoal: Build read/transform/collect stages with bounded channels and propagated cancellation. Give channel closure to the sending stage.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "An injected read failure cancels all stages; empty input succeeds. Tests wait for completion with a bounded deadline and pass race detection."
      },
      "topics": [
        "context",
        "channels",
        "errors"
      ],
      "prerequisites": [
        "go-service-capstone"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-config-capstone",
        "difficulty": 5,
        "title": "Build a strict config command",
        "instructions": "Prerequisites: Build a cancellable pipeline.\n\nGoal: Build a library plus cmd/config binary reading a strict JSON config. Validate required names and positive quantities, then print a sorted summary.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "Unit tests cover unknown keys and trailing JSON. CLI tests verify missing files fail with nonzero exit; valid input gives deterministic output."
      },
      "topics": [
        "json",
        "errors",
        "cli"
      ],
      "prerequisites": [
        "go-pipeline-capstone"
      ],
      "reference": "https://go.dev/doc/"
    },
    {
      "lesson": {
        "id": "go-benchmark-capstone",
        "difficulty": 5,
        "title": "Measure a report safely",
        "instructions": "Prerequisites: Build a strict config command.\n\nGoal: Add benchmarks for the deterministic report using small and large fixed datasets. Compare a proposed optimization without changing output or sharing mutable test state.\n\nSetup and run: Use a disposable Go module (Go 1.22+); keep functions in a library package and tests in *_test.go. Run go test -race ./... and go vet ./...; use the locked SQL fixture only for the database task.\n\nLearning reference: https://go.dev/doc/",
        "starter": "",
        "check": "go test -race ./... passes; go test -bench . -benchmem reports both sizes. Explain allocation/time observations without asserting a machine-specific speedup."
      },
      "topics": [
        "testing",
        "benchmarks"
      ],
      "prerequisites": [
        "go-config-capstone"
      ],
      "reference": "https://go.dev/doc/"
    },
  ],
  "javascript": [
    {
      "lesson": {
        "id": "js-values",
        "difficulty": 1,
        "title": "Keep numeric scores numeric",
        "instructions": "Prerequisites: none; start here.\n\nGoal: Read a score from a string and explicitly convert it to a finite number before adding 3. Reject blank or nonnumeric input.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "\"2\" produces 5 rather than \"23\"; blank, \"x\" and Infinity fail validation. Use strict equality in assertions."
      },
      "topics": [
        "values",
        "coercion"
      ],
      "prerequisites": [],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-functions",
        "difficulty": 1,
        "title": "Return an independent filtered list",
        "instructions": "Prerequisites: Keep numeric scores numeric.\n\nGoal: Return positive numbers from an input array without changing the input. Import the function from a separate ES module.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "[-2,0,3,5] yields [3,5]; empty input yields []. Mutating the result does not change the original array."
      },
      "topics": [
        "arrays",
        "functions"
      ],
      "prerequisites": [
        "js-values"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-objects",
        "difficulty": 2,
        "title": "Update a nested record",
        "instructions": "Prerequisites: Return an independent filtered list.\n\nGoal: Produce a new user record with an incremented nested visits counter. Preserve unrelated properties and leave the original unchanged.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "New visits increase by one; the old nested record stays unchanged. Assert identities for the copied outer and modified inner objects."
      },
      "topics": [
        "objects",
        "destructuring"
      ],
      "prerequisites": [
        "js-functions"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-closures",
        "difficulty": 2,
        "title": "Create independent counters",
        "instructions": "Prerequisites: Update a nested record.\n\nGoal: Write a counter factory returning increment and read operations. Create two counters with different initial values.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Incrementing the first twice never changes the second. Reads preserve the current value without incrementing it."
      },
      "topics": [
        "closures",
        "state"
      ],
      "prerequisites": [
        "js-objects"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-map",
        "difficulty": 2,
        "title": "Group records by category",
        "instructions": "Prerequisites: Create independent counters.\n\nGoal: Group purchase amounts with a Map and produce sorted category totals. Decide how invalid amounts are rejected.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Book amounts 3 and 4 total 7; food 2 totals 2. Empty input works; NaN is rejected and input stays unchanged."
      },
      "topics": [
        "maps",
        "collections"
      ],
      "prerequisites": [
        "js-closures"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-promises",
        "difficulty": 3,
        "title": "Handle an async failure",
        "instructions": "Prerequisites: Group records by category.\n\nGoal: Write an async JSON loader using injected fetch. Check status and distinguish invalid JSON from a rejected request.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Tests cover success, 500 status, malformed JSON and rejected fetch with no real network access. All promises are awaited."
      },
      "topics": [
        "async",
        "errors"
      ],
      "prerequisites": [
        "js-map"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-dom",
        "difficulty": 3,
        "title": "Submit an accessible form",
        "instructions": "Prerequisites: Handle an async failure.\n\nGoal: Create a labelled input and submit button. Handle submit without navigation and show trimmed text in a status element using textContent.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Keyboard and button submission both work. Input containing HTML is displayed literally and does not create new elements."
      },
      "topics": [
        "dom",
        "events"
      ],
      "prerequisites": [
        "js-promises"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-files",
        "difficulty": 3,
        "title": "Summarize a local file",
        "instructions": "Prerequisites: Submit an accessible form.\n\nGoal: Use node:fs/promises to read a temporary UTF-8 file and count nonempty lines. Propagate read failures and clean the fixture after tests.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "A three-line file with one blank line reports 2. Missing file rejects; no file remains outside the temporary directory."
      },
      "topics": [
        "node",
        "files"
      ],
      "prerequisites": [
        "js-dom"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-jsx",
        "difficulty": 3,
        "title": "Build a JSX counter",
        "instructions": "Prerequisites: Summarize a local file.\n\nGoal: Build a plain JavaScript React counter with an accessible increment button and configurable initial value. Test with Testing Library.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Initial 2 becomes 3 after one click; two independent instances do not share state. No TypeScript syntax appears in the JSX."
      },
      "topics": [
        "react",
        "jsx",
        "state"
      ],
      "prerequisites": [
        "js-files"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-cancel",
        "difficulty": 4,
        "title": "Prevent stale fetch results",
        "instructions": "Prerequisites: Build a JSX counter.\n\nGoal: Build a search loader that aborts the previous request and ignores any stale completion. Inject delayed responses for deterministic tests.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Request B wins even when A resolves later; abort does not show an error banner. Unmount or dispose cancels pending work."
      },
      "topics": [
        "fetch",
        "abort",
        "async"
      ],
      "prerequisites": [
        "js-jsx"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-effect",
        "difficulty": 4,
        "title": "Release a React subscription",
        "instructions": "Prerequisites: Prevent stale fetch results.\n\nGoal: Subscribe to a supplied event source in an effect and remove the subscription when the source changes or the component unmounts.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "A new source replaces the old listener. Unmount leaves no listeners and later emissions do not update the UI; exercise StrictMode."
      },
      "topics": [
        "react",
        "effects",
        "cleanup"
      ],
      "prerequisites": [
        "js-cancel"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-express",
        "difficulty": 4,
        "title": "Test an Express JSON endpoint",
        "instructions": "Prerequisites: Release a React subscription.\n\nGoal: Implement local POST /items with a nonempty name requirement and in-memory storage. Add request tests and close the listener afterward.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Valid request returns 201; empty name and malformed JSON return 400. Test state does not leak between cases."
      },
      "topics": [
        "express",
        "http",
        "validation"
      ],
      "prerequisites": [
        "js-effect"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-tests",
        "difficulty": 4,
        "title": "Test observable UI behavior",
        "instructions": "Prerequisites: Test an Express JSON endpoint.\n\nGoal: Test a JSX task list using user-event: add a task, complete it and remove it. Locate controls by accessible role/name.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "A blank title adds nothing; completion changes displayed state; removal removes the row. Tests assert behavior without inspecting React internals."
      },
      "topics": [
        "testing-library",
        "vitest"
      ],
      "prerequisites": [
        "js-express"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-board-capstone",
        "difficulty": 5,
        "title": "Build a local task board",
        "instructions": "Prerequisites: Test observable UI behavior.\n\nGoal: Combine independently identified tasks, filters, controlled inputs and local persistence. Validate restored data before rendering and handle invalid storage.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Browser tests reload a saved board, filter completed tasks and recover from corrupted JSON. Render stored text literally and preserve stable ids."
      },
      "topics": [
        "react",
        "modules",
        "testing"
      ],
      "prerequisites": [
        "js-tests"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
      "lesson": {
        "id": "js-api-capstone",
        "difficulty": 5,
        "title": "Build a cancellable API client UI",
        "instructions": "Prerequisites: Build a local task board.\n\nGoal: Connect a JSX search UI to a loopback Express API with in-memory records. Add loading, failure and empty-result states plus cancellation cleanup.\n\nSetup and run: Use a disposable copy of playground/lessons with its frozen pnpm lock. Run nvm use and pnpm install --frozen-lockfile --ignore-scripts; add .js/.jsx exercises and lesson.test.jsx tests at its root. Use node for ES modules and pnpm exec vitest run for component tests.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "starter": "",
        "check": "Request tests validate the API; browser/component tests cover a slow stale response, retry after failure and unmount. Stop all local servers."
      },
      "topics": [
        "express",
        "react",
        "fetch"
      ],
      "prerequisites": [
        "js-board-capstone"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
  ],
  "html": [
    {
      "lesson": {
        "id": "html-document",
        "difficulty": 1,
        "title": "Create a meaningful document",
        "instructions": "Prerequisites: none; start here.\n\nGoal: Create a standalone HTML document with language, charset, title, one main heading and a main landmark. Open it through the web playground.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Browser title is meaningful; accessibility inspection finds one main landmark and a logical heading. The document renders without script."
      },
      "topics": [
        "document",
        "semantics"
      ],
      "prerequisites": [],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-links",
        "difficulty": 1,
        "title": "Navigate within a page",
        "instructions": "Prerequisites: Create a meaningful document.\n\nGoal: Create three sections with unique ids and a navigation list linking to them. Give link text meaning outside surrounding prose.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Each link moves to its target; ids are unique and no link is empty. All links can be reached by keyboard."
      },
      "topics": [
        "links",
        "ids"
      ],
      "prerequisites": [
        "html-document"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-image",
        "difficulty": 2,
        "title": "Describe an informative image",
        "instructions": "Prerequisites: Navigate within a page.\n\nGoal: Use the local seedling image with useful alternative text. Add a separate decorative image with an empty alt and specify dimensions.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Disable images and verify the informative meaning remains. Decorative image is absent from the accessibility tree; layout reserves image space."
      },
      "topics": [
        "images",
        "accessibility"
      ],
      "prerequisites": [
        "html-links"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-table",
        "difficulty": 2,
        "title": "Label tabular data",
        "instructions": "Prerequisites: Describe an informative image.\n\nGoal: Create a small inventory table with a caption, column headers and three rows. Associate headers using native table semantics.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Screen-reader/accessibility inspection associates names and quantities with headers. The caption states what the table measures."
      },
      "topics": [
        "tables",
        "semantics"
      ],
      "prerequisites": [
        "html-image"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-form",
        "difficulty": 3,
        "title": "Build a labelled registration form",
        "instructions": "Prerequisites: Label tabular data.\n\nGoal: Create name/email inputs with explicit labels, required constraints and suitable autocomplete values. Include a submit button and instructions.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Clicking labels focuses inputs. Empty/invalid email fails browser validity; valid values pass. Keyboard order follows reading order."
      },
      "topics": [
        "forms",
        "validation"
      ],
      "prerequisites": [
        "html-table"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-groups",
        "difficulty": 3,
        "title": "Group related choices",
        "instructions": "Prerequisites: Build a labelled registration form.\n\nGoal: Add a named radio group with fieldset/legend and labelled choices to a local form. Include a separate checkbox for an independent preference.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Arrow keys move within the radio group; exactly one radio can be checked. The checkbox remains independent and labels have accessible names."
      },
      "topics": [
        "forms",
        "fieldset"
      ],
      "prerequisites": [
        "html-form"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-details",
        "difficulty": 4,
        "title": "Make a native disclosure",
        "instructions": "Prerequisites: Group related choices.\n\nGoal: Create an FAQ using native details/summary and meaningful headings. Keep content usable with JavaScript disabled.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Enter/Space toggles each summary by keyboard; expanded content is readable. No custom click handler or redundant role is required."
      },
      "topics": [
        "details",
        "keyboard"
      ],
      "prerequisites": [
        "html-groups"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-dialog",
        "difficulty": 4,
        "title": "Provide a labelled modal",
        "instructions": "Prerequisites: Make a native disclosure.\n\nGoal: Create a dialog with an accessible name, close button and a native form method=dialog. Add a small external script to open it and restore focus.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Opening moves focus inside; Escape and close both work; focus returns to the opener. Background controls are unavailable while modal."
      },
      "topics": [
        "dialog",
        "forms"
      ],
      "prerequisites": [
        "html-details"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-capstone",
        "difficulty": 5,
        "title": "Build a semantic event page",
        "instructions": "Prerequisites: Provide a labelled modal.\n\nGoal: Combine navigation, headings, schedule table and a labelled sign-up form into a standalone event page. Use local assets and no framework.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Complete a keyboard walkthrough and inspect landmarks, heading order, names and validity. All local links work; no horizontal scroll at 320px."
      },
      "topics": [
        "semantics",
        "forms",
        "accessibility"
      ],
      "prerequisites": [
        "html-dialog"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
    {
      "lesson": {
        "id": "html-progressive",
        "difficulty": 5,
        "title": "Build a progressively enhanced form",
        "instructions": "Prerequisites: Build a semantic event page.\n\nGoal: Create a native validated local form plus an external script showing a confirmation in a status region. Keep all controls meaningful without script; do not send personal data anywhere.\n\nSetup and run: Use a disposable copy of playground/web; run its documented local preview server and open your standalone HTML in a browser. Validate with browser accessibility/computed-style panels and keyboard checks; keep all resources local.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content",
        "starter": "",
        "check": "Without script, fields still validate; with script, submit stays local and confirmation is announced. User text is inserted as text, not markup."
      },
      "topics": [
        "forms",
        "progressive-enhancement"
      ],
      "prerequisites": [
        "html-capstone"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"
    },
  ],
  "css": [
    {
      "lesson": {
        "id": "css-selectors",
        "difficulty": 1,
        "title": "Style a small reading page",
        "instructions": "Prerequisites: none; start here.\n\nGoal: Create a standalone stylesheet for headings, body text and links in the web playground. Use a class for one highlighted paragraph.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Only the chosen paragraph receives the class style. Browser computed styles identify the winning rule; links remain recognizable."
      },
      "topics": [
        "selectors",
        "cascade"
      ],
      "prerequisites": [],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-box",
        "difficulty": 1,
        "title": "Measure a card",
        "instructions": "Prerequisites: Style a small reading page.\n\nGoal: Make a card with width 240px, padding 16px and border 2px using border-box. Compare it with content-box in developer tools.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Border-box outer width is 240px; content-box outer width is 276px. Explain the arithmetic using the rendered box model."
      },
      "topics": [
        "box-model",
        "sizing"
      ],
      "prerequisites": [
        "css-selectors"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-flow",
        "difficulty": 2,
        "title": "Arrange a toolbar with flex",
        "instructions": "Prerequisites: Measure a card.\n\nGoal: Use flexbox with gap to lay out a label and two buttons. Allow wrapping on narrow screens without fixed positioning.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "At 320px all controls remain visible without horizontal overflow. At a wider size the toolbar uses one row when it fits."
      },
      "topics": [
        "flex",
        "gap"
      ],
      "prerequisites": [
        "css-box"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-grid",
        "difficulty": 2,
        "title": "Lay out a card gallery",
        "instructions": "Prerequisites: Arrange a toolbar with flex.\n\nGoal: Build an auto-fitting grid of local content cards with a reasonable minimum width. Avoid a minimum wider than the viewport.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "At 320px the gallery has one column and no overflow; a wide viewport fits multiple equal-width columns. Source reading order stays meaningful."
      },
      "topics": [
        "grid",
        "responsive"
      ],
      "prerequisites": [
        "css-flow"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-custom",
        "difficulty": 3,
        "title": "Theme with custom properties",
        "instructions": "Prerequisites: Lay out a card gallery.\n\nGoal: Define shared color/spacing tokens on the root and override them for a themed section. Use tokens in three component rules.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Changing one spacing token updates all components. The section override affects descendants only; text contrast remains readable."
      },
      "topics": [
        "custom-properties",
        "cascade"
      ],
      "prerequisites": [
        "css-grid"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-focus",
        "difficulty": 3,
        "title": "Make keyboard focus visible",
        "instructions": "Prerequisites: Theme with custom properties.\n\nGoal: Style links, inputs and buttons with focus-visible indicators while keeping hover distinct. Do not remove focus without a replacement.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Tab through the page: every interactive control has a visible focus cue at normal and zoomed sizes. Mouse hover does not hide keyboard focus."
      },
      "topics": [
        "focus",
        "accessibility"
      ],
      "prerequisites": [
        "css-custom"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-breakpoints",
        "difficulty": 4,
        "title": "Adapt navigation to space",
        "instructions": "Prerequisites: Make keyboard focus visible.\n\nGoal: Build navigation that wraps or stacks at a content-driven breakpoint. Keep all links available with no script or hidden essential content.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "At 320, 768 and 1280px links remain visible, ordered and usable. At 200 percent zoom no link overlaps another."
      },
      "topics": [
        "media-queries",
        "responsive"
      ],
      "prerequisites": [
        "css-focus"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-motion",
        "difficulty": 4,
        "title": "Respect reduced motion",
        "instructions": "Prerequisites: Adapt navigation to space.\n\nGoal: Add a small nonessential transition to a card and provide a prefers-reduced-motion variant. Avoid continuously moving content.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Browser emulation of reduced motion removes or minimizes the transition. Content and interaction remain understandable in both modes."
      },
      "topics": [
        "media-queries",
        "animation"
      ],
      "prerequisites": [
        "css-breakpoints"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-capstone",
        "difficulty": 5,
        "title": "Build a responsive report layout",
        "instructions": "Prerequisites: Respect reduced motion.\n\nGoal: Combine grid page regions, flex toolbars, custom properties and readable tables in a standalone report page. Put wide table overflow in its own labelled container.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "At 320px the page itself does not scroll horizontally; wide table content can scroll locally. Keyboard focus stays visible and headings retain order."
      },
      "topics": [
        "grid",
        "flex",
        "responsive"
      ],
      "prerequisites": [
        "css-motion"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
    {
      "lesson": {
        "id": "css-libraries",
        "difficulty": 5,
        "title": "Compare native and library styling",
        "instructions": "Prerequisites: Build a responsive report layout.\n\nGoal: Create separate local pages using the pinned Tailwind and Bootstrap fixtures. Build the same simple card layout, then add one scoped override per page.\n\nSetup and run: Use a disposable copy of playground/web; open a standalone HTML page linking your exercise stylesheet through the documented local preview server. Inspect computed styles and test 320/768/1280px plus keyboard focus; library work uses its frozen pnpm lock.\n\nLearning reference: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics",
        "starter": "",
        "check": "Both pages work at narrow/wide widths. Developer tools show which utilities/component styles win; neither page loads the other framework or changes global unrelated cards."
      },
      "topics": [
        "tailwind",
        "bootstrap",
        "cascade"
      ],
      "prerequisites": [
        "css-capstone"
      ],
      "reference": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"
    },
  ],
  "sql": [
    {
      "lesson": {
        "id": "sql-null",
        "difficulty": 2,
        "title": "Count known values accurately",
        "instructions": "Prerequisites: List customer names.\n\nGoal: Using the seeded SQL playground, compare COUNT(*) and COUNT(email) after temporarily adding a customer with NULL email in a transaction. Roll back afterward.\n\nSetup and run: Use playground/sql seeded disposable SQLite/PostgreSQL databases and the README commands. Run both dialects where requested; perform mutations inside rolled-back transactions. Use dialect-appropriate syntax, never a production database.\n\nLearning reference: https://www.postgresql.org/docs/current/tutorial.html",
        "starter": "",
        "check": "The row count increases by one while the non-NULL email count does not. IS NULL finds the added row; = NULL does not. Seed data is restored."
      },
      "topics": [
        "NULL",
        "aggregates"
      ],
      "prerequisites": [
        "sql-first-report"
      ],
      "reference": "https://www.postgresql.org/docs/current/tutorial.html"
    },
    {
      "lesson": {
        "id": "sql-join-cardinality",
        "difficulty": 3,
        "title": "Explain duplicated join rows",
        "instructions": "Prerequisites: Count known values accurately.\n\nGoal: Join seeded customers to orders, then compare row counts with distinct customer counts. Find customers with multiple orders.\n\nSetup and run: Use playground/sql seeded disposable SQLite/PostgreSQL databases and the README commands. Run both dialects where requested; perform mutations inside rolled-back transactions. Use dialect-appropriate syntax, never a production database.\n\nLearning reference: https://www.postgresql.org/docs/current/tutorial.html",
        "starter": "",
        "check": "Ada appears once per related order before grouping. The grouped result has one row per customer; a left join keeps Dee even without orders."
      },
      "topics": [
        "joins",
        "aggregation"
      ],
      "prerequisites": [
        "sql-null"
      ],
      "reference": "https://www.postgresql.org/docs/current/tutorial.html"
    },
    {
      "lesson": {
        "id": "sql-constraints",
        "difficulty": 4,
        "title": "Test a unique key",
        "instructions": "Prerequisites: Explain duplicated join rows.\n\nGoal: In a disposable transaction, attempt a duplicate customer primary key and recover using a savepoint. Verify the original row remains.\n\nSetup and run: Use playground/sql seeded disposable SQLite/PostgreSQL databases and the README commands. Run both dialects where requested; perform mutations inside rolled-back transactions. Use dialect-appropriate syntax, never a production database.\n\nLearning reference: https://www.postgresql.org/docs/current/tutorial.html",
        "starter": "",
        "check": "Duplicate insertion fails on both engines; after rollback to savepoint the original name remains Ada and a query succeeds. Roll back the outer transaction."
      },
      "topics": [
        "constraints",
        "transactions"
      ],
      "prerequisites": [
        "sql-join-cardinality"
      ],
      "reference": "https://www.postgresql.org/docs/current/tutorial.html"
    },
    {
      "lesson": {
        "id": "sql-index-plan",
        "difficulty": 4,
        "title": "Inspect a query plan",
        "instructions": "Prerequisites: Test a unique key.\n\nGoal: Create an index in a disposable database copy and inspect the plan for an equality lookup before/after. Use EXPLAIN QUERY PLAN in SQLite and EXPLAIN in PostgreSQL.\n\nSetup and run: Use playground/sql seeded disposable SQLite/PostgreSQL databases and the README commands. Run both dialects where requested; perform mutations inside rolled-back transactions. Use dialect-appropriate syntax, never a production database.\n\nLearning reference: https://www.postgresql.org/docs/current/tutorial.html",
        "starter": "",
        "check": "Both queries return identical rows. Explain why a tiny table may still use a sequential scan; do not require an index scan as a correctness condition."
      },
      "topics": [
        "indexes",
        "query-plan"
      ],
      "prerequisites": [
        "sql-constraints"
      ],
      "reference": "https://www.postgresql.org/docs/current/tutorial.html"
    },
    {
      "lesson": {
        "id": "sql-report-capstone",
        "difficulty": 5,
        "title": "Build a reconciled sales report",
        "instructions": "Prerequisites: Inspect a query plan.\n\nGoal: Combine paid totals, customers without orders and deterministic ranking in a report over seeded data. Keep one row per customer and validate results before/after a rolled-back change.\n\nSetup and run: Use playground/sql seeded disposable SQLite/PostgreSQL databases and the README commands. Run both dialects where requested; perform mutations inside rolled-back transactions. Use dialect-appropriate syntax, never a production database.\n\nLearning reference: https://www.postgresql.org/docs/current/tutorial.html",
        "starter": "",
        "check": "Ada paid total is 100 and Ben is 50; Dee has no orders. Ranking ties break by id. A rolled-back update leaves the report unchanged on both engines."
      },
      "topics": [
        "CTE",
        "windows",
        "transactions"
      ],
      "prerequisites": [
        "sql-index-plan"
      ],
      "reference": "https://www.postgresql.org/docs/current/tutorial.html"
    },
  ],
};

expandedExercises.rust!.push(...rustFoundations);
