# HTML depth expansion (#77)

Baseline: main `5c3b0b9` contains 17 topics, 17 independent overviews and 17 practical cards. This change preserves every original card object and ID, expands seven existing topics, and adds ten grouped topics with two distinct tasks each: **27 topics, 27 overviews, 52 practical cards**. Ten existing HTML lessons retain their IDs, prerequisites, difficulty, checks and unsolved starters; four receive more specific learning references. Counts describe inventory; the assertion and scope matrices below describe the delivered behavior.

## Versions, surroundings and source review

Use Node **26.3.0** from `.nvmrc`, pnpm, and the existing `playground/web/pnpm-lock.yaml`: **Playwright 1.62.1**, **Bootstrap 5.3.8**, **Tailwind CSS/CLI 4.3.3**. Native content follows the HTML Living Standard, reviewed on 2026-10-16 against WHATWG document, form, dialog, popover, image, media, iframe and table specifications. Modern Chromium is the automated target; dialog, Popover API, dynamic import and media codec support must be checked before targeting older browsers. Firefox/Safari and assistive-technology speech are manual compatibility work, not claimed by Chromium DOM assertions.

Full-document examples supply their own doctype/head; fragments receive a neutral standards-mode shell with title/lang/charset. `html-fixtures.cjs` supplies only documented local dependencies, pinned framework CSS and the form surrounding the original input fragment. It is shared by automated and generated manual fixtures. Catalog inline scripts are executed unchanged. Defer/async companion files are explicit local prerequisites described by the cards. Nothing in the extension executes these examples; markup stays escaped in the sidebar.

## Before/after scope matrix

Each overview ID is independently authored in `packs/html-reference.json` and grouped in `packs/html.json`; practical IDs below are solved tasks in the latter. The new topic IDs are also required by `coverage/languages.json`. Framework setup stays in the playground, separate from syntax/API overviews.

