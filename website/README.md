# Syntaxiser landing page

Static landing page at [letsbuild.cloud/syntaxiser](https://letsbuild.cloud/syntaxiser/). HTML/CSS and three interactive Rust demos use local assets, system fonts and no analytics or external requests. Each iframe runs the production sidebar markup, CSS, highlighting, lesson UI, Rust catalog, adapter and retrieval; a browser host replaces VS Code messages. No extension storage or editor access is available. Search, references, pins and lessons work within each temporary demo; reload resets them. Other languages remain available in the extension, not this preview.

## Build and verify fidelity

From the root, use nvm and pnpm:

```sh
nvm use
pnpm install --ignore-scripts
pnpm compile
node scripts/build-website-demos.cjs
node scripts/build-website-demos.cjs --check
pnpm --dir playground/web install --ignore-workspace --frozen-lockfile --ignore-scripts
pnpm --config.verify-deps-before-run=false --dir playground/web exec playwright install chromium
node scripts/check-website-demos.cjs
pnpm test
```

`build-website-demos.cjs` obtains HTML from `ReferenceSidebar` and bundles the actual browser renderer and Rust data/logic. It uses the same dark VS Code theme variables as `capture-website.cjs`. The deterministic `--check` rejects any byte difference from current production inputs, including markup, styles, highlighting, catalogs, lessons and retrieval. Regenerate the snapshot after changes to those inputs. The only host substitution is `website-demo-host.ts`; `website-crypto.ts` maps the lesson store's UUID operation to browser crypto. The generated `assets/demo.html` is committed so Pages needs no build dependencies. It is also usable under a project subpath and from a local file.

`check-website-demos.cjs` tests all three frames in pinned Chromium: context switching, play/pause and reduced motion, four tabs, lesson navigation, exact catalog search text, pin/unpin and isolated state. It checks page/sidebar overflow at 320/390/768/1024/1440px and no-script fallback. It writes `docs/screenshots/website-demo-390.png` and `website-demo-1440.png` for visual inspection. Automated markup/content identity does not prove visual perfection; inspect these captures and compare the extension manually below.

`node scripts/capture-website.cjs` refreshes the static Context/search/pins fallback assets from the same production renderer and checks the page with JavaScript disabled. It also refreshes the older page review captures. The fallback images are retained for no-script visitors and full-size comparison.

## Preview and manual review

Open `website/index.html` directly, or run:

```sh
pnpm dlx http-server@14.1.1 website -a 127.0.0.1 -p 4188 -c-1
```

Open http://127.0.0.1:4188 and stop with Ctrl+C. Only preview tool installation needs network access.

1. At desktop and mobile widths, explore all four tabs in each demo. Search `handle a missing value`, pin a result, expand/collapse it and remove it. Browse a reference topic and a lesson, track a task and change its status. Confirm the other demos retain their own state. Reload resets the preview.
2. Watch the Rust editor type iterator, Option and fold examples; results update when each expression finishes. Pause, advance manually and resume. Interacting with the sidebar pauses the animation. Reduced motion starts paused; hidden documents suspend animation. The static cursor is illustrative, not an editable editor.
3. Tab through the page and into each iframe. Check visible focus, Enter/Space activation, search, tabs, pin controls and the animation buttons. Check 200% zoom and 320px width. Long code can scroll; page and sidebar must not overflow horizontally.
4. Disable JavaScript and confirm all three fallback screenshots, navigation and FAQ work. Check developer tools for errors or external resource requests; no request should leave the site until a link is followed.
5. Compare against the installed extension at a roughly 540px sidebar width with its dark theme. Use the first hero excerpt from `website-demo-host.ts`, no recent edits and cursor after `.iter()`. Compare tabs, quick references, first card text, colors, toolbar and pin controls against `assets/context.png` and the live Context demo. Search `handle a missing value` and pin two collapsed results to compare lower demos. Browse Reference and Lesson browser. Surrounding code, theme, font and recent edits can legitimately differ; the deterministic check establishes source fidelity rather than identical host rendering.

6. Compare the twelve language/context labels against the README and `docs/language-support.md`, and verify wrapping without overflow at every preview width.

## Deployment

`.github/workflows/website-pages.yml` stages only `index.html`, `styles.css` and `assets/`, including the generated self-contained demo. It publishes on reviewed `main` changes to `website/` and supports manual dispatch on main. Website changes are excluded from the VSIX. Keep asset URLs relative so `/syntaxiser/` and local previews both work.

Pages uses GitHub Actions and the `github-pages` environment allows only main. The project inherits `letsbuild.cloud` from the user site; do not change DNS or another repository. After merge, verify the Actions deployment, all three demos at https://letsbuild.cloud/syntaxiser/, and the existing domain home/about/posts/Rust quick-reference routes. Revert the website commit on main to roll back.

Language claims cover all registered catalogs, including Python, Java, C#/.NET and YAML. `test/extension.test.cjs` compares the landing-page language IDs with adapters actually loaded at activation, and requires matching labels in the root README and shared support guide. Update all three in the same language-support PR and run `pnpm test`; JSX/TSX remain aliases of canonical catalogs. Keep exact library/version details in the linked language guides rather than duplicating counts here. Built-in lesson depth varies by language.
