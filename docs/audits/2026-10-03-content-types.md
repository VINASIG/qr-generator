# Static QR content and technical controls

Date: 3 October 2026. Scope: extend VINASIG QR Generator in response to the owner's request for useful QR content formats and technical options while retaining a compact interface. The starting checkout was clean on `main` at `f0eacaf359f9d59e735ed198b19aaf060bb11a06`.

## Decisions and research

The initial release supported URL/text and Wi-Fi. The updated selector provides nine choices: URL/text, Wi-Fi, email, phone call, SMS, contact, location, calendar event and file link. Only the selected form is visible and enabled. Contact/event extras, technical settings and output inspectors use native disclosures and start closed. Space Grotesk, VINASIG assets, tokens, existing motion and desktop layout are retained.

Email, SMS and contact describe encoded content, not distinct QR symbol families. The product continues to generate standard Model 2. Micro QR, rMQR, SQRC, Frame QR, GS1/FNC1 and structured append require different use cases or encoder support and were not added. Primary references and format choices are recorded in [RESEARCH.md](../RESEARCH.md); the small original qualitative review does not establish demand for every new format.

Advanced settings expose error correction L/M/Q/H, a 4/8/12-module white border, version Auto or 1-40, and mask Auto or 0-7. Default M and automatic version/mask remain. Approximate correction percentages refer to codewords, not a guaranteed area of visible damage. Too-small explicit versions and correction-level capacity failures produce targeted errors; the 2,000-UTF-8-byte application cap remains. One actual matrix supplies both PNG and self-contained SVG.

File link encodes an existing HTTP(S) URL to an image, PDF or other file. No upload or binary-file embedding is claimed. Phone inputs require an explicit country code. Email uses a documented common-address subset. vCard 3.0 and iCalendar use escaping and UTF-8-safe folding. Timed events convert the displayed local browser time zone to UTC; all-day dates encode an exclusive end date. Scanner and destination-app interpretation can vary, including SMS body handling and non-ASCII decoding.

No dependencies, permissions, accounts, destination requests, QR APIs, redirects, analytics or payload storage were added. Calendar UUIDs and timestamps are local event metadata. Clear removes all types' input, restores output defaults and closes optional settings. Edits invalidate old exports; asynchronous rendering cannot restore outdated content.

## Findings and corrections

Before images and failed iteration reports are preserved under `output/responsive/features-2026-10-03/`. They are separate from final captures.

| Finding                                                              | Route, viewport and state                                     | Cause and correction                                                                                                                                                                                                  | Evidence                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Advanced settings caused horizontal overflow                         | `/qr-generator/`, WebKit at 320/360/390 px, 200% root text    | Long native-select options and large inline padding imposed intrinsic width. Shorten option labels, retain full explanations in helper text and cap horizontal control padding. Keep the enlarged 32 px control font. | `before-webkit-320-text-200-advanced.png` and matching geometry JSON; final advanced-state captures |
| Native date/time values were cut off despite passing page geometry   | `/qr-generator/`, calendar at 320 px, 200% root text          | A combined native datetime control could not display its segments within the available width. Separate date and time controls, preserving local-time semantics, labels, keyboard input and all-day behavior.          | `before-calendar-text-200.png`; `review-calendar-320-text-200.png` across all three engines         |
| Clear did not consistently reset expanded settings in an early draft | `/qr-generator/`, all formats, expanded extras/settings       | Reset cleanup was mistakenly placed in the delayed download URL cleanup. Move it into the native-reset completion path. URL cleanup only revokes the URL.                                                             | Iteration 1 failure report; Clear and 60-second cleanup regressions                                 |
| Calendar boundary metadata could be invalid                          | Pure event builder, year boundary and malformed UUID fixtures | Validate the UTC year after local conversion and require a correctly structured UUID.                                                                                                                                 | Unit boundary tests in `tests/payloads.test.ts`                                                     |

Two test/environment corrections are distinguished from product defects. A time-zone assertion assumed one alias rather than the browser's actual IANA identifier; it now also checks the UTC offset and exact known event bytes. The Firefox keyboard fixture assumed Home/ArrowDown/Enter behavior after dismissing a native touch popup; standard letter typeahead followed by Tab works in all three engines and retains the exact Wi-Fi assertion, with additional focus/visibility/security assertions. No test was skipped or assertion weakened.

The existing global Firefox installation failed to launch with `spawn UNKNOWN`. Official browsers were installed in the ignored, repository-owned `output/tooling/playwright` cache. Firefox then launched successfully. This does not identify an operating-system cause, and no global browser/security setting was changed.

## Local verification

