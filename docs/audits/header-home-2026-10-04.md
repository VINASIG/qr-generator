# Header logo and homepage review - 4 October 2026

## Scope and source change

The owner requested original transparent header artwork on every VINASIG website and a native logo link to https://vinasig.io.vn/. Fresh before captures of both locales and light/dark at 360 and 1440 px already show the correct transparent exports. The link destination needed a consistent organization-home contract. The earlier owner screenshots do not establish the revision served in this fresh review.

The shared header/sidebar now uses the explicit canonical homepage link with a localized accessible name. Project navigation and GitHub source links remain distinct. Primary Color is used on light surfaces and Reversed on dark surfaces. The design-system sidebar stays dark in both themes. Artwork bytes, dimensions and CSS presentation are preserved.

## Verification before publication

- Existing source checks, all 90 unit tests and the production build passed.
- Chromium checked 20 route/theme/viewport states at 360 by 800, 390 by 844, 768 by 1024, 1024 by 768 and 1440 by 900. Both locales and every shared-layout route, including existing 404 pages, are included.
- Normal, focus and hover presentation passed the transparent-header, actual-surface, aspect-ratio, 44 px target and canonical-destination guard. Pages were scrolled and screenshots captured. Logo contact sheets were opened and inspected.
- At 360 and 1440 px, actual native logo clicks opened https://vinasig.io.vn/. No measurements or files were submitted.
- Primary Color and Reversed consumer SVGs matched the Brand Assets originals by SHA-256. The existing source fixture suite passed 108 cases across Chromium, Firefox and WebKit, including native click/keyboard activation and deliberately wrong destinations.

## Standards and artifacts

The reviewed snapshot pins source commit `3dc9486b3cba4d7d7c4375fa145d73e53b6137a2` and bundle SHA-256 `eb0d35d45c774fa157fc64763f8bd235d5a7b7ed8c860819c1ce524d76c6d939`. The installer diff and dry run were reviewed before updating managed files. Owner instructions outside the marked block were preserved. Installed-byte and provenance gates passed. WEB-001 and inspectHeaderBrand now reject a wrong homepage destination without weakening existing geometry or presentation rules.

Immutable before evidence, after screenshots and geometry are under ignored `output/responsive/header-home-2026-10-04/`. Full project browser/interaction matrices and deployment are subsequent exact-commit CI gates, not results predicted by this source audit. Live verification is captured after deployment. Physical devices, screen readers and independent SI-agent trials were not run.
