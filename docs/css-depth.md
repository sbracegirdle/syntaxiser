# CSS depth expansion (#78)

Baseline: 20 topics, 20 practical cards and 20 overviews. Result: 28 topics,
55 practical cards and 28 independently authored overviews. All original card
objects, lesson IDs, task starters and progress keys are preserved. Eight new
required-topic units are enforced by the common manifest. Existing topic units
are deepened rather than duplicated for selector/cascade/flex/grid/library work.

## Supported runtime and surroundings

Node 26.3.0 / pnpm 11.21.0; unchanged web lock pins Playwright 1.62.1,
Bootstrap 5.3.8 and Tailwind/CLI 4.3.3. Browser evidence uses Chromium
151.0.7922.34 from Playwright's pinned browser bundle. Native rules require modern
evergreen support for :has, cascade layers, logical properties, subgrid and
overflow:clip. Successful assertions establish this browser's capabilities,
not universal version support. For older browsers use feature queries and a
reviewed fallback. SCSS/Less, embedded style routing and full browser conformance
are outside this scope. Bootstrap overrides load after its local distribution;
Tailwind directives are compiled by the pinned CLI for each exact catalog card.
No CDN, public request, account or credentials are used in checks.

Each card's explanation names its required HTML classes, surrounding elements,
state and library assumptions. The exact HTML surroundings live in
`playground/web/css-fixtures.json`; assertions consume the catalog stylesheet
directly. Only error/boundary cases deliberately change conditions or append a
competing rule. Every case starts with a fresh document and media/viewport state.
The Bootstrap component check also calculates actual foreground/background contrast (at least 4.5:1). The checker seeks or finishes animation/transition timelines deterministically.
Real Bootstrap and Tailwind styles participate in the computed-value assertions.

## Before/after scope and source matrix

