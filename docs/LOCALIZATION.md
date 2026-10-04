# Language and appearance

English `/` and Vietnamese `/vi/` are independently rendered translations of the same website. Existing default-language URLs are preserved. No automatic language redirect or language storage is used. The compact EN or VI link opens the equivalent page. With JavaScript, it also retains the current section fragment. Query strings and input values are never copied. The adjacent square button changes appearance, following the restrained controls on https://nhanaz.io.vn/. Both have localized accessible names and at least 44 px targets.

## Content maintenance

Maintain the authored English templates and reviewed `src/locales/vi.json`. The build-time transformer only handles trusted template copy and accessible labels. It never processes uploaded files or acts as a sanitizer. Translate errors, loading states and results as well as the initial page. Preserve file names, protocols, input values, source code, technical notation and user content.

Canonical URLs, reciprocal English and Vietnamese alternatives, document language and sitemap entries describe each real locale. Error pages are localized and remain excluded from indexing. Technical repository documentation and commits stay in English. New interface copy must pass the localization coverage test, rather than silently rely on English fallback.

## Preferences and privacy

The initial theme follows the operating system. An explicit choice overrides that preference and is saved under `vinasig-theme` in local storage for this origin only. It does not synchronize across unrelated subdomains. When storage is blocked, switching still works for the current page. Language links and content work without JavaScript. The disabled theme button becomes usable after its handler is installed.

No files, measurements, generator inputs or activity history are saved or transmitted by these preferences. There are no tracking cookies or remote translation requests. A language navigation starts a fresh page and clears unsaved form or file state. A theme change preserves the current page, inputs and results.

## Verification

Run the existing source checks, unit tests, build and browser suites. Localization regression tests cover native links, metadata, both themes, operating-system fallback, explicit persistence, blocked storage, keyboard operation, state retention, no-script content and reviewed copy coverage. Inspect real screenshots at mobile, tablet, desktop, breakpoint neighbors and enlarged text. Do not infer physical-device or screen-reader results from browser emulation.
