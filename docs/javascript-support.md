# JavaScript, JSX and TSX support

JavaScript has 80 practical examples across 53 topics with 53 separately authored syntax/API overviews. In addition to the original foundations, the catalog now covers function parameters/receivers, object identity/prototypes/descriptors, Set/WeakMap, generators/symbol protocols, regex/Unicode/numeric/JSON boundaries, promise coordination/scheduling/cleanup, Node paths/URLs, browser forms/storage/delegation, React reducers/context/accessible forms, Express validation and async/DOM testing. See the [before/after scope and assertion matrix](javascript-depth.md). The TypeScript catalog retains its existing IDs and independent content.

React tasks cover props/children, event handlers, state updates, conditional/keyed lists, fragments, effect subscriptions/cleanup, stale fetch cancellation and DOM refs. TSX has independently authored counterparts with ReactNode props, ChangeEvent, generic state and nullable HTMLInputElement refs. Practical cards and schematic API overviews remain separate. JSX needs a JSX transform; it is not raw browser or Node syntax.

## Language and storage identity

| VS Code language | Catalog and storage key | Snippet syntax |
| --- | --- | --- |
| javascript (.js) | javascript | JavaScript and JSX |
| javascriptreact (.jsx) | javascript | JavaScript and JSX |
| typescript (.ts) | typescript | TypeScript and TSX |
| typescriptreact (.tsx) | typescript | TypeScript and TSX |

JS/JSX share pins, custom lessons and progress. TS/TSX continue to share their existing TypeScript state; no existing IDs are renamed. JavaScript and TypeScript state stays separate, and all language-qualified pins remain visible across editors. React examples may appear in .js/.ts contexts, but JSX markup belongs in .jsx/.tsx or a project configured for the relevant JSX transform.

Built-in JavaScript lessons retain the stable paths added by #36. Their instructions link relevant reference prerequisites from the expanded catalog; task snippets and outcome checks remain unsolved and unchanged. JS/JSX still share the custom lesson manager and progress.

## Supported versions and references

The runnable fixture pins Node 26.3.0 (repository .nvmrc), TypeScript 5.9.3, React/React DOM 19.3.1, Express 5.3.0, Vitest 5.0.4, Testing Library React 16.3.0/user-event 14.6.1, jsdom 30.1.2, esbuild 0.28.2 and Playwright 1.62.1. Dependencies and transitive versions are recorded in the playground lockfile. JavaScript recipes use modern ESM, private class fields, Promise.allSettled and Error causes. Express async error forwarding assumes Express 5.

Official sources are included in every overview: [MDN JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Node filesystem](https://nodejs.org/api/fs.html), [React learning](https://react.dev/learn), [React TypeScript](https://react.dev/learn/typescript), [React effect cleanup](https://react.dev/learn/synchronizing-with-effects), [Express routing](https://expressjs.com/en/guide/routing.html), [Express errors](https://expressjs.com/en/guide/error-handling.html), [Vitest](https://vitest.dev/guide/) and [Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Validation

From the repository root:

```sh
nvm install
nvm use
pnpm install
pnpm --dir playground/javascript install --frozen-lockfile
pnpm --dir playground/typescript/libraries install --frozen-lockfile --ignore-scripts
pnpm test
pnpm check:typescript
pnpm check:javascript
```

Install Chromium once with `pnpm --dir playground/javascript exec playwright install chromium`, or set `WEB_BROWSER_PATH` to an installed Chromium/Chrome executable. `check:javascript` generates exact catalog modules, compiles every JavaScript/JSX card, strictly checks all new TS/TSX cards, executes core/Node/Express behavior, runs the exact Vitest/Testing Library cards in jsdom, and tests both JSX and TSX components in a real browser. Checks verify click/input/ref interactions, props/children, keyed lists, window resize updates, HTTP errors, cancellation on URL change and unmount, and removal of resize listeners. Local HTTP servers bind loopback on temporary ports; no external services or credentials are needed.

For the original TypeScript library behavior suite, run `pnpm --dir playground/typescript/libraries test`. The new checks complement that suite rather than replacing it.

## Context limitations

The shared lexical scanner preserves editor offsets, masks strings/comments/regex/JSX text, and retains executable template/JSX expressions. Static ESM named/default/namespace imports contribute library cues only when bindings are used locally; aliased named imports also contribute their original API names. Document symbols improve function scope detection. Incomplete tags/strings are tolerated. This is a lightweight lexical fallback, not a complete JavaScript parser or type checker: dynamic imports, require aliases, unusual generic/JSX ambiguities and malformed nesting may produce approximate suggestions. No .vue, Svelte or Angular-template adapter is introduced.
