# HTML and CSS playground

Open `index.html` directly for the static native layout, images and disclosure. Use the local server below for module-based form interaction and the framework page. No account, backend, CDN or external image is required. Submitting the reminder form only changes page text; it neither stores nor sends the email.

From the repository root, use the Node version in `.nvmrc`:

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm --dir playground/web install --frozen-lockfile --ignore-scripts
pnpm --dir playground/web build
pnpm --dir playground/web serve
```

Open http://127.0.0.1:4173 and follow **Framework examples**. Bootstrap 5.3.8, Tailwind CSS 4.3.3, its CLI, and Playwright 1.62.1 are pinned in the package manifest and lockfile. Bootstrap is served locally; Tailwind input (`tailwind.css`) must be compiled to `generated.css` before viewing `libraries.html`. Both catalogs have separate Bootstrap and Tailwind topics and examples. Native snippets target modern evergreen browsers; older browsers may lack container queries, cascade layers, or newer sizing/text features. SCSS/Less and embedded CSS/JavaScript routing inside HTML are outside this initial catalog; open a `.css` file for CSS context.

## Automated checks

```sh
pnpm test
pnpm --dir playground/web exec playwright install chromium
pnpm check:web
pnpm check:references
```

`check:web` needs the playground dependencies and generated CSS. It parses every exact native CSS card in Chromium, checks HTML label/ID/alt relationships, tests the page at 320/768/1200px, submits a form, toggles disclosure, checks keyboard focus and reduced motion, and verifies real Bootstrap/Tailwind styles. It starts and stops the loopback server on port 4173; stop a manual server before running. Set `WEB_BROWSER_PATH=/absolute/path/to/chromium` to reuse an installed browser. `check:references` is the explicit online check for every catalog's learning-source URLs; extension use and regular tests remain offline.

## Manual extension checks

1. Install the VSIX and run **Developer: Reload Window**, then open `index.html` and the Syntaxiser sidebar. The language should read **HTML**. Move between `<input>`, `<table>`, `<details>` and multiline image attributes; matching practical examples and compact topic links should appear.
2. Search **email validation**, **responsive images**, **bootstrap button**, and **tailwind card**. Clear search to resume context. Pin an HTML example.
3. Switch to `styles.css`. The language should read **CSS**. Move between `display: grid`, `:focus-visible`, `@media`, `@container`, and custom properties. Search **responsive grid**, **center element flex**, and **css variables**. The HTML pin should remain visible.
4. Choose **Reference** in both languages. Browse every group, open Bootstrap/Tailwind topics and their source links, copy syntax, and check that copied HTML stays literal markup. No snippet should render a real input, image, or button in the sidebar.
5. Open `libraries.html`, `bootstrap-overrides.css`, and `tailwind.css`; check library suggestions around component classes, `--bs-*`, `@import "tailwindcss"`, and `@theme`. Framework examples require the pinned build above; the extension itself bundles no frameworks.
6. In **Lessons**, try the built-in HTML/CSS tracks or add your own tasks and track them independently. Switch to Rust, Go or TypeScript and back; pins and lesson progress should persist after reload. HTML group, table, dialog and progressive-form tasks now link to the expanded references.
7. In a browser, resize the native page from 320px to desktop width. Tab through links and controls, toggle watering advice using Enter/Space, try an invalid email, submit a valid one, and verify the status message. Emulate reduced motion and confirm hover movement stops. Check both framework button styles and the Tailwind two-column layout above 768px.

## Exact HTML catalog evidence (#71)

`check:web` now loads all 52 practical `packs/html.json` cards unchanged into
isolated Chromium documents before running the retained handwritten playground
layout checks. `scripts/check-html-catalog.cjs` supplies only an outer HTML
shell (except the complete document card), a form/submit button around the input
fragment as its explanation requires, and local assets/framework styles. An
intercepted `http://catalog.test` origin supplies the documented stylesheet,
module and SVG dependencies without contacting a public server. The asset module
sets a sentinel; it does not implement card application behavior. Bootstrap uses
its pinned distribution; Tailwind's pinned compiler scans the catalog itself.

The retained original-card matrix follows. The **#77 expansion** adds ten topics
and 35 practical tasks; its complete [before/after and assertion matrices](../../docs/html-depth.md)
cover metadata/direction/base, script variants, complex tables, form groups/hints/state,
multipart requests, validation recovery, native modal/popover interaction,
responsive pictures, real local media/captions, iframe isolation and framework
components. `html-fixtures.cjs` shares exact-source surroundings and dependencies
between automated checks and generated manual pages. Every new topic has two
distinct practical examples and registered happy/boundary/rejection evidence.

