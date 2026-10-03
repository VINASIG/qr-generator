# VINASIG QR Generator

This static Astro and TypeScript project creates traditional QR codes locally. Read README.md, docs/PRODUCT.md, docs/BRAND.md and docs/TOOLCHAIN.md before changing the product.

- Keep the primary flow short. Encode URL or text exactly as entered, or build the documented Wi-Fi, email, phone, SMS, vCard, geo and iCalendar payloads. Image/PDF/file codes contain a direct HTTP(S) link, not an upload. Keep optional details and advanced settings collapsed by default. Export black-on-white PNG and SVG with at least a four-module quiet zone. Do not inject VINASIG branding or a redirect into generated codes.
- Do not add accounts, tracking, analytics, remote QR APIs, persistent payload storage, cookie prompts or a server dependency without a user request.
- Preserve supplied VINASIG assets and font notices. This product adopts the shared Bright Playful Minimalism proposal. Use local Space Grotesk, semantic tokens and Lucide interface icons. Simple Icons is reserved for third-party marks when needed.
- Keep public copy and technical documentation in concise English. Respond to the user in Vietnamese. Use SI agents in VINASIG-authored terminology.
- Use the pinned Node and npm versions. Run npm run check, npm test and npm run build. UI changes require npm run test:browser and opened screenshots. Before publication run npm run test:performance, inspect the staged diff and verify remote HEAD, exact-commit CI and deployment.
- Source quality gates must remain strict. Tests independently decode generated PNG and SVG, verify exact payloads, quiet zones, stale-output invalidation, privacy, errors, keyboard, touch and responsive states. Never weaken an assertion or budget to pass.
- Store screenshots, traces, research captures and runtime tooling in ignored output/. Record durable decisions and measured limits under docs/audits/. A fresh Codex skill discovery, independent SI-agent trial, physical-phone scan and field metrics must be reported NOT_RUN unless actually performed.
- Respect existing user work and current authorization. Read LICENSES.md and BRAND_POLICY.md for the current grant and exclusions. Keep external notices. Commit and publish only within the current task authorization.
## Canonical domain

The owner authorized the custom-domain migration on 4 October 2026. Publish this site at https://qr.vinasig.io.vn/ with an origin-root base. Preserve that domain in canonical/social metadata, sitemap, robots, package homepage, preview and browser assertions. Keep GitHub repository/source links intact. Read docs/DOMAIN.md. GitHub Actions deploys through the repository Pages custom-domain setting; a CNAME file alone does not configure an Actions deployment.

<!-- VINASIG STANDARDS BEGIN -->
## VINASIG SI agent standards 0.1.0

Read `.vinasig/standards/policies/core.md` and `language.md` before repository work. Respect platform instructions, current user authorization and local project guidance. Preserve unrelated changes. Never invent verification or weaken a quality gate to pass.

Active profile is `web-typescript`. Read `.vinasig/standards/profiles/web-typescript.md` and the task-relevant policies. Core is valid for CLI and documentation projects and installs no browser dependencies.

Use `$vinasig-workflow` for implementation work and `$vinasig-dependencies` when adding or upgrading dependencies. Report PASS, FAIL, NOT_RUN or NOT_APPLICABLE with evidence and reasons. Commit, push and publish only within the task authorization.

For license selection, imported material or distribution changes read `policies/licensing.md` and `LICENSES.md` inside the snapshot. LIC-001 through LIC-004 require purpose-based selection, authority and dependency review, separate documentation/font/data/brand rights, consistent SPDX metadata and delivery evidence. Importing this standard does not relicense the host project.

For UI changes read `policies/web.md` inside the snapshot. Apply LANG-004/LANG-005 to all visible copy and locales. WEB-001 requires original transparent header logos matched to the actual surface, without a padded or rounded logo card. WEB-008 requires styled open dropdowns, calendars, color choosers and sliders, including safe initial HTML before scripts load. Use `$vinasig-responsive` for layout/accessibility, `$vinasig-motion` for movement, `$vinasig-search` for SEO/AEO/GEO, `$vinasig-performance` for speed, and `$vinasig-agent-readiness` for browser-agent tasks. Space Grotesk, Lucide and Simple Icons follow their separate roles. Open and inspect real screenshots.

The local manifest pins the approved snapshot. A Markdown path is a reading instruction, not an automatic import. Stop and report unresolved conflicts with mandatory policy. Record approved exceptions with owner, reason and review date.
<!-- VINASIG STANDARDS END -->
