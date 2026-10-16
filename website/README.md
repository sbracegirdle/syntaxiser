# Syntaxiser landing page

Static landing page published at [letsbuild.cloud/syntaxiser](https://letsbuild.cloud/syntaxiser/). The page is static HTML/CSS with no framework, JavaScript, third-party fonts, analytics, or external asset requests. Links to GitHub and VS Code only connect when followed. Native disclosure elements provide the FAQ interaction.

## Preview

From the repository root, with nvm and pnpm available:

```sh
nvm install
nvm use
pnpm dlx http-server@14.1.1 website -a 127.0.0.1 -p 4188 -c-1
```

Open http://127.0.0.1:4188. Stop with Ctrl+C. This uses the existing `http-server` CLI, pinned at 14.1.1, bound to loopback with caching disabled. The first run downloads the preview tool through pnpm; there is no website build step or project dependency installation. For a fully offline preview, open `website/index.html` directly.

## Deployment

[Deploy landing page](../.github/workflows/website-pages.yml) publishes this repository's GitHub Pages project site when `website/` or the workflow changes on `main`. It can also be run manually from the Actions tab on `main`. Other branches cannot deploy. Concurrent deployments finish in order rather than cancelling a publication in progress.

The build stages only `index.html`, `styles.css`, and `assets/` into `_site`, then uploads that directory with GitHub's Pages artifact action. It excludes this README, extension sources, playgrounds, dependencies, and repository metadata. No site generator or package installation runs. Keep asset links relative and navigation links fragment-based so the page works below `/syntaxiser/` as well as in local previews.

Repository Settings → Pages uses **GitHub Actions**, with the `github-pages` environment allowing only `main`. There is no project `CNAME` or DNS record: the project inherits the existing user site's `letsbuild.cloud` domain. Do not change another repository, the user site's deployment settings, or DNS to deploy this page. A different custom domain is separate work.

Before first publication, `/syntaxiser/` returned 404 and the user site's source tree and sitemap had no conflicting route (checked 15 October 2026). The initial publication was verified from the issue branch using a temporary environment permission; that permission and branch trigger were removed afterward. Future publications come from reviewed `main` changes.

After a deployment, open https://letsbuild.cloud/syntaxiser/ and perform the navigation/keyboard checks below. Confirm `styles.css` and all four `assets/` files return 200 beneath `/syntaxiser/`, with no missing resources or requests outside the project path until an external link is followed. Check the existing https://letsbuild.cloud/ home page, `/about.html`, `/posts.html`, and `/rust-quick-reference.html` still work. Inspect the Actions run and its `github-pages` environment URL if publication fails; rerun on `main` after resolving the failure. To roll back, revert the website change on `main` and let the workflow republish.

## Browser support and review captures

The stylesheet uses native CSS nesting, including component-local responsive rules. Use a current browser with [native CSS nesting support](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting/Using). No CSS preprocessor or bundler is needed.

Full-page [desktop](../docs/screenshots/website-desktop.png) and [mobile](../docs/screenshots/website-mobile.png) captures are committed for content and visual review. They show this local page at 1440px and 390px wide, rather than a deployed site.

To refresh all three sidebar assets and the page review captures:

```sh
nvm use
pnpm install
pnpm compile
pnpm --dir playground/web install --ignore-workspace --frozen-lockfile
pnpm --dir playground/web exec playwright install chromium
node scripts/capture-website.cjs
```

The capture script uses the existing pinned Playwright dependency from the web playground. It instantiates `ReferenceSidebar` to obtain production markup, loads the production CSS/highlighting/sidebar scripts, and supplies only VS Code’s host bridge and dark-theme variables. Rust context extraction and retrieval use the exact editor excerpt displayed in the hero, with no manual card selection. It verifies that excerpt, the first rendered card’s exact catalog code, search visibility and pins. The page checks cover 320/390/768/1024/1440px widths, image loading, skip-link focus and keyboard FAQ activation with page JavaScript disabled. The committed assets are viewport captures; content continues below the image, as it does in the scrolling sidebar.

## Content and assets

- Copy describes contextual examples, separate syntax overviews, pins, and lessons directly. The page uses a neutral dark palette with blue accents to relate to the extension in VS Code.
- Language/library claims match main’s catalogs and README at the latest content revision (including merged JavaScript/JSX and SQL support). Built-in lesson coverage is deliberately described as varying by language. Update copy as support changes.
- The hero separates an editor excerpt from the current Context sidebar capture. A cursor near `.iter()` produces related curated reference snippets and separate Quick reference topics. The extension does not analyze the excerpt into an explanation panel or execute it to show a result. Individual reference cards have optional information popovers; those describe the bundled example.
- `assets/context.png`, `search.png`, and `pins.png` are generated from the current production sidebar renderer, real Rust catalog and retrieval results. The captions disclose the omitted VS Code outer frame and static capture controls. Search uses `handle a missing value`; pins show two collapsed cards from those results. The older root documentation screenshots are retained separately.
- `assets/book.svg` is an original small book mark. All assets are local, with system fonts and the repository's MIT license.
- The source installation path uses the repository's pinned `.nvmrc` and pnpm, with VS Code 1.93+ matching `package.json`. There is no marketplace link or availability claim.
- `website/` is excluded from VSIX packaging; it has no effect on extension runtime or offline behavior.

## Manual review

1. Preview at 320, 390, 768, 1024, and 1440 pixels wide. Check the header, hero, code, screenshots, installation steps, and footer. Only long code blocks may scroll horizontally; the page must not.
2. Follow **Install from source** and **Get the extension** to installation; **See features** and **Explore** to the learning tour. Verify the hero, search and pins image links open their full local images.
3. Tab from a fresh page. The skip link appears on focus; navigation, calls to action, image links, and FAQ summaries show a visible focus outline. Activate a FAQ with Enter/Space and close it again. Verify keyboard navigation at mobile widths too.
4. Disable JavaScript: all content, navigation, screenshots, and FAQ disclosures still work. At 200% zoom, text remains legible and the columns stack as space narrows. Enable reduced motion to disable smooth scrolling.
5. Verify each GitHub/install/license link and compare the install instructions with the root README. In a disposable checkout, use those documented source-build commands, then install the generated VSIX using VS Code's command palette.
6. With browser developer tools open, reload. Check for missing assets, console errors, and network requests to third parties. In a local preview, no requests should leave loopback until you follow an external link; on the deployed site, page resources should stay beneath `https://letsbuild.cloud/syntaxiser/`.
7. In the extension, paste the hero’s four-line Rust excerpt into `main.rs` and place the cursor immediately after `.iter()`. With search cleared and Context selected, compare the Quick reference topics and first example with the hero capture (currently `iterator-ownership`, followed by `let-mut` and `iterator-fold`). Click a snippet to copy it; use its pin control and Reference link. Search `handle a missing value`, pin two results, and collapse them to compare the lower captures. Results may differ when surrounding code, recent edits or catalog versions differ; the reproducible capture starts with no symbols or recent edits.

The extension's regression suite runs separately with `pnpm test`. No new browser dependency is required to maintain this page.
