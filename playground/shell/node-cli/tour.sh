#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Dependencies are installed separately; every command below runs locally.
node --version
pnpm --version
pnpm run check
pnpm run build
node --check dist/math.js
node --test test/*.test.mjs
node --test --test-name-pattern="adds" test/math.test.mjs
node --print "JSON.stringify({ runtime: process.version })"
pnpm exec tsc --project tsconfig.json --showConfig > /dev/null
pnpm exec tsc --project tsconfig.json --traceResolution --noEmit > /dev/null
pnpm run lint
pnpm exec prettier "src/**/*.{ts,tsx}" --check
pnpm exec vitest run src/math.test.ts
pnpm exec vite build
pnpm exec tsc --build tsconfig.build.json
pnpm --filter "@demo/web..." run build
pnpm -r run check
npm run build --workspace=@demo/web
pnpm list --depth 0
pnpm why typescript
printf 'Node CLI tour complete.\n'
