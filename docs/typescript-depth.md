# TypeScript type-system and library depth

Issue #73 expands the 51-topic / 65-example catalog on `8b60fc55ba8c06747ee3e1c39bb889080482083c` to **61 topics / 93 examples**. All existing topic, card and lesson identities remain. Ten new grouped overviews and 28 practical tasks are separate from unsolved lessons. Counts describe inventory; the scope and assertions below describe the content review.

## Toolchain and assumptions

Use Node **26.3.0** (`.nvmrc`), TypeScript **5.9.3**, strict checking and ES2022. The existing frozen library lock pins React/React DOM **19.3.1**, React types **19.3.0**, Zod **4.6.7**, Express **5.3.0**, TanStack Query **5.104.2**, Vitest **5.0.4**, Testing Library React **16.3.0**, user-event **14.6.1**. The DOM harness additionally pins jsdom **30.1.2**. No application dependency is shipped in the extension. Catalog imports are complete; core examples are standalone strict modules and UI examples are TSX. Query examples require an isolated QueryClientProvider; request examples let the host own listen/close. There is no deployment, credential or public service prerequisite.

The TypeScript forms used here predate the pinned compiler: conditional/infer 2.8, readonly tuples 3.4, assertion signatures 3.7, template literal types/key remapping 4.1 and satisfies 4.9. The pinned compiler validates the exact delivered forms, including expected diagnostic contracts. React documentation currently identifies v19.3; Express examples require its v5 promise forwarding and Zod uses v4 issues. Do not transpose these examples into Express 4 or Zod 3 without adapting them.

## Before/after scope and independent cases

Every row lists overview IDs in their navigation group, all added practical card IDs, primary sources and the happy/edge/error assertion contract. Detailed per-card test names, sources and actually asserted situations are in [depth-evidence.json](../playground/typescript/libraries/depth-evidence.json). Unlisted old examples remain unchanged and retain historical unknown-evidence findings. Every added card is executed; every catalog card is type-checked against genuine pinned declarations.

