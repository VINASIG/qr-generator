# Verification

## Calendar internal spacing regression

`tests/browser/calendar-spacing.spec.ts` measures all four internal gutters separately from the popup's viewport bounds. Calendar rows, day buttons and the final scrolled footer must remain at least 16 CSS px inside the surface. Both start and end calendars check selection and focus in the first and last columns, 44 px day heights, readable day text, Escape and restored focus across 14 widths, 100%/200% text, both languages/themes and Chromium/Firefox/WebKit. Open top and bottom screenshots alongside the geometry results.

Use the pinned Node/npm runtime. Run source checks, unit tests and the production build first, then browser and lab checks. CI requires Chromium, Firefox and WebKit on Windows and Linux. Local omissions must be named and cannot be set in CI.

Unit tests independently decode module pixels with jsQR and check exact links, whitespace, Unicode, capacity, Wi-Fi escaping/quoting, quiet zones and safe self-contained SVG. Browser tests decode downloaded PNGs with the same independent decoder and decode the browser-rendered vector preview. They verify input edits and size changes disable stale exports, errors recover, clear removes data, and no cookies/storage/payload requests are added.

The Wi-Fi Clear regression was reproduced against the first deployed build. It verifies native reset and the visible mode agree, both modes' values disappear, text receives focus, old exports stay disabled and a new downloaded code decodes correctly. Field updates run after native reset completes.

The no-script regression checks JavaScript disabled and the client module blocked. Data fields have no form serialization names, and creation starts disabled until initialization finishes. Button and keyboard attempts must leave the URL unchanged and send no payload request.

The product routes are English `/` and Vietnamese `/vi/` on the canonical qr.vinasig.io.vn domain. The viewport matrix covers the five VINASIG sizes, 320 px, 440, 600, 759/760/761 around the actual layout breakpoint, 900, 1023 and 1439 px. Each width uses 100% and 200% root text with idle, error, long-success/expanded and Wi-Fi states. Export flows also check light/dark and both motion preferences. Styled controls retain native form values and are exercised with keyboard and touch.

`CAPTURE_PHASE=before` records initial draft screenshots and refuses to overwrite them. Normal verification writes after screenshots. Open images as well as checking DOM bounds. Keep evidence in output/responsive, output/playwright and output/lighthouse. The initial draft had a base-path logo failure which was observed visually and fixed in the asset helper.

Lighthouse keeps three comparable cold mobile and desktop reports. The adopted median budgets are LCP <= 2500 ms, CLS <= 0.1 and TBT <= 200 ms. TBT does not measure field INP. Performance reports describe their browser/throttle setup.

Automated accessibility and independent screen decoder checks are partial evidence. Physical printed scans, actual Wi-Fi connection, screen readers, fresh Codex discovery, independent SI-agent use, field vitals and search dashboard outcomes require separate observations and remain NOT_RUN unless recorded.

## Dropdown indicator regression

`tests/browser/interface.spec.ts` runs the imported `inspectControlIndicators` on primary and expanded settings, including every visible ordinary dropdown. It asserts the expected controls and markers exist before checking geometry. The arrow's SVG box needs at least a 16 CSS px inner trailing inset and a 12 CSS px selected-value gap. Declared icon dimensions, wrapping, initial disabled HTML and keyboard behavior remain required.

`tests/browser/control-indicators.spec.ts` adds real-controller cases for long selected values with 200% text at 320 px, Wi-Fi security, both locales/themes and script-unavailable HTML at 390 px. These cases run through the existing three-engine browser command. Open their `long-enlarged.png`, `long-enlarged-open.png` and `initial-html.png` alongside the before/after captures. Geometry does not replace visual inspection.

## Expanded content and settings regression

`tests/payloads.test.ts` checks RFC-oriented email, global phone/extension, SMS, vCard, coordinates, file URLs and iCalendar. Cases cover reserved punctuation, UTF-8, CRLF, header/property injection, escaping/folding, coordinate bounds, invalid/reversed/leap dates, inclusive all-day input and UTC conversion. `tests/qr.test.ts` covers L/M/Q/H, every mask, all borders, minimum-version errors and byte/numeric capacity differences. The shared test helper independently decodes matrix pixels with jsQR.

Browser cases check each new type at the five standard sizes in light and dark. They decode actual downloaded PNG/SVG, validate errors/focus, one active form, clear/stale output and no content requests/cookies/storage. SVG is rasterized at an integer multiple of its exported grid before independent decoding, so a tiny preview's sampling is not mistaken for corrupt vector data.

Additional cases cover each new form at 320 px with 200% root text and expanded extras/settings. Existing intermediate/breakpoint cases also open settings and technical details. Settings cases cover every option's invalidation, capacity/version errors, border geometry, clear defaults and delayed URL cleanup. Calendar cases verify separate date/time controls at 200% text, missing-time focus, preserved dates/times when toggling all-day and exclusion of disabled times from all-day output. They fix the browser timezone to Asia/Ho_Chi_Minh and verify UTC bytes; the visible zone must match the engine's resolved IANA name because some return the equivalent Asia/Saigon alias.

Set `CAPTURE_RUN=features-2026-10-03` to put screenshots and geometry/style reports in `output/responsive/features-2026-10-03/`. Initial before evidence remains immutable in its separate `before/` directory. Reports contain fixture data only. Opening screenshots is still required; geometry/decoding do not validate visual layout or a native operating-system popup.