| Exact card | Independently inspected outcomes | Registered situations |
| --- | --- | --- |
| document | HTML doctype, standards mode, English language, UTF-8, title, viewport, h1 | happy |
| assets | Real module loading sentinel and computed local stylesheet sentinel | happy |
| semantics | Named navigation, main target, article heading, fragment navigation | happy |
| text | Strong/emphasis text and literal escaped markup; no injected seed element | happy |
| links | Keyboard fragment navigation and existing target; explicit new-tab isolation | happy |
| lists | Ordered steps and glossary term/description | happy |
| images | Accessible image name, actual local image load, dimensions, lazy flag, caption | happy |
| tables | Accessible table caption, column/row scopes, independent cell value | happy |
| forms | Associated search name, GET/action, actual encoded request and empty query | happy, edge |
| inputs | Named controls, autocomplete, valid submissions at 1/20, empty/bad email and 0/21 rejected without submit; recovery | happy, edge, error |
| choices | Keyboard option selection, multiline value, clearing text | happy, edge |
| buttons | Disabled action/description, suppressed native click, supplied enable then click | happy, edge |
| details | Initially hidden, keyboard Enter opens, Space closes | happy, edge |
| accessibility | Icon button name/focus, initial status, application-supplied status text update | happy, edge |
| data | Stable ID/class/data value and retained but invisible hidden text | happy |
| bootstrap | Named enabled button, status text, actual computed primary/success colors and focus | happy |
| tailwind | One/two columns at 320/767/768/1200, padding, painted button, keyboard focus outline | happy, edge |

All fixtures also reject duplicate IDs, broken label/control or described-by
relationships, and missing image alternatives. `html-evidence.json` is the
reviewable per-card registration, mirrored in `coverage/languages.json`.
The check fails if a catalog card has no registration or assertion branch.

Non-applicability decisions for human review: static metadata, text, lists,
landmarks, tables, links, image attributes and data hooks do not implement
application error/recovery branches. Their positive DOM/accessible contracts
and shared rejection invariants replace those situations; the audit deliberately
retains unknown edge/error findings rather than claiming fabricated behavior.
The assets fixture only covers successful supplied dependencies, not a loading
recovery UI. The illustrative search backend returns 404: request serialization
is asserted, backend search results are outside the card. Framework save actions,
button prerequisites, close actions and status updates require application code;
the tests distinguish the supplied state changes from native behavior. DOM roles
and text do not prove screen-reader announcements. No public MDN link is opened.

Run the controlled mutations (no catalog files are left changed):

```sh
node scripts/check-web-pack.cjs --mutation-check
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime html > /tmp/syntaxiser-html-runtime.json
```

The same exact-source fixture path changes only a card's label target, document
viewport or icon-button name and requires an assertion failure for each. The
mutation checks also reject broken grouped table headers, dialog names and popover
targets. Normal cards are checked first and retained page checks run afterward. This proves the
assertions depend on catalog content, rather than a handwritten equivalent.

For manual inspection, run `node scripts/generate-html-fixtures.cjs`, start the
existing local server, and open `/catalog.html`. Each link opens one exact card
with its documented surroundings. Inspect document metadata in DevTools; tab
through links/controls, toggle the disclosure with Enter/Space, test invalid and
boundary input values, and compare framework styles at 767/768px. Fragment input
submission and static save buttons have no application backend. Use the extension
cursor/search/copy/pin/reference/language-switch walkthrough above alongside the
exact generated examples; regenerate after editing any card.

Primary assertion references: [HTML form/label/submission contracts](https://html.spec.whatwg.org/multipage/forms.html),
[Playwright retrying DOM and accessibility assertions](https://playwright.dev/docs/test-assertions),
[Bootstrap 5.3 buttons](https://getbootstrap.com/docs/5.3/components/buttons/), and
[Tailwind theme compilation](https://tailwindcss.com/docs/theme).

## CSS depth fixtures (#78)

See [scope, versions, source and assertion matrices](../../docs/css-depth.md).
Run `node scripts/check-css-catalog.cjs --generate` from the root, then serve
this playground and open [/css-catalog.html](http://127.0.0.1:4173/css-catalog.html).
The gallery uses all 35 added cards unchanged (Tailwind is compiled), with the
same HTML surroundings as the 105 automated browser cases in `check:web`.
Regenerate after catalog edits. Use `node scripts/check-css-catalog.cjs --mutation-check`
for six controlled negative mutations. The CSS walkthrough and preserved lesson
prerequisites are documented in the linked matrix.
