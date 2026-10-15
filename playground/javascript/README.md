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

The built-in progressive lesson expansion belongs to issue #36; these files are runnable reference examples, not lesson starter snippets.
