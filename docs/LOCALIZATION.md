# Language and appearance

English `/` and Vietnamese `/vi/` are independently rendered translations of the same website. Existing locale URLs and native links are preserved. The compact EN or VI link opens the equivalent page. With JavaScript, it also retains the current section fragment. Query strings and input values are never copied. The adjacent square button changes appearance, following the restrained controls on https://nhanaz.io.vn/. Both have localized accessible names and at least 44 px targets.

## Content maintenance

Maintain the authored English templates and reviewed `src/locales/vi.json`. The build-time transformer only handles trusted template copy and accessible labels. It never processes uploaded files or acts as a sanitizer. Translate errors, loading states and results as well as the initial page. Preserve file names, protocols, input values, source code, technical notation and user content.

Canonical URLs, reciprocal English and Vietnamese alternatives, document language and sitemap entries describe each real locale. Error pages are localized and remain excluded from indexing. Technical repository documentation and commits stay in English. New interface copy must pass the localization coverage test, rather than silently rely on English fallback.

## Preferences and privacy

The initial appearance follows the operating system and subsequent system changes, with light as the unavailable-API fallback. The default-language entrypoint uses the first supported browser/system language (Vietnamese or English), falling back to English. Independently linked explicit locale pages stay available when no manual language choice exists.

Deliberate theme and language choices are shared across HTTPS `vinasig.io.vn` and its subdomains using `__Secure-vinasig-theme` (`light`/`dark`) and `__Secure-vinasig-language` (`vi`/`en`). Each cookie has Domain=vinasig.io.vn, Path=/, Secure, SameSite=Lax and a one-year maximum age. Detected defaults write nothing. These are finite essential preferences, without identifiers or tracking. A valid older origin-local preference is migrated only if no shared preference exists. The shared cookie takes precedence and a successful migration removes the local copy.

Theme changes update open tabs without navigation. A language change from another tab navigates only an untouched page; trusted form, result, paste or drop interaction defers navigation until the next load. Explicit language links still navigate immediately. Section fragments are retained; queries and product state are not copied or persisted. Without JavaScript, native locale links remain available and appearance uses CSS system defaults.

Cookie denial, local development and downloaded files use optional origin-local `vinasig-theme`/`vinasig-language` fallback values. If storage is entirely blocked, the controls still work for the current page. Cross-site persistence applies within one browser profile; it cannot synchronize different devices, profiles or denied-cookie contexts.

No file, measurement, password, generator setting, secret, activity history or user content is stored or transmitted by this preference runtime. There is no preference API, iframe, remote script or translation request. Language navigation starts a fresh page; appearance changes preserve the existing inputs and results.

## Verification

Run the existing source checks, unit tests, build and browser suites. Localization regression tests cover native links, metadata, both themes, operating-system fallback, explicit persistence, blocked storage, keyboard operation, state retention, no-script content and reviewed copy coverage. Inspect real screenshots at mobile, tablet, desktop, breakpoint neighbors and enlarged text. Do not infer physical-device or screen-reader results from browser emulation.

## Shared-runtime verification

`checkSharedPreferences` exercises the actual built artifact under distinct controlled HTTPS subdomains in Chromium, Firefox and WebKit. The reviewed local source and normalized-LF SHA-256 are recorded in [SHARED_PREFERENCES.json](SHARED_PREFERENCES.json). Apply WEB-011 and its installed contract. An ecosystem interoperability check uses different actual consumers; local fixtures do not certify live deployment.
