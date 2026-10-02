# Verification

Use the pinned Node/npm runtime. Run source checks, unit tests and the production build first, then browser and lab checks. CI requires Chromium, Firefox and WebKit on Windows and Linux. Local omissions must be named and cannot be set in CI.

Unit tests independently decode module pixels with jsQR and check exact links, whitespace, Unicode, capacity, Wi-Fi escaping/quoting, quiet zones and safe self-contained SVG. Browser tests decode downloaded PNGs with the same independent decoder and decode the browser-rendered vector preview. They verify input edits and size changes disable stale exports, errors recover, clear removes data, and no cookies/storage/payload requests are added.

The Wi-Fi Clear regression was reproduced against the first deployed build. It verifies native reset and the visible mode agree, both modes' values disappear, text receives focus, old exports stay disabled and a new downloaded code decodes correctly. Field updates run after native reset completes.

The single route is `/qr-generator/`. The viewport matrix covers the five VINASIG sizes, 320 px, 440, 600, 759/760/761 around the actual layout breakpoint, 900, 1023 and 1439 px. Each width uses 100% and 200% root text with idle, error, long-success/expanded and Wi-Fi states. Export flows also check light/dark and both motion preferences. Native controls are exercised with keyboard and touch.

`CAPTURE_PHASE=before` records initial draft screenshots and refuses to overwrite them. Normal verification writes after screenshots. Open images as well as checking DOM bounds. Keep evidence in output/responsive, output/playwright and output/lighthouse. The initial draft had a base-path logo failure which was observed visually and fixed in the asset helper.

Lighthouse keeps three comparable cold mobile and desktop reports. The adopted median budgets are LCP <= 2500 ms, CLS <= 0.1 and TBT <= 200 ms. TBT does not measure field INP. Performance reports describe their browser/throttle setup.

Automated accessibility and independent screen decoder checks are partial evidence. Physical printed scans, actual Wi-Fi connection, screen readers, fresh Codex discovery, independent SI-agent use, field vitals and search dashboard outcomes require separate observations and remain NOT_RUN unless recorded.