| Overview ID / group | Practical cards before → after | Added distinct practical tasks | Primary or learning source |
| --- | --- | --- | --- |
| selectors (Foundations) | 1 → 3 | `selectors-where`, `selectors-has` | [Source](https://www.w3.org/TR/selectors-4/) |
| cascade (Foundations) | 1 → 3 | `cascade-revert-layer`, `cascade-defaults` | [Source](https://www.w3.org/TR/css-cascade-5/) |
| box (Foundations) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model) |
| values (Foundations) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) |
| colors (Styling) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color) |
| typography (Styling) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font) |
| display (Layout) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/display) |
| flexbox (Layout) | 1 → 4 | `flex-minimum`, `flex-distribute`, `flex-shrink` | [Source](https://www.w3.org/TR/css-flexbox-1/) |
| grid (Layout) | 1 → 4 | `grid-auto-fit`, `grid-subgrid`, `grid-placement` | [Source](https://www.w3.org/TR/css-grid-2/) |
| position (Layout) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position) |
| overflow (Layout) | 1 → 2 | `overflow-clip` | [Source](https://www.w3.org/TR/css-overflow-3/) |
| states (Interaction) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible) |
| pseudo-elements (Interaction) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::before) |
| media (Responsive design) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media) |
| container (Responsive design) | 1 → 1 | Original card retained | [Source](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@container) |
| variables (Foundations) | 1 → 2 | `variables-scoped` | [Source](https://www.w3.org/TR/css-variables-1/) |
| transitions (Interaction) | 1 → 2 | `transition-properties` | [Source](https://www.w3.org/TR/css-transitions-1/) |
| animation (Interaction) | 1 → 2 | `animation-seek` | [Source](https://www.w3.org/TR/css-animations-1/) |
| bootstrap (Libraries) | 1 → 3 | `bootstrap-responsive`, `bootstrap-focus` | [Source](https://getbootstrap.com/docs/5.3/customize/css-variables/) |
| tailwind (Libraries) | 1 → 3 | `tailwind-components`, `tailwind-motion` | [Source](https://tailwindcss.com/docs/functions-and-directives) |
| logical (Layout) | 0 → 2 | `logical-direction`, `logical-vertical` | [Source](https://www.w3.org/TR/css-logical-1/) |
| intrinsic (Layout) | 0 → 3 | `intrinsic-labels`, `intrinsic-fluid`, `intrinsic-compare` | [Source](https://www.w3.org/TR/css-sizing-3/) |
| replaced (Layout) | 0 → 2 | `replaced-cover`, `replaced-contain` | [Source](https://www.w3.org/TR/css-images-3/) |
| stacking (Layout) | 0 → 2 | `stacking-contained`, `stacking-isolate` | [Source](https://www.w3.org/TR/css-position-3/) |
| sticky (Layout) | 0 → 2 | `sticky-heading`, `sticky-column` | [Source](https://www.w3.org/TR/css-position-3/) |
| wrapping (Styling) | 0 → 2 | `wrapping-long`, `wrapping-expand` | [Source](https://www.w3.org/TR/css-text-3/) |
| preferences (Responsive design) | 0 → 2 | `preferences-motion`, `preferences-colors` | [Source](https://www.w3.org/TR/css-color-adjust-1/) |
| counters (Interaction) | 0 → 2 | `counters-sections`, `counters-marker` | [Source](https://www.w3.org/TR/css-lists-3/) |

The matrix covers specificity/inheritance/reset/layers and :is/:where/:has;
logical direction/writing modes; fit-content and bounded min/max/clamp sizing;
media aspect ratios/object fitting; flex growth and automatic minimum traps;
grid auto-fit/minmax, sparse placement and subgrid; stacking context isolation,
sticky vertical/horizontal containers, clip/hidden and full-text expansion;
variable scoping/invalid token fallback; motion, forced colors and visible focus;
counters/generated decoration, transition/animation variants, and real framework
responsive/state/token boundaries. Existing general topics retain their cards.

## Independently inspected assertion cases

| Exact card ID | Happy outcome | Boundary outcome | Rejection, invalid state or recovery outcome |
| --- | --- | --- | --- |
| selectors-where | Type selector beats :where class. | Consumer class override wins. | Unsupported selector rule is rejected; working rules survive. |
| selectors-has | Valid input is unmarked. | Required empty email becomes invalid. | Malformed email is marked; recovery checked after valid fill. |
| cascade-revert-layer | Theme and layer opt-out differ. | Unlayered normal author declaration outranks both layers. | Invalid author override is ignored. |
| cascade-defaults | Inherited/noninherited defaults differ. | Parent change affects only inherited reset. | Bad spacing is rejected, unset remains. |
| logical-direction | LTR start is left. | RTL start is right. | Invalid logical length is rejected. |
| logical-vertical | Axes transpose. | Horizontal mode remaps the same properties. | Unsupported writing mode is ignored. |
| intrinsic-labels | Short label shrink-wraps. | Long unbroken label stays bounded. | Negative width is rejected. |
| intrinsic-fluid | Middle fluid interval. | Minimum heading and aside sizes. | Invalid function operand is ignored; maximum heading applies. |
| replaced-cover | Square box and crop policy. | Ratio preserved at half size. | Invalid ratio ignored; reserved square remains. |
| replaced-contain | Logo fits fixed box without cover crop. | Narrow slot keeps full-content fit policy. | Unavailable image keeps reserved box and alt text; no CSS repairs network failure. |
| flex-minimum | Title shrinks beside fixed action. | Small available space still reaches action. | Removing both protections reproduces automatic minimum overflow. |
| flex-distribute | Growth ratio. | Same ratio in a constrained row. | Negative grow is rejected. |
| grid-auto-fit | Three tracks fit. | Sub-minimum viewport does not overflow. | Unsafe fixed minimum reproduces overflow. |
| grid-subgrid | Children inherit track sizes. | Parent track changes propagate. | Malformed subgrid value is ignored. |
| grid-placement | Featured spans two tracks; last enters next row. | Full-row featured card. | Zero span is invalid and ignored. |
| stacking-contained | Parent context bounds huge child index. | Raising parent context changes paint order. | Increasing only child cannot repair parent ordering. |
| stacking-isolate | Isolated negative generated layer. | Transform supplies an additional context trigger. | Invalid isolation override is ignored. |
| sticky-heading | Header stays at panel top. | At final scroll position header stays bounded. | Missing inset reproduces non-sticking header. |
| sticky-column | Leading header stays visible. | Maximum scroll retains header. | Without horizontal inset header scrolls away. |
| overflow-clip | Clipping policy. | Clip cannot scroll programmatically. | Hidden is not equivalent: it creates programmatic scroll. |
| wrapping-long | Emergency breaks fit width. | Empty message keeps width but has no text height. | Default wrapping reproduces unbroken overflow. |
| wrapping-expand | Truncation declaration available while closed. | Expanded text wraps without overflow. | Removing emergency breaks reproduces expanded long-name overflow. |
| variables-scoped | Scoped token and missing fallback. | Subtree override beats inherited token. | Defined invalid color token invalidates at computed value time; navy fallback does not run. |
| preferences-motion | Default motion enabled. | Preference disables animation. | Unresolvable animation name runs nothing; text remains. |
| preferences-colors | Keyboard-compatible focus outline. | Forced colors retains border and focus geometry. | Invalid override cannot remove working outline. |
| counters-sections | Counter reset/increment and generated expression inspected. | Offset numbering starts from a supplied boundary. | Noninteger increment is rejected. |
| counters-marker | Generated supplemental marker. | Optional class removes marker only; fixture still has native required input. | Invalid generated content ignored; semantic label remains. |
| transition-properties | Explicit property list. | Opening reaches exact final opacity without wall-clock sleep. | Reduced-motion recovery changes state immediately. |
| animation-seek | Halfway interpolation. | Endpoint with fill both. | No animation leaves base content visible. |
| bootstrap-responsive | Wide row and component token override. | Just below breakpoint and disabled state. | Invalid custom token defeats component background; fallback is not automatic. |
| bootstrap-focus | Real Bootstrap variable boundary. | Visible focus retained. | Native disabled state suppresses action. |
| tailwind-components | Compiled token and responsive state. | Narrow layout and keyboard focus. | Invalid token crosses real compiled utility boundary. |
| tailwind-motion | Compiled motion-safe variant. | Reduced motion has no animation. | Missing keyframe name creates no live animation; visible status remains. |
| flex-shrink | 60px negative free space splits 40px/20px by base size. | At the exact sum of bases no shrinking occurs. | Disabling shrink reproduces overflow below total base size. |
| intrinsic-compare | Longest-word minimum differs from unwrapped line maximum. | Unbroken identifier increases the intrinsic minimum. | Unsupported intrinsic keyword is rejected. |

All 35 new cards have parse and behavioral registrations, with 105 independently
asserted situations. Eight new topics have happy/edge/error evidence. Historical
registration gaps for unchanged original topics remain visible in the audit;
this expansion does not claim that a property parse proves behavioral coverage.
Every original native card retains the existing declaration parsing check.
The original Tailwind input retains its existing pinned playground build.

CSS invalid declarations normally recover by retaining valid earlier rules,
rather than throwing JavaScript exceptions. Other negative fixtures deliberately
reproduce layout overflow, lost sticky positioning, invalid token resolution or
a broken image. Those are detected states, not claims CSS repairs application
errors. Counter tests inspect reset/increment/generated expressions, not a
resolved spoken numbering string. Object-fit checks verify box geometry and fit
policy, not pixel-perfect source cropping. Forced-color emulation verifies
preserved border/outline geometry, not every OS high-contrast palette. Focus and
DOM checks do not establish screen-reader speech or a full accessibility audit.
Contrast must be checked on the actual surface; #166534 on white is about 7.1:1.

## Run and manually review

Follow `playground/web/README.md` for frozen dependencies and browser setup.

```sh
source ~/.config/nvm/nvm.sh
nvm use
pnpm --dir playground/web install --frozen-lockfile --ignore-scripts
pnpm --dir playground/web build
node scripts/check-css-catalog.cjs --mutation-check
pnpm check:web
pnpm test
pnpm audit:coverage --check
node scripts/lesson-coverage.cjs --check
pnpm audit:runtime css > /tmp/syntaxiser-css-runtime.json
node scripts/check-css-catalog.cjs --generate
pnpm --dir playground/web serve
```

Open `http://127.0.0.1:4173/css-catalog.html`. Links expose exact-source fixtures;
the gallery lists the HTML assumptions and each independent case action. Reload
between cases. In DevTools change viewport (767/768/900), direction, writing-mode,
scroll position, reduced-motion and forced-colors. Inspect computed values,
layout tracks and timeline endpoints, and reproduce the negative conditions.
Native form validation should recover when a valid email replaces malformed input.
Use keyboard Tab on the framework/native buttons and expand the full filename.

In VS Code open `packs/css.json` only to inspect inventory; for contextual testing
open its generated css-catalog/*.css file or copy a card's CSS into a standalone .css file. Search **flex min width overflow**,
**grid auto fit**, **stacking context**, **sticky scroll container**,
**logical properties**, **reduced motion**; the intended concrete task is in the
first three cards. Move through logical declarations, sticky insets, subgrid,
layer resets and framework directives, including an incomplete declaration.
Put those words in comments, content strings and misleading class names; they
must not become property cues. Import the local Bootstrap CSS and Tailwind input.
Copy and pin a new task, browse its separate grouped overview/source links,
switch to HTML/Rust and back, reload, and confirm pins/lesson progress persist.
Four existing lesson instructions gain prerequisite guidance only; task starters
remain unsolved and unchanged. Lessons and practical solutions stay separate.

Six catalog-only controlled mutations must fail: flex minimum, unsafe grid
minimum, physical instead of logical spacing, missing sticky inset, reduced-motion
regression and broken layer opt-out. No catalog file is changed by mutation runs.
Regular extension tests remain offline/browser-free. Test registration is a map
to inspected assertions, not proof of exhaustive rendering or content quality.