| Scope | Baseline overview/cards | Delivered overview → additional practical IDs | Primary source / supported assumptions |
| --- | --- | --- | --- |
| Head metadata, language/direction, URL base | `document` / one minimal document | `document` → `document-direction`, `document-base` | [Metadata](https://html.spec.whatwg.org/multipage/semantics.html); UTF-8, independent lang/dir, local HTTP origin |
| Classic defer, async and modules | `assets` / stylesheet + module | `assets` → `assets-defer`, `assets-async`, `assets-module-error` | [Scripts](https://html.spec.whatwg.org/multipage/scripting.html); local companion files, module HTTP loading |
| Landmarks/headings/sections | `semantics` / one article | `semantics` → `semantics-sections`, `semantics-navigation` | [Sections](https://html.spec.whatwg.org/multipage/sections.html); named regions and distinct navigation names |
| Machine time/data, quotation | `text` / emphasis and escaping | `text` → `text-machine-values`, `text-quotation` | [Text](https://html.spec.whatwg.org/multipage/text-level-semantics.html); explicit +08:00 offset, work citation rather than person |
| Caption and grouped header relationships | `tables` / simple scoped cells | `tables` → `tables-complex`, `tables-empty` | [Tables](https://html.spec.whatwg.org/multipage/tables.html); unique same-table th IDs, two-level headers, empty inventory |
| Labels, fieldsets, legend, datalist/select | `forms`, `choices` / simple controls | **`form-groups`** → `form-groups-radio`, `form-groups-suggestions` | [Form elements](https://html.spec.whatwg.org/multipage/form-elements.html); nested/explicit labels, optional suggestions versus constrained choice |
| Autocomplete/inputmode | `inputs` / email hint | **`form-hints`** → `form-hints-address`, `form-hints-code` | [Autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill); four-digit postal/six-digit local code, leading zeros, hints aren't validation |
| Readonly/disabled | `buttons` / disabled button | **`form-state`** → `form-state-readonly`, `form-state-fieldset` | [Entry lists](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-entry-list); text readonly, disabled fieldset/first-legend exception |
| Multipart uploads | No dedicated coverage | **`upload`** → `upload-avatar`, `upload-batch` | [File input](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)); disposable endpoint, repeated file parts, accept is only a hint |
| Constraint feedback/recovery | `inputs` / email and min/max | **`validation`** → `validation-pattern`, `validation-custom` | [Validation API](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-constraint-validation-api); invalid blocks submit, clear custom validity and stale errors |
| Native modal focus/validation | No dedicated reference/example | **`dialog`** → `dialog-confirm`, `dialog-edit` | [Dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element); showModal, Escape, method=dialog, formnovalidate cancellation |
| Nonmodal disclosure | `details` / retained native disclosure | **`popover`** → `popover-auto`, `popover-manual` | [Popover](https://html.spec.whatwg.org/multipage/popover.html); native auto/light dismiss versus explicit manual hide |
| Responsive picture and resolution | `images` / one lazy image | **`responsive-images`** → `picture-art-direction`, `picture-resolution` | [Images](https://html.spec.whatwg.org/multipage/images.html); local SVG candidates with truthful intrinsic widths, fresh density-1 contexts |
| Audio/video and captions/fallback | No dedicated coverage | **`media`** → `media-video`, `media-audio` | [Media](https://html.spec.whatwg.org/multipage/media.html); local silent VP8 WebM/PCM WAV/WebVTT/transcript, no autoplay |
| Iframe title and sandbox | No dedicated coverage | **`iframe`** → `iframe-static`, `iframe-script` | [Frames](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element); empty sandbox versus allow-scripts opaque origin, trusted local srcdoc |
| Bootstrap forms/navigation/disclosure | `bootstrap` / button + alert | `bootstrap` → `bootstrap-validation`, `bootstrap-disclosure` | [Validation](https://getbootstrap.com/docs/5.3/forms/validation/), [navigation](https://getbootstrap.com/docs/5.3/components/navs-tabs/); pinned 5.3.8 CSS, native details rather than unwired JS collapse |
| Tailwind semantic form/status components | `tailwind` / responsive card | `tailwind` → `tailwind-form`, `tailwind-status` | [State variants](https://tailwindcss.com/docs/hover-focus-and-other-states); pinned 4.3.3 compiler scans exact catalog, responsive 767/768 boundary |

Unchanged `links`, `lists`, `images`, `forms`, `inputs`, `choices`, `buttons`, `details`, `accessibility` and `data` retain their original assertions, source links and grouped navigation. No new CSS language work is included.

## Exact-source assertion matrix

`scripts/check-html-catalog.cjs` parses all 52 unchanged card strings in Chromium. `scripts/check-html-depth.cjs` asserts the additions below. Every new topic has independent happy, meaningful boundary and rejection/recovery evidence across its two tasks. Registration is mirrored in `playground/web/html-evidence.json` and the common manifest. Neither DOM parsing nor shared relationship checks claim full HTML conformance validation.

| Practical cards | Happy outcome | Boundary / rejection / recovery assertions |
| --- | --- | --- |
| `document-direction`, `document-base` | Arabic lang/RTL computed direction, description, English LTR/bdi isolation; relative guide and root help URL | Root-relative link retains origin; static contracts only, no fabricated runtime error branch |
| `assets-defer`, `assets-async`, `assets-module-error` | Deferred action binds after parsing; independent widget updates; module label appears | Missing async dependency keeps fallback; missing import is caught; successful reload recovers |
| `semantics-sections`, `semantics-navigation` | Named region/complementary/main, exact headings; independently named nav and article | Shared missing-name/duplicate-ID checks; static semantics only |
| `text-machine-values`, `text-quotation` | Exact machine values and readable labels; quotation/citation text | No invented clickable citation; no date parser/formatter claimed |
| `tables-complex`, `tables-empty` | Caption/name, exact value → row/group/column mappings | Empty row spans two columns; missing/misplaced th references rejected; controlled broken-header mutation must fail |
| `form-groups-radio`, `form-groups-suggestions` | Group name and one selected radio serialize; chosen season/custom Kale serialize | Radio exclusivity; nonlisted datalist value allowed; empty required select rejected |
| `form-hints-address`, `form-hints-code` | Hints/keyboard tokens and exact leading-zero FormData values | Empty, alphabetic and too-short values rejected; correct lengths recover; autofill UI isn't simulated |
| `form-state-readonly`, `form-state-fieldset` | Readonly focus/submission, first-legend toggle enables address | Disabled data omitted; empty readonly bypasses required as specified; enabled empty street invalid, disabling it recovers |
| `upload-avatar`, `upload-batch` | Native POST boundary header, exact file payload bytes, repeated filenames, local response | Required empty selection rejected; accept permits a disallowed MIME to reach disposable endpoint; 415 response then valid retry succeeds |
| `validation-pattern`, `validation-custom` | Valid code/name produces exact local status | Empty submission blocked; bad format/reserved name produces associated text/aria-invalid; editing clears stale/custom errors and recovers |
| `dialog-confirm`, `dialog-edit` | Accessible modal name, native :modal state, initial focus, explicit save/status | Empty save stays open; formnovalidate Cancel works; Escape closes; all closes restore opener focus |
| `popover-auto`, `popover-manual` | Native show/hide without custom roles | Auto Escape/outside close versus manual persistence; nonexistent target does nothing, restored target opens; broken target mutation rejected |
| `picture-art-direction`, `picture-resolution` | Real image loads and expected currentSrc at 320/1000 | Removing source selects img fallback; missing selected image has naturalWidth zero but accessible alt, restoring dependency loads successfully |
| `media-video`, `media-audio` | Real metadata/duration, play/pause, video caption cue and transcript link | Missing source shows exact fallback status, dependency recovery clears it; native source-list error differs from direct media src error |
| `iframe-static`, `iframe-script` | Heading remains; allowed local script posts expected status | Empty sandbox blocks script; allow-scripts child cannot access parent DOM, parent cannot access opaque frame DOM; forged wrong-source message rejected |
| `bootstrap-validation`, `bootstrap-disclosure` | Valid email status/actual computed success border; named navigation/current-page marker | Empty/bad email reveals associated feedback; correction hides it; native disclosure Enter/Space opens/closes |
| `tailwind-form`, `tailwind-status` | Valid quantity/computed styles/focus; named region and status | Empty/0/11 invalid versus 1/10 valid; actual invalid CSS color; responsive column counts at 320/767/768/1200; keyboard disclosure toggles |

The original exact-card matrix and supplied application behavior remain in [the playground README](../playground/web/README.md#exact-html-catalog-evidence-71). Historical edge/error findings for static original topics remain visible in the common audit. This expansion does not erase them or equate an arbitrary DOM mutation with an application failure. New dynamic error fixtures use real missing dependencies, native invalid states, blocked sandbox access or multipart requests.

The upload endpoint is a disposable transport demonstration, bounded to 1 MiB and never stores files. Its MIME-header allowlist is deliberately not production content validation. Media fixtures are generated locally with `node scripts/generate-media-fixtures.cjs`; the video is a silent title card with a changing bottom strip, and the WAV is silence. The committed bytes allow normal tests without recording tools. Tests assert events/state rather than depending on network timing or sleeps. Responsive candidate selection uses a clean routed environment; user-agent/cache/density choices in other environments may differ.

## Run and manually review

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm install --ignore-scripts
pnpm --dir playground/web install --frozen-lockfile --ignore-scripts
pnpm --dir playground/web exec playwright install chromium
pnpm --dir playground/web build
pnpm test
pnpm check:web
node scripts/check-web-pack.cjs --mutation-check
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime html > /tmp/syntaxiser-html-runtime.json
node scripts/generate-html-fixtures.cjs
pnpm --dir playground/web serve
```

Open `http://127.0.0.1:4173/catalog.html`. Each linked page embeds the exact practical card and documented local dependencies. The test origin supplies its upload response in-process; manual pages use the disposable loopback endpoint. Metadata/URL examples need DevTools; base example navigation targets are illustrative routes rather than a complete site. To manually exercise dependency failures, use browser request blocking for optional-tools.js, garden.webm or garden.wav and reload; remove blocking to recover.

1. Open a generated HTML example in the primary checkout and the installed Syntaxiser sidebar. Search `fieldset legend`, `input autocomplete`, `file upload form`, `dialog focus restore`, `responsive picture` and `accessible table headers`; relevant solved examples should appear in the first three. Clear search and move through multiline attributes, incomplete dialog/popover tags and local Bootstrap imports. Comments, prose, data-note values and script bodies must not suggest those topics accidentally.
2. Copy an example and a separate Reference overview; markup must stay literal in the sidebar. Pin a new HTML card, switch to CSS then Rust/TypeScript, return and reload; the HTML pin and existing lesson progress must survive. Browse all four HTML reference groups and topic-specific primary links. All ten new topics have an overview plus at least two distinct examples.
3. In the browser, use keyboard radio/legend/select controls, enter an unlisted datalist crop, try postal/code invalid inputs, toggle shipping and inspect FormData. Upload one and multiple local disposable files; the example does not save them.
4. Open both modal examples by keyboard. Try empty Save, Cancel, Escape and valid Save; focus must return to the invoking button. Compare auto/manual popover outside-click and Escape behavior. Check visible text feedback; DOM assertions do not establish actual screen-reader announcements, so review with assistive technology separately.
5. Resize pictures and framework cards around their breakpoints; inspect currentSrc/computed styles. Play/pause local media, inspect the caption track and transcript. Verify empty sandbox blocks scripts and the interactive opaque frame cannot access its parent. Check narrow sidebar copy/pin controls using the retained UI.

Content review is separate from deterministic checks: overview forms, assumptions, native-first semantics, version claims and task differences were reviewed against the primary sources linked above. All original lesson starters remain unsolved; no lesson scaffolding or solutions were added.