| Check                 | Observed result                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source gates          | PASS: Astro diagnostics with zero errors/warnings/hints, typed ESLint and Stylelint with zero warnings, formatting and 37 managed standards files / 3,631 instruction bytes                                                          |
| Unit tests            | PASS: 76 tests, no skips; independent decoding, format escaping/folding, QR options/capacity, calendar/time-zone boundaries and invalid-input targeting                                                                              |
| Production build      | PASS: one static route; generated HTML, canonical URL, JSON-LD, sitemap, external notices and eight preserved brand/font digests checked                                                                                             |
| Final browser matrix  | PASS: 384/384, all three engines, no failures, skips or retries; 14.9 minutes on this local Windows host                                                                                                                             |
| Native keyboard smoke | PASS: Chromium, Firefox and WebKit, 3/3 after the fixture correction                                                                                                                                                                 |
| Lighthouse            | PASS: six cold lab runs, three mobile and three desktop; mobile median LCP 1,733.46 ms, desktop 403.80 ms; all CLS 0 and TBT 0; performance 99 mobile / 100 desktop and accessibility, best practices and SEO 100 on all six reports |

The final matrix contains 384 cases, 128 for each of Chromium, Firefox and WebKit, with two workers, no retries and no skips. Existing source checks, per-test timeout, assertions and performance budgets remain. The workflow's overall verification-job limit changes from 20 to 30 minutes to accommodate the expanded workload; it still requires every engine on both Windows and Linux before deployment.

The only page route is `/qr-generator/`. Tested sizes are 320×800, 360×800, 390×844, 440×800, 600×800, 759×1024, 760×1024, 761×1024, 768×1024, 900×800, 1023×768, 1024×768, 1439×900 and 1440×900. The 759/760/761 sizes bracket the existing CSS breakpoint. The matrix combines normal and 200% root text with idle, error, long-success, Wi-Fi and advanced states. The seven new forms additionally run at all five required sizes in both themes and at 320 px with 200% text and relevant disclosures open.

Checks use actual rendered pages, scroll through the page, save full-page screenshots and collect DOM/computed-style geometry. Actual PNG and SVG downloads are independently decoded. Coverage includes field errors and focus, native selects/keyboard/touch, optional disclosures, all-day transitions, version/correction recovery, stale-export invalidation, delayed rendering, reset, offline creation after load, unavailable-script behavior and absence of payload network requests/cookies/storage. Axe WCAG 2/2.1/2.2 A/AA checks cover the tested states; these are narrower than complete accessibility certification.

Visual review opened the baseline sheet, five layout sheets, all ten form sheets covering seven new formats at five sizes in both themes, calendar/advanced crops at 320 px with 200% text in all three engines, and five output sheets showing contact/event/SMS previews and inspectors across the three engines. Full originals are retained alongside the review crops. Long single-line editable inputs may scroll within the control. No global overflow masking, zoom scaling, hidden functionality or new UI library was introduced.

Local raw evidence:

- `output/responsive/features-2026-10-03/before/`: baseline captures and geometry.
- `output/responsive/features-2026-10-03/`: final captures, visual-review sheets, regression before images and archived failed iterations.
- `output/playwright/`: current machine-readable and HTML browser reports.
- `output/lighthouse/features-2026-10-03/before/` and `after/`: all twelve raw reports, HTML and summaries.

Against the initial published-code baseline measured with the same browser and settings, local median LCP increased by 148.67 ms mobile and 39.18 ms desktop. Both remain below the unchanged 2,500 ms budget; no speed improvement is claimed. Measurements use cold navigation, 390×844 with simulated 150 ms / 1.6 Mbps / 4× CPU and 1440×900 with 40 ms / 10 Mbps / 1× CPU. TBT is not field INP.

## Publication and limits

This audit is prepared before the authorized commit and push. Exact-commit CI, Pages deployment and live-site verification are NOT_RUN at this preparation point. Final receipts will be retained under ignored `output/publication/features-2026-10-03/`, with remote HEAD, both platform jobs, deployment SHA, anonymously accessible resources and actual published exports checked. The public [Actions history](https://github.com/VINASIG/qr-generator/actions) provides the published workflow outcome.

Physical-device/printed scans, actual calls/messages, contact/calendar imports, Wi-Fi connection, screen-reader sessions, field vitals, search dashboards, fresh Codex discovery and an independent SI-agent trial are NOT_RUN. Emulated WebKit does not establish physical Safari rendering or behavior. Automated decoders confirm encoded bytes, not every destination application's action. Browser/OS tools can independently retain downloads/input and hosting receives ordinary asset requests.