| Scope / previous coverage | Group / overview IDs | New practical IDs | Happy; boundary; rejection or recovery | Primary reference |
| --- | --- | --- | --- | --- |
| Conditional/infer/distribution: absent dedicated unit | Type transformations / `conditional` | `ts-conditional-result`, `ts-conditional-batch` | Validated name and extracted return type; trimmed names, empty batch and never; invalid unknown input, disallowed unions and mixed distributive arrays | [Conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) |
| Typed event names: absent dedicated unit | Type transformations / `template-literal` | `ts-template-events`, `ts-template-route` | Listener delivery and route labels; empty names, finite route combinations, unsubscribe twice; corrupt event rejected at runtime, invalid event/listener/route rejected by compiler | [Template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) |
| Object key transformations: broad mapped topic | Type transformations / existing `mapped` | `ts-mapped-getters`, `ts-mapped-public` | Live getter and public DTO; changed/empty values, non-string keys filtered; missing getter/internal public field rejected by compiler, secret omission asserted at runtime | [Key remapping](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as) |
| Overloads: absent dedicated unit | Declarations / `overloads` | `ts-overload-date`, `ts-overload-format` | UTC timestamp/parts and scalar/list shape; normalized calendar overflow and empty list; two-argument calls rejected by compiler, invalid dates/nonfinite numbers throw | [Function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads) |
| Assertion functions: broad narrowing only | Object and type models / `assertions` | `ts-assert-user`, `ts-assert-port` | Unknown user normalized and numeric port; extra keys/default/1/65535; null/missing/blank user, strings, fractions and out-of-range ports rejected | [Assertion functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions) |
| Exhaustive never: broad unions only | Object and type models / `exhaustive` | `ts-exhaustive-load`, `ts-exhaustive-command` | All finite states and commands; successful zero results/add zero/reset; forgotten case rejected by compiler, corrupt state/nonfinite amount rejected at runtime | [Exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking) |
| Readonly arrays/tuples: broad arrays/tuples only | Collections and iteration / `readonly` | `ts-readonly-sort`, `ts-readonly-tuple` | Sorted owned copy and clamped number; frozen input, fresh empty output/equal bounds; tuple assignment/push/wrong length rejected by compiler, reversed/NaN bounds rejected at runtime | [Readonly tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types) |
| Constraints/variance: broad generics only | Object and type models / `variance`, existing `generics` | `ts-constrained-pluck`, `ts-variance-consumer` | Precise key result and broad consumer; empty rows/dogs; unknown key and narrow consumer rejected by compiler, thrown callback propagates | [Generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#using-type-parameters-in-generic-constraints), [strictFunctionTypes](https://www.typescriptlang.org/tsconfig/strictFunctionTypes.html) |
| Promise combinators: broad async/cancellation only | Asynchronous and nullable values / `promises`, existing `fetch-cancel` | `ts-promise-settled`, `ts-promise-owned` | Ordered fulfilled batch; empty input; actual rejected branch retained, sync failure aborts sibling, observes its rejection and preserves original error | [Promise combinators](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.allsettled), [AbortController](https://dom.spec.whatwg.org/#interface-abortcontroller) |
| React reducer/forms: basic state/event tasks | React and TSX tasks / `react-reducer`, existing `react-events` | `ts-react-reducer`, `ts-react-history` | Submit trimmed draft and undo interaction; reset, duplicate edit and empty history; blank submit reports error then successful submit recovers | [useReducer](https://react.dev/reference/react/useReducer) |
| React context/cleanup: basic effect task | React and TSX tasks / `react-context`, existing `react-effect` | `ts-react-context`, `ts-react-subscription` | Theme toggle and emitted status; isolated providers/StrictMode replay; missing provider rejects, stale source ignored, replacement and unmount leave no listeners | [useContext](https://react.dev/reference/react/useContext), [useEffect](https://react.dev/reference/react/useEffect) |
| Zod: basic safeParse example | Libraries HTTP and validation / existing `zod` | `ts-zod-errors`, `ts-zod-cross-field` | Trimmed profile and ordered range; age zero, stripped extra keys/equal endpoints; missing/null/blank/NaN/reversed input yields field paths and stable codes | [Zod basics](https://zod.dev/basics), [errors](https://zod.dev/error-customization) |
| Express: basic route/error examples | Libraries HTTP and validation / `express`; Browser, Node and request testing / `express-errors` | `ts-express-validated`, `ts-express-recovery` | 201 validated name and 200 item; trim/valid empty-string item; 422 schema, 400 malformed JSON, 413 body limit, 404 missing, 503 rejected loader followed by successful request | [Express error handling](https://expressjs.com/en/guide/error-handling/) |
| Query: basic fetch/mutation examples | Libraries utilities and state / existing `tanstack-query` | `ts-query-transitions`, `ts-query-refresh` | Loaded/cache data; pending, refreshing, empty successful result; failed initial load then explicit retry, failed refresh retains data then recovers, unmount aborts consumed signal | [Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries), [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) |

Compiler assertions and runtime assertions are distinct. For pure key-remapping errors, the compiler is the rejection boundary: no runtime type transformation exists. The audit deliberately retains `mapped`'s missing runtime error registration rather than claiming static rejection was a runtime test. The projection invariant additionally asserts that a private value never reaches JSON. Readonly remains shallow and callback method signatures retain the TypeScript bivariance exception. Date construction uses UTC with JavaScript normalization, rather than claiming strict calendar validation. Promise cancellation is cooperative: each job must settle after abort; `all` alone never cancels siblings. Query examples use one fixed key per example dataset, explicit retries and caller-injected loaders.

## Run and inspect

From the repository root:

```sh
source ~/.config/nvm/nvm.sh
nvm use
# Root and library playground use committed pnpm lockfiles.
pnpm install --frozen-lockfile --ignore-scripts
pnpm --dir playground/typescript/libraries install --frozen-lockfile --ignore-scripts
pnpm check:typescript
pnpm --dir playground/typescript/libraries check
pnpm --dir playground/typescript/libraries test
pnpm test
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime typescript
```

`prepare-depth.cjs` generates `.catalog-depth/*.tsx` directly from `packs/typescript.json`, adding only an empty module marker. The compiler checks the catalog and `type-contracts.ts`; expected-error directives fail if an invalid program becomes accepted. Runtime tests import generated modules, so no hand-copied implementation can drift. Each new topic's meaningful invalid type is additionally checked where applicable. `depth.vitest.test.tsx` runs mounted React interaction tests in jsdom; `requests.vitest.test.tsx` runs Node with an ephemeral loopback server and always closes it. Deferred promises control query transitions and cancellation without sleep-based timing assertions. The ordinary Jest and original library tests still run.

The generated files are runnable and browseable after `pnpm run prepare:depth` in the library playground. Open them to experiment or run the named Vitest tests; edits are overwritten on regeneration, so copy a generated file into a disposable experiment first. Full Next/Vue/Angular app builds and visual browser rendering remain outside this expansion. Offline execution assumes the frozen dependencies are already installed or cached.

## Manual sidebar walkthrough

1. Run `pnpm --dir playground/typescript/libraries prepare:depth` in the primary checkout. Open `.catalog-depth/ts-conditional-result.tsx`, then `ts-readonly-tuple.tsx` and `ts-promise-owned.tsx`. Move onto `infer`, `readonly`, `Promise.all`/`allSettled` and `abort`. Relevant examples and separate Quick reference topics should follow the cursor.
2. Search **conditional infer**, **exhaustive never**, **readonly tuple**, **promise all settled**, **react reducer**, **zod errors**, **key remapping**, **generic constraint**, and **context cleanup**. A relevant concrete card should occur in the first three; Reference should find the separate overview.
3. Browse Type transformations, Object and type models, Collections, Asynchronous values and React/TSX tasks in Reference. Inspect the variations/rules and follow official learning links. Compare each with its solved task examples.
4. Open generated `ts-react-reducer.tsx` and `ts-react-context.tsx`. Rename `useReducer`/`useContext` imports with `as`, use the local names and check relevance. Insert a comment or quoted string containing `infer`, `assertNever` or `useReducer`; those should not create a false syntax match. Try an unfinished `assertNever(` call and restore it afterward.
5. Copy a readonly/promise card and compare the copied code with the visible snippet. Pin a new example, switch TypeScript → TSX → Go/Rust and back, and reload VS Code. Check language highlighting, reference navigation and retained pins. Keep the monolithic workspace window; open files within it.
6. Run library tests and read the actual assertions for invalid request bodies, blank forms, missing context providers, StrictMode cleanup and query retry/unmount. jsdom verifies interaction semantics; inspect narrow sidebar rendering and keyboard navigation in VS Code as the final human review.

## Existing lesson prerequisites

Existing lesson IDs/progress and task-only snippets are preserved. `ts-functions` and `ts-generics` use readonly/variance reading; `ts-discriminants` uses exhaustive/conditional reading; `ts-parse` uses assertion/Zod reading; `ts-cancel` uses promise ownership; `ts-events` and `ts-capstone` use reducer forms; `ts-effect` uses context subscription cleanup; `ts-express` uses validation/error contracts; `ts-query` uses pending/error/cache transitions. Their instructions link here without embedding a solution in the lesson snippet. Existing lesson status/filter/reset/pin regressions remain part of `pnpm test`.
