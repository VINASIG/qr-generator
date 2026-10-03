# Interface writing and control audit

## Scope and cause

The owner requested organization-wide correction of visible punctuation, ordinary-reader labels, sentence case and complete custom controls. This repository adopts LANG-004, LANG-005 and WEB-008 through the pinned standards installer.

The previous select fields styled their closed surface while their opened menus used platform presentation. Event date and time inputs opened operating-system popups. Some labels used parentheses or slash separators. Source corrections retain all nine payload types, exact protocol syntax, local-only processing and independently decoded exports.

## Source corrections

- Rewrite optional fields and authored status text as natural prose. QR payloads and user data retain their exact syntax.
- Add a custom combobox controller with viewport-bounded option panels, typeahead, arrow navigation, Home/End, Escape cancellation, form reset and synchronized disabled/invalid states.
- Hide the original selects with a specific CSS rule. A broad field style had overridden the hidden attribute and exposed duplicate native controls.
- Observe disabled fieldsets as well as selects. The Wi-Fi security picker must enable when its content panel becomes available.
- Synchronize reset after the native reset action and notify the external image-size picker when Clear restores its default.
- Add a calendar with direct date entry, leap-year validation, keyboard day/month/year navigation, focus containment, clear and dismissal controls.
- Keep direct time entry for any minute alongside styled quarter-hour presets.
- Focus pointer-opened comboboxes explicitly for WebKit keyboard behavior.
- Render a disabled, styled select presentation from the first HTML response. The controller reuses it once loaded. Blocked or disabled JavaScript never exposes platform select menus.

The source changes are in `src/components/ContentFields.astro`, `Field.astro`, `DateInput.astro`, `SelectControl.astro`, `src/lib/calendar.ts`, `src/pages/index.astro`, the generator and custom control scripts/styles, and the calendar/browser tests. Managed files are updated by the standards installer.

## Executed verification

Strict type, JavaScript, CSS, formatting and snapshot checks pass. All 81 unit tests pass. The static build passes HTML/metadata validation and verifies every preserved asset digest.

The custom-control suite passed 15 Chromium cases at the five standard viewports and 320 px. It exercises both themes, pointer opening, keyboard selection/cancellation, calendar bounds, date/time validation, reset and accessibility. Browser tests additionally inspect authored copy after successful and invalid real generation flows rather than only the initial page.

The initial full rendered-inspector run passed 453 cases but rejected all three blocked-script cases because native selects remained exposed. Those failures led to the initial-state source correction above. All 78 targeted regressions then pass across three engines, including interface copy, advanced settings, custom controls and unavailable scripts. An independent 12-case probe also verifies disabled/blocked scripts in QR Generator and Web Design System. No native-preference rule, timeout, retry or privacy assertion is relaxed.

Before and after default screenshots are preserved under `output/responsive/ui-language-2026-10-03/`. Contact sheets for every required viewport and both themes were opened. The 320 px open calendar was also inspected at full size. Browser result artifacts retain actual open dropdowns and generated payload states.

The final complete browser matrix passes all 456 cases across Chromium, Firefox and WebKit. It includes decoding, privacy, export, responsive layouts, keyboard controls and disabled/blocked JavaScript. The recorded run is `interface-ssr-final14` and its completion log is `agent-standards/output/ui-language-2026-10-03/qr-browser-final14.log` in the organization workspace. Commit and publication status are verified separately against the remote revision.

Automated decoding does not establish scanning behavior on a physical phone. Browser emulation and axe checks do not certify assistive-technology support.
