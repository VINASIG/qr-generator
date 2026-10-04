# Language and appearance audit

Date 4 October 2026. Scope is the existing qr-generator website.

## Implementation

English `/` and Vietnamese `/vi/`. Existing default URLs are preserved. Native EN and VI links open the equivalent page and retain its section fragment when JavaScript is available. Both languages are present in built HTML. Canonical, reciprocal locale alternatives and sitemap entries describe the actual pages.

A compact unframed square button follows the appearance controls on https://nhanaz.io.vn/. Controls have localized accessible names, visible keyboard focus and at least 44 CSS px targets. System appearance applies before painting. An explicit selection overrides it, with storage denial handled. Original transparent brand exports match the actual surface.

Only the theme preference uses local storage. User inputs and files stay local, are not stored or serialized in navigation URLs, and survive theme changes. Language navigation starts a fresh page. No new runtime dependencies were added.

## Observed local evidence

- Unit regression passed 90 cases. Source checks and production builds were run separately.
- Localization preferences were exercised in Chromium, Firefox and WebKit, including no-script navigation, metadata, system appearance, explicit persistence, denied storage, keyboard activation, current input retention and section links.
- All nine Vietnamese QR content types, exact independently decoded PNG payloads, validation, dropdowns and retained input state.
- The shared final matrix passed 40 cases for this website. It covers both languages and themes at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900, actual breakpoint neighbors and 200 percent text. Full-page traversal checks offscreen images and unintended document overflow.
- Screenshots were captured and representative mobile, desktop, light and dark images were opened. DOM geometry and automated accessibility checks supplement visual inspection.

Before and after matrix evidence is retained under the sibling favicon-forge checkout at ignored `output/responsive/localization-2026-10-04/`. This project's localized interaction screenshots remain under ignored `output/`. Before images were preserved.

## Verification boundaries

Initial concurrent full browser runs exhausted local machine resources and included timing failures. Affected cases were rerun with fewer concurrent processes. Exact 44 px controls are measured using DOM geometry because Firefox protocol boxes can round them to 43.999998 CSS px. No touch-target threshold or accessibility rule was relaxed.

The existing CI gates remain active for publication and rerun the complete suite on Linux and Windows. Exact-commit CI, lab-performance reports where configured, deployment and live-domain verification are post-commit evidence and are not predicted by this source audit. Physical devices, screen readers, field metrics and independent agent trials were not run. Browser emulation is not physical-device validation.
