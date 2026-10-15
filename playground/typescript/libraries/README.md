# TypeScript library playground

This runnable project covers the base library catalog: React, Next.js, Vue, Angular, Express, Zod, Axios, Lodash, date-fns, RxJS, TanStack Query, Zustand, Jest, and Vitest. Dependencies are pinned in `package.json` and `pnpm-lock.yaml`; they belong to this development playground and are not bundled with the extension.

From the repository root, select its Node version with `nvm use`, then run:

```sh
pnpm --dir playground/typescript/libraries install --ignore-scripts
pnpm --dir playground/typescript/libraries check
pnpm --dir playground/typescript/libraries start
pnpm --dir playground/typescript/libraries test
pnpm check:typescript
```

The pinned packages require the repository's Node 26 runtime. `check` uses strict TypeScript checking. `start` compiles and runs a deterministic local demo. `test` compiles, then runs Vitest behavior tests and Jest's case-table/typed-mock tests. `pnpm check:typescript` checks every bundled core and library snippet against these installed package declarations, including JSX, with no example execution.

The demo renders React components on the server, evaluates Vue/Angular reactive values, invokes Next.js response helpers, validates Zod input, exercises an Axios adapter with local data, groups records, formats dates, transforms an RxJS stream, reads TanStack Query's cache, and updates Zustand state. It makes no external requests. Express tests briefly start an ephemeral listener bound to `127.0.0.1`, send valid and invalid JSON, and close it afterward. JSX components are rendered to HTML rather than mounted in a browser; browser interaction and full framework builds are separate host-project checks.

## Manual sidebar checks

1. Open `demo.tsx` with Syntaxiser visible. Move onto `useState`, Vue `ref`/`vueComputed`, Angular `signal`/`computed`, `NextResponse`, Express `app.post`, Zod `safeParse`, Axios `client.get`, Lodash `groupBy`, date-fns `format`, RxJS `pipe`, TanStack `useQuery`, and Zustand `createStore`. Check that the matching library appears in examples and Quick reference.
2. Open `behavior.vitest.test.tsx` and `behavior.jest.ts`. Move onto imported `test`/`expect` and mock calls; test-runner imports should distinguish Vitest from Jest.
3. Search **react hooks**, **app router**, **vue watch**, **angular injection**, **express middleware**, **schema validation**, **http client**, **group records**, **format date**, **observable**, **react query**, **zustand store**, **jest mock**, and **vitest mock**. Each query should reach that library's examples and dedicated syntax overview.
4. In Reference, browse all four Libraries groups. Open each library and check that its syntax forms and rules are distinct from its practical examples. Use a snippet's reference button to reach its related overview.
5. Rename an imported API (for example `useState as useValue`) and use that binding on a line. The library should remain relevant. Move to a blank line away from imports: unrelated library imports should not generate Quick reference previews.
6. Pin a library example, switch to `../main.ts`, then a Go/Rust playground, and back. Check that the language changes, core examples remain discoverable, and the library pin survives. Reload the window to check pin persistence.

The snippets cover TypeScript/TSX APIs: Vue Composition API calls and Angular core calls are available in these editors; `.vue` components and Angular HTML templates require separate editor support. Next.js snippets target App Router route handlers in a real Next project. The demo exercises their response logic without starting a Next development server. React effects synchronize browser state and are type-checked; effects do not run during server rendering.

See [library coverage and sources](../../../docs/typescript-libraries.md) for selection evidence, versions, and API references. The [core playground](../README.md) can still run independently without installing the library dependencies.
