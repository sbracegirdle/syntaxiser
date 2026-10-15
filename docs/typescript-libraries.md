# TypeScript base library coverage

New language support and expansions must include popular ecosystem libraries alongside core syntax. Each selected library needs practical task examples, a separate syntax/API overview, library/task search aliases, contextual import/API cues, documented version requirements, and validation against real dependencies. Runnable playgrounds must exercise representative behavior and explain any checks that require a full host application.

## Selection reviewed 15 October 2026

The initial TypeScript baseline covers 14 widely used libraries across UI/frameworks, servers/HTTP/validation, utilities/reactive state, and testing. [State of JavaScript 2025](https://2025.stateofjs.com/en-US/libraries/) and its [other-tools results](https://2025.stateofjs.com/en-US/other-tools/) provide ecosystem context; npm download counts provide additional usage evidence. This is a representative baseline across application areas, not a claim that these are the fourteen highest-ranked packages. Downloads include transitive dependencies and CI installs and are not counts of distinct TypeScript users. Review maintained alternatives and emerging usage when expanding the catalog.

Counts below are the npm API's available monthly snapshot for **13 September–12 October 2026**, retrieved on 15 October. Versions are pinned in the [library playground](../playground/typescript/libraries/package.json), including required type packages. Every row has two independently authored practical examples plus one separate overview in the bundled base catalog.

| Package | Checked version | Monthly downloads | Practical tasks | Primary source |
| --- | --- | ---: | --- | --- |
| react | 19.3.1 | [833,052,763](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/react) | count button clicks; restore the document title on cleanup | [API reference](https://react.dev/learn/typescript) |
| next | 16.4.1 | [283,605,175](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/next) | read a search query in a route; redirect a route to sign-in | [API reference](https://nextjs.org/docs/app/api-reference/file-conventions/route) |
| vue | 3.5.44 | [75,864,263](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/vue) | derive a filtered task list; watch a reactive search term | [API reference](https://vuejs.org/guide/typescript/composition-api.html) |
| @angular/core | 22.2.3 | [28,129,689](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/%40angular%2Fcore) | derive a cart total; inject a typed configuration value | [API reference](https://angular.dev/guide/signals) |
| express | 5.3.0 | [635,513,489](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/express) | validate and accept a JSON user; send a safe error response | [API reference](https://expressjs.com/en/guide/routing/) |
| zod | 4.6.7 | [1,431,684,297](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/zod) | validate a signup payload; report a safe validation result | [API reference](https://zod.dev/basics) |
| axios | 1.20.0 | [531,376,524](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/axios) | fetch typed users with error handling; create a user with cancellation | [API reference](https://github.com/axios/axios) |
| lodash | 4.18.1 | [765,891,530](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/lodash) | group unique tasks by status; debounce a search callback | [API reference](https://lodash.com/docs/) |
| date-fns | 4.4.0 | [454,333,740](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/date-fns) | format a due date one week later; check a booking date range | [API reference](https://github.com/date-fns/date-fns) |
| rxjs | 7.8.2 | [478,399,084](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/rxjs) | transform an observable sequence; switch to the latest search stream | [API reference](https://rxjs.dev/guide/operators) |
| @tanstack/react-query | 5.104.2 | [304,837,735](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/%40tanstack%2Freact-query) | load and display a todo count; invalidate todos after a mutation | [API reference](https://tanstack.com/query/latest/docs/framework/react/typescript) |
| zustand | 5.0.15 | [264,810,418](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/zustand) | share a typed counter between components; subscribe to state outside React | [API reference](https://github.com/pmndrs/zustand) |
| jest | 30.5.2 | [214,015,882](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/jest) | check addition with a case table; assert an asynchronous dependency call | [API reference](https://jestjs.io/docs/mock-functions) |
| vitest | 5.0.4 | [516,356,260](https://api.npmjs.org/downloads/point/2026-09-13:2026-10-12/vitest) | test valid and invalid schema input; mock a typed asynchronous loader | [API reference](https://vitest.dev/guide/) |

## Content and validation

The TypeScript pack now contains **54 examples and 40 overviews**: 26 core topics plus 14 library topics grouped under Libraries: UI and frameworks, HTTP and validation, utilities and state, and testing. Library examples are part of ordinary Context, Search, Reference, and Pins; no optional pack installation or network lookup is needed by the extension. Library dependencies are installed only in the development playground or a user's own application.

Install the [library playground](../playground/typescript/libraries/README.md) dependencies, then run `pnpm check:typescript`. All snippets are strictly checked as independent JSX-capable modules against genuine installed library declarations. The checker uses no fake library stubs; the core local-model import has its existing small model fixture. Library declaration internals are skipped while the snippet code remains strict. Run the playground's `check`, `start`, and `test` scripts for the executable demo, six Vitest behavior checks, and three Jest cases. Express is tested over an ephemeral loopback listener; Axios uses a local adapter. No external service, database, credentials, or browser is required.

React JSX, hooks, query providers, and state stores are checked in .tsx modules. Server rendering verifies initial markup; it does not simulate button interaction or execute browser effects. Next.js examples target App Router route modules; the playground executes their response logic without a full Next build. Vue Composition API and Angular core APIs are supported in TypeScript editors; .vue files, Angular HTML templates, full framework scaffolding, and every ecosystem package are outside this initial adapter's coverage.

Keep examples task-oriented and topic overviews schematic. Future additions should update this matrix, versions/lockfiles, import/search regressions, and runnable checks together.
