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
6. In **Lessons**, add your own HTML and CSS tasks and track them independently. Built-in lessons remain Rust-only in this release. Switch to Rust, Go or TypeScript and back; pins and custom lesson progress should persist after reload.
7. In a browser, resize the native page from 320px to desktop width. Tab through links and controls, toggle watering advice using Enter/Space, try an invalid email, submit a valid one, and verify the status message. Emulate reduced motion and confirm hover movement stops. Check both framework button styles and the Tailwind two-column layout above 768px.
