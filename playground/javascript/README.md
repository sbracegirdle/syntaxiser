# JavaScript, JSX and TSX playground

Use the repository's Node version and pnpm. From the repository root:

```sh
nvm install
nvm use
pnpm --dir playground/javascript install --frozen-lockfile
pnpm --dir playground/javascript build
pnpm --dir playground/javascript serve
```

Open http://127.0.0.1:4174 for JSX, or http://127.0.0.1:4174/?typed for TSX. Click the Visits button, type a name, and focus the second input with its button. Resize the window and observe its displayed width. The page displays the exact React catalog snippets, generated into ignored .catalog modules when building. Stop the server with Ctrl+C. No account or remote resource is required.

Open http://127.0.0.1:4174/depth for the expanded catalog components. Submit an empty display name, then save a nonempty name. Enable **Simulate save failure**, submit again and check the announced error; disable it and retry. Choose the consent form and submit before/after checking consent. Choose the cart, add ten items and check its limit, then clear it. Choose the undo form, edit a name and undo; choose the project provider to see its context consumer. The same exact components are exercised in Chromium by the checker.

`pnpm check:javascript` from the repository root validates exact snippet behavior, including real browser effects and cancellation. See [supported versions and validation](../../docs/javascript-support.md). `pnpm --dir playground/javascript check` also checks the handwritten TypeScript walkthrough files. After building, `pnpm --dir playground/javascript test` runs the exact Vitest and Testing Library snippets.

## Manual sidebar walkthrough

Add this folder to the existing monolithic VS Code workspace, then open these four files in the same window:

1. **main.js:** place the cursor on readFile and inside makeCounter. Confirm the language says JavaScript / JSX and Node file/closure examples appear. Search **read file node**, **fetch cancel**, **coercion**, and **express error middleware**. Confirm examples use JavaScript with no type annotations or interfaces.
2. **main.jsx:** move to useState, onClick, key, ref and useEffect. Try **react props**, **click handler**, **effect cleanup**, and **react keys**. Follow Browse reference from a result and confirm its overview is different from the solved task example. Move into nested JSX and an expression inside braces; comments and literal text should not masquerade as code.
3. **main.ts:** check the Task type and the signal parameter. Existing TypeScript search results should still work; search **type guard** and **fetch cancel**. TypeScript syntax should appear only in the TypeScript catalog.
4. **main.tsx:** move to ChangeEvent, useRef and the effect cleanup. Search **react props**, **click handler**, **focus input** and **effect cleanup**. The focused TSX examples include useful props/event/ref types.
5. Pin a JS React recipe in main.jsx, switch to main.js, and confirm it is the same pin. Pin an existing TypeScript recipe in main.ts, then switch to main.tsx and back to JSX. Both language-qualified pins remain visible without converting or duplicating them. Select and copy highlighted code; pasted code must match the displayed source exactly.
6. Create a custom JavaScript lesson with a task comment, mark it Done, and switch between .js and .jsx. Progress is shared. Repeat in TypeScript and confirm .ts/.tsx share progress independently. Reload the VS Code window and verify both pins and both custom lessons survive.
7. In each React file, temporarily leave an unfinished `<button onClick={` or template interpolation while editing. The sidebar should keep updating without an error. Undo the edit afterward.

## Expanded reference walkthrough

Open `depth.mjs` and `depth.jsx` in the existing workspace. `node playground/javascript/depth.mjs` builds and imports the exact catalog core modules and prints small deterministic results; it writes only ignored generated files. Build once before serving the browser page. The complete asserted suite remains `pnpm check:javascript`.

1. In `depth.mjs`, move to `.bind`, `yield`, `WeakMap`, `Symbol.iterator`, `matchAll`, `JSON.parse`, `Promise.allSettled`, `queueMicrotask` and `fileURLToPath`. Search **bind callback**, **lazy generator**, **regex capture**, **json parse error**, **promise all settled**, **unicode grapheme count** and **node file url**. Expect a focused practical example in the first three cards.
2. In `depth.jsx`, move to `useReducer`, `useContext`, `FormData`, `onSubmit` and `closest`. Search **form submit validation**, **react reducer**, **react context**, **react accessible form**, **express malformed json** and **vitest fake timer**. Confirm the grouped overview has independently written schematic syntax/rules and working source links, distinct from the solved task.
3. Copy a full new example and compare its import lines and code with the catalog source. Pin a new example, switch between `.js`/`.jsx`, then to `main.ts`/`main.tsx` and back. The JavaScript pin should keep its language identity and the displayed examples should switch correctly. Reload the workspace and confirm the pin survives.
4. Leave `.bind(` or `queueMicrotask(` incomplete temporarily and verify the sidebar still updates. Put the same tokens inside comments and strings; they should not become active API cues. Undo temporary edits.
5. Open the existing JavaScript lesson track. Follow its new prerequisite references, then return to the task. Lesson IDs/progress remain stable and snippets contain only task comments, with no solved code. Use the existing [lesson manual checks](../../docs/lesson-library.md) for progress/custom lessons.

See [the expansion matrix and evidence limits](../../docs/javascript-depth.md). These files are runnable reference examples, separate from unsolved lesson tasks. No credentials, cloud services or public HTTP requests are used by the checker.
