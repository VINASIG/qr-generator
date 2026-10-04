# Complete control surface audit

Reviewed on 4 October 2026 for the owner's organization-wide control task.

## Implementation

The custom listbox still exposed platform scrollbar arrow buttons. The shared stylesheet explicitly authors track/thumb/buttons in Chromium and WebKit, and uses supported standard scrollbar colors/width in Firefox. The conditional Wi-Fi and all-day checkboxes receive visible styled marks. Existing date/time panels remain authored. Vietnamese weekday labels are readable names rather than CN/T2-style abbreviations. Regression uses the final content choice and final time preset, checks real scrolling and supported scrollbar parts, opens the calendar, checks its viewport fit, verifies password visibility and preserves native form reset.

The published WebKit review also found the advanced-settings glyph above its summary text. Its old absolute position ignored the summary padding. The shared glyph now uses normal inline flow and a measured text gap. The conditional-control regression captures and checks the actual padded summary in closed/open states in both locales and themes across all three engines.

## Approved standards

The offline installer applied the reviewed bundle from agent-standards commit `00fd107bfc651d4eb9cf7f34cf5e0a9f2ee93ee9`, digest `efe05f654da53716186663ff3186623e521003fbc82eedc624a4c46d0cc8adef`. Installation plans and doctor reports remain under the standards repository's ignored output. The imported owner-instruction block and owned snapshot were updated through that installer. Runtime Codex skill discovery remains NOT_RUN.

## Browser verification

The local production-preview sweep covered 20 Chromium cases over routes `/`, `vi/` in both languages and both themes. It used 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. Each case traversed the whole page scroll range, captured full-page images or all segments of a long page, and checked page width, runtime errors, interface copy, control surfaces, ordinary indicators and the header.

A separate 48-capture state review exercised the changed and retained controls at 390 x 844 in Chromium, Firefox and WebKit, both locales and themes. Opened images and contact sheets were inspected.

Screenshots remain in `output/responsive/control-surfaces-2026-10-04/`, separated into immutable before captures, after captures, per-engine state images and forced-colors checks where relevant. The organization matrix and state reports remain in the QR Generator checkout's ignored output. Automated geometry is separate from visual inspection.

The focused interface suite passed 120 cases across three engines. The final conditional-control rerun also checks actual scrollbar buttons/thumbs according to each engine's supported CSS properties. No assertion, performance budget or existing decoding/privacy test was removed.

## Publication and limits

Source checks and unit tests passed before commit. Website builds passed. Exact-commit CI, deployment status and actual published-page inspection are recorded separately in `agent-standards/output/control-surfaces-final.json` and the QR Generator checkout's `output/control-surfaces-live-chromium.json` after publication. Do not infer deployed status from a local build.

The surface guard is structural, not a visual or accessibility certification. This audit uses browser emulation, not physical devices or a screen reader. Native file-selection, print and permission dialogs belong to the browser or operating system. System controls are a deliberate forced-colors fallback, not the normal-theme design.
