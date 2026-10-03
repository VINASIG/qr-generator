# Standards integration

The project adopts the `web-typescript` profile from VINASIG/agent-standards version 0.1.0, a public preview, at commit `7c699d1dccd05c1dd2c4f0de4bb3abae23174ccd`.

The reviewed offline bundle digest is `bd59e07ba80969e9e5b6788a9438e81ba14a6e22ce121e6ef192ef89f54cd07f`. A dry-run plan was reviewed before import. The local `.vinasig/provenance.json` pins this source and manifest digest. The marked AGENTS.md block and 38 managed payloads are checked for integrity. Seven task-specific skills are installed under `.agents/skills/`.

The Astro consumer adapts the strict reference profile with Astro's strictest TypeScript config, explicit declaration checking, the Astro ESLint parser, generated-HTML validation and checks of actual CSS. Typed ESLint remains strict with zero warnings. Runtime, browser and product behavior require separate tests.

The formatter ignores immutable snapshot files and AGENTS.md's managed block. Owner code and documentation remain formatted. No global Codex settings, MCP servers or runtime packages are installed by the standards importer.

The offline doctor and local integrity gate do not establish that a fresh Codex session discovered every skill, or that an unfamiliar SI agent can complete the product task. Those outcomes remain NOT_RUN unless separately observed.

## Interface rules approved on 3 October 2026

The owner requested this standards update across VINASIG. LANG-004 requires natural punctuation, sentence case and custom list markers in authored interfaces. LANG-005 requires ordinary-reader language and limits parenthetical labels. Required code, URLs, times, regulatory identifiers, official names and user input retain their correct syntax.

WEB-008 requires matching closed and opened dropdown, calendar, color and slider controls. Operating-system popups do not satisfy the requirement. The snapshot includes `templates/web/interface.mjs` for rendered-copy and control regressions. Consumer tests exercise real routes and dynamic states. Visual, keyboard and ordinary-language review remain necessary.

## Header rules approved on 4 October 2026

The owner approved original transparent horizontal logos selected for the actual header surface under WEB-001. Keep the source asset bytes, proportions and internal artwork. Avoid white panels, padded or rounded cards and artwork effects. Maintain the accessible logo link and its usable target independently of image size.

This reviewed snapshot adds `inspectHeaderBrand` to `templates/web/interface.mjs`. The consumer browser regressions check the real header alongside rendered copy. Asset integrity, screenshot review and script-unavailable states remain separate checks.
