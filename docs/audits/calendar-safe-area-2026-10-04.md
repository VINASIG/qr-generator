# Calendar internal safe area

## Reproduced defect

The published event calendar reused the same zero-padding surface as the military BMI calendar. At 1440x900, its first-column selected day was only 2 CSS px inside the inner border. Independently padded title/navigation rows and a full-width grid produced inconsistent gutters despite passing viewport-containment checks.

Immutable public before captures are in `output/responsive/calendar-safe-area-2026-10-04/before-qr/chromium/`. Dates and event data are synthetic fixtures.

## Source correction

- Both start and end calendars share `src/styles/date-control.css`. Their surface owns padding of `clamp(16px, 3vw, var(--space-6))`, normally 24 px on desktop and at least 16 px on narrow screens.
- Title, navigation, grid and footer align to that gutter. Spacing tokens separate rows and preserve the bottom padding after scrolling.
- Day buttons use the full width of each of the seven fixed-layout columns. Removing redundant margins preserves readable two-digit numbers at 320 px with 200% text without shrinking the font or hiding content.
- The popup can use almost the full narrow viewport. Explicit viewport centering prevents a page scrollbar from shifting it beyond an edge in WebKit. The transform only positions the popup and does not scale any content.
- Long titles and weekday headings can wrap. Fixed-size navigation/close targets, modal behavior, color tokens and height limits remain intact.

No QR payload, generation, export, date/time interpretation, translation, identity artwork, font byte or dependency changed.

## Permanent regression and operating guidance

`tests/browser/calendar-spacing.spec.ts` separately tests both calendars in both languages/themes, all 14 existing viewport sizes, 100%/200% text and Chromium/Firefox/WebKit. It measures four internal gutters, actual row/day bounds, selected/focused first and last columns, the final scrolled footer, 44 px day heights, readable number text, Escape, restored focus and preserved input. Subpixel geometry has a 0.5 px comparison tolerance. Existing keyboard, event payload, privacy and accessibility checks remain enabled.

The project-owned section of `AGENTS.md` now requires internal-gutter observations. The generated standards block and pinned snapshot remain intact.

## Release evidence

Local source checks, 90 unit tests, the production build and all 12 bilingual Lighthouse runs passed. All 24 added browser tests passed, covering 672 calendar viewport/text/locale/theme/engine combinations across the two date fields. The full pre-existing browser suite and exact-commit CI/deployment outcomes are retained separately in the ignored release receipt.

Require `npm run check`, `npm test`, `npm run build`, the full `npm run test:browser` and `npm run test:performance` before publication. Review before/after top and bottom screenshots, then verify exact-commit CI, deployment and the actual published interface.

The ignored `output/calendar-safe-area-*.log` files retain each local gate. Final local captures are in `output/responsive/calendar-safe-area-2026-10-04/after-v3/`. The sibling military BMI audit driver retains both sites' final local geometry in its `output/calendar-safe-area-after-v3.json`. Published observations are stored separately in `live/` and a release receipt. Real devices, screen readers and field metrics are NOT_RUN.
