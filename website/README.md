# Syntaxiser landing page

Local-only marketing site for issue #28. Nothing is registered, deployed, or published. The page is static HTML/CSS with no framework, JavaScript, third-party fonts, analytics, or external asset requests. Links to GitHub and VS Code only connect when followed. Native disclosure elements provide the FAQ interaction.

## Preview

From the repository root, with nvm and pnpm available:

```sh
nvm install
nvm use
pnpm exec node website/server.cjs
```

Open http://127.0.0.1:4188. Stop with Ctrl+C. The preview server binds only to loopback and serves a fixed list of page assets. No dependency installation or build is required for the website; `node website/server.cjs` also works after selecting Node. You can alternatively open `website/index.html` directly. Hosting, domain selection, marketplace publication, and automated deployment are outside this change.

## Content and assets

- Learning leads the story: practical examples → separate syntax overviews → practice and progress.
- Language/library claims match the existing catalogs and README at implementation time. Built-in lesson coverage is deliberately described as varying by language. Update copy as support changes.
- The hero is explicitly an illustration, using the exact `iterator-pipeline` code from `packs/rust.json`, rather than a simulated live editor or search control.
- `assets/context.png`, `search.png`, and `pins.png` are copies of the existing actual sidebar-renderer captures from `docs/screenshots/`. They show an earlier layout; the visible caption explains that current navigation has evolved. No fabricated UI is labeled as a product screenshot. Refresh these assets alongside future documentation screenshots.
- `assets/book.svg` is an original small book mark. All assets are local, with system fonts and the repository's MIT license.
- The source installation path uses the repository's pinned `.nvmrc` and pnpm, with VS Code 1.93+ matching `package.json`. There is no marketplace link or availability claim.
- `website/` is excluded from VSIX packaging; it has no effect on extension runtime or offline behavior.

## Manual review

1. Preview at 320, 390, 768, 1024, and 1440 pixels wide. Check the header, hero, code, screenshots, installation steps, and footer. Only long code blocks may scroll horizontally; the page must not.
2. Follow **Start learning** and **Get the extension** to installation; **Take a look** and **Explore** to the learning tour. Verify screenshot links open their full local images.
3. Tab from a fresh page. The skip link appears on focus; navigation, calls to action, image links, and FAQ summaries show a visible focus outline. Activate a FAQ with Enter/Space and close it again. Verify keyboard navigation at mobile widths too.
4. Disable JavaScript: all content, navigation, screenshots, and FAQ disclosures still work. At 200% zoom, text remains legible and the columns stack as space narrows. Enable reduced motion to disable smooth scrolling.
5. Verify each GitHub/install/license link and compare the install instructions with the root README. In a disposable checkout, use those documented source-build commands, then install the generated VSIX using VS Code's command palette.
6. With browser developer tools open, reload. Check for missing assets, console errors, and network requests to third parties. No requests should leave loopback until you follow an external link.

The extension's regression suite runs separately with `pnpm test`. No new browser dependency is required to maintain this page.
