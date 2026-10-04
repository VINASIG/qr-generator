# Automatic QR generation

Date: 4 October 2026. Scope: English `/` and Vietnamese `/vi/`.

## Reproduction and implementation

The previous production build required Create QR code after entering valid content. Chromium baseline captures cover both languages and themes at 390x844 and 1440x900. Immutable full-page and workspace screenshots are in `output/responsive/automatic-input-2026-10-04/before`. The shared task manifest is `../qr-generator/output/automatic-input-before.json`.

Content, type, technical options and PNG size now schedule generation after a 200 ms pause. Every edit immediately clears the old preview, inspector values and export blobs. A revision guard rejects older asynchronous PNG callbacks. Clear stays usable while generation is pending and cancels pending output. The encoder, payload builders, export formats, quiet zones and byte limits are unchanged.

There is no visible creation button. Automatic updates retain input focus and scroll position. Input errors are shown after blur, with incomplete fields kept quiet during input. Capacity errors follow the encoder check. Enter explicitly validates eligible single-line fields. Native form semantics retain a hidden, initially disabled submit control for this keyboard path. The HTML validation rule remains enabled. Script initialization enables input and actions only after handlers are installed.

IME composition postpones generation. Open encoded/technical inspectors retain their disclosure state through successful updates. Reset explicitly closes them. Data stays local and unsaved.

## Regression coverage

`tests/browser/automatic-input.spec.ts` covers automatic result/export updates, focus and scroll, invalidation/recovery, rapid edits, IME, PNG size, error correction and cancellation after Clear. Actual PNG downloads are independently decoded with jsQR. Existing content, export, privacy, keyboard, responsive, accessibility and failure tests now use the automatic flow without removing their decoder or quality assertions.

Both routes run in Chromium, Firefox and WebKit. The new flow has both themes at 360x800, 390x844, 768x1024, 1024x768 and 1440x900, plus 320x800 with 200% text. Existing tests retain 14 widths, 100%/200% text, the 759/760/761 breakpoint checks and all nine content types.

The synthetic IME regression sets the field value and dispatches an `InputEvent` with `isComposing` between composition start and end. Mixing synthetic composition start with Playwright's Firefox `fill()` caused an extra native start/update/end sequence, which ended the simulated session. This was observed in `output/automatic-input-composition-diagnostic.log`. The corrected setup retains the assertions for postponed encoding and exact output. All six locale/engine cases passed their focused rerun.

## Verification evidence

`npm run check` passed TypeScript/Astro, ESLint, Stylelint, formatting, standards integrity and licensing. `npm test` passed 90/90. `npm run build` passed both language pages, HTML validation, metadata and preserved asset checks. The complete `npm run test:browser` run passed 681/681 across Chromium, Firefox and WebKit, including 84 new automatic-input cases. The final report has zero skipped, unexpected or flaky tests. Logs are under `output/automatic-input-*.log`, with browser results in `output/playwright/report.json`.

Full-page captures and focused input/result viewport captures were opened at all five required sizes and 320x800 with 200% text. The inspected selection covers both languages/themes, Firefox tablet/desktop and WebKit mobile. The automatic preview, disabled stale exports, retained input focus, validation/capacity errors and wrapped mobile layout match the DOM and geometry checks. Before captures remain separate. Images are in `output/responsive/automatic-input-2026-10-04`, including `before`, `after` and additional existing-flow captures at the run root. The focused visual manifest is `output/automatic-input-visual-workspaces.json`.

`npm run test:performance` passed 12 cold Lighthouse runs, with three runs per language and form factor. Median mobile LCP was 2278 ms in English and 2290 ms in Vietnamese. Desktop medians were 526 ms and 529 ms. Median CLS and TBT were zero in every group. The unchanged budgets are LCP <=2500 ms, CLS <=0.1 and TBT <=200 ms. Reports are in `output/lighthouse/after/summary.json` and `output/lighthouse/after/vi/summary.json`.

Real devices, printed codes, screen readers and field performance are NOT_RUN. Local browser emulation does not establish those outcomes.
