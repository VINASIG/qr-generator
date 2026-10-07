# VINASIG QR Generator

This static Astro and TypeScript project creates traditional QR codes locally. Read README.md, docs/PRODUCT.md, docs/BRAND.md and docs/TOOLCHAIN.md before changing the product.

- Keep the primary flow short. Encode URL or text exactly as entered, or build the documented Wi-Fi, email, phone, SMS, vCard, geo and iCalendar payloads. Image/PDF/file codes contain a direct HTTP(S) link, not an upload. Keep optional details and advanced settings collapsed by default. Export black-on-white PNG and SVG with at least a four-module quiet zone. Do not inject VINASIG branding or a redirect into generated codes.
- Generate automatically from input and option changes after a 200 ms typing pause. Keep input focus and scroll position. Invalidate stale exports immediately, cancel pending work on edits/reset/navigation, and guard asynchronous callbacks with the current revision. Do not encode unfinished IME composition. Show text-field validation on blur or explicit Enter without interrupting typing. No primary create button is needed.
- Display input errors immediately below their own control and include the local message in aria-describedby. The form status summarizes the problem instead of repeating a distant error. Reveal a disclosure containing an invalid field without moving focus or scrolling. Finish pointer clicks before inserting blur errors so reflow cannot swallow an action. Cancel deferred validation on edits, reset or type changes. Verify actual field-to-message spacing, recovery and Clear on every supported locale/theme. Clear all uses an outlined button, a decorative Lucide icon and a specific visible label. Check reset from a focused invalid field, including pointer intent before blur reflow.
- Do not add accounts, tracking, analytics, remote QR APIs, persistent payload storage, cookie prompts or a server dependency without a user request.
- Preserve supplied VINASIG assets and font notices. This product adopts the shared Bright Playful Minimalism proposal. Use local Space Grotesk, semantic tokens and Lucide interface icons. Simple Icons is reserved for third-party marks when needed.
- Keep public copy in reviewed Vietnamese and English. Keep technical documentation and commits in English. Respond to the user in Vietnamese. Use SI agents in VINASIG-authored terminology.
- Use the pinned Node and npm versions. Run npm run check, npm test and npm run build. UI changes require npm run test:browser and opened screenshots. Before publication run npm run test:performance, inspect the staged diff and verify remote HEAD, exact-commit CI and deployment.
- Source quality gates must remain strict. Tests independently decode generated PNG and SVG, verify exact payloads, quiet zones, stale-output invalidation, privacy, errors, keyboard, touch and responsive states. Never weaken an assertion or budget to pass.
- Store screenshots, traces, research captures and runtime tooling in ignored output/. Record durable decisions and measured limits under docs/audits/. A fresh Codex skill discovery, independent SI-agent trial, physical-phone scan and field metrics must be reported NOT_RUN unless actually performed.
- Respect existing user work and current authorization. Read LICENSES.md and BRAND_POLICY.md for the current grant and exclusions. Keep external notices. Commit and publish only within the current task authorization.
- Calendar content needs at least 16 CSS px of internal padding on every side, using the adopted spacing tokens. Measure actual content and first/last-column day buttons against the inner border, including selected and focused states. Scroll to the last content and check its bottom inset. Keep these checks at 320 px, 200% text, both locales/themes and all supported engines. Viewport containment alone does not establish a safe internal gutter.

## Canonical domain

The owner authorized the custom-domain migration on 4 October 2026. Publish this site at https://qr.vinasig.io.vn/ with an origin-root base. Preserve that domain in canonical/social metadata, sitemap, robots, package homepage, preview and browser assertions. Keep GitHub repository/source links intact. Read docs/DOMAIN.md. GitHub Actions deploys through the repository Pages custom-domain setting; a CNAME file alone does not configure an Actions deployment.

## Language and appearance

Read `docs/LOCALIZATION.md`. Both locales must include navigation, accessible names, validation, loading and result copy. Keep native reciprocal language links and locale metadata. Preserve technical identifiers, code and user content. Only finite theme/language preferences use parent-domain cookies or local fallback under WEB-011. Never save or send measurements, files or generator content. Verify both locales and themes before publishing.

## Shared header and footer

Read docs/SITE_CHROME.md before header or footer changes. Keep shared chrome consistent and run npm run test:chrome.
