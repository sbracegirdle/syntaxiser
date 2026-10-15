# Lesson workspace and feasibility checks

See [setup, versions, task boundaries and manual walkthroughs](../../docs/lesson-library.md) and the [coverage matrix](../../docs/lesson-coverage.md).

This locked Node/browser workspace is for disposable learner copies. Add your own exercise files at the root; no solution is prefilled. `validation/` holds separate maintainer feasibility probes, never displayed by the extension. `pnpm run check`, `pnpm test` and `pnpm run serve` provide strict TypeScript checking, Vitest/jsdom behavior and a loopback static browser preview. Browser entries must be bundled as documented before previewing.
