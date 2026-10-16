# TypeScript playground

The [library playground](libraries/README.md) adds runnable React/Next.js/Vue/Angular, HTTP, validation, utilities, state, and Jest/Vitest examples. Its dependencies and checks are separate from this lightweight core playground.

Open `main.ts` with the Syntaxiser sidebar visible. Move between imports, generics, optional chaining, type guards, utility types, classes, `satisfies`, async/error handling, array transformations, maps, and loops. Open `models.ts` for interfaces and discriminated unions.

Search **type guard**, **handle missing value**, **partial update**, **transform collection**, or **key value lookup**, then choose **Reference** and follow the related syntax overviews. Pin a TypeScript snippet and switch to `../go/main.go` or `../src/main.rs` to check language switching and retained pins. The other playgrounds must be present in your checkout to follow those links. Reload the VS Code window first if you just installed the TypeScript-support build.

From this directory, run:

```sh
pnpm install
pnpm check
pnpm start
```

Use the repository's Node version via `nvm use` from the repository root before running these commands. The playground uses TypeScript 4.9+ syntax, installs only the compiler as a development dependency, and runs deterministic local examples without network requests. `pnpm start` compiles to `dist/` and runs the generated JavaScript; it prints user names, role counts, an updated profile, and a summary.

With the extension's development dependencies already installed, you can instead run from the repository root:

```sh
pnpm exec tsc -p playground/typescript
node playground/typescript/dist/main.js
```

The [type-system and library depth walkthrough](../../docs/typescript-depth.md) covers conditional/infer, template literals/key remapping, overloads/assertions/never, readonly/variance, promise ownership, reducer forms/context cleanup, Zod errors, Express rejection and Query transitions. Run `pnpm --dir playground/typescript/libraries prepare:depth` from the repository root to expose exact catalog modules under `libraries/.catalog-depth/`; the walkthrough includes first-three search and cursor/copy/pin checks.
