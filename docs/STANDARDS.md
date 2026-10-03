# Standards integration

The project adopts the `web-typescript` profile from VINASIG/agent-standards version 0.1.0, a public preview, at commit `76901601b193c963b849b253d11f51363b447ffe`.

The reviewed offline bundle digest is `bb555aad2e5c66da8ba2cdd5530446ca95c1235bb28706cb82066222adcb61f1`. A dry-run plan was reviewed before import. The local `.vinasig/provenance.json` pins this source and manifest digest. The marked AGENTS.md block and 38 managed payloads are checked for integrity. Seven task-specific skills are installed under `.agents/skills/`.

The Astro consumer adapts the strict reference profile with Astro's strictest TypeScript config, explicit declaration checking, the Astro ESLint parser, generated-HTML validation and checks of actual CSS. Typed ESLint remains strict with zero warnings. Runtime, browser and product behavior require separate tests.

The formatter ignores immutable snapshot files and AGENTS.md's managed block. Owner code and documentation remain formatted. No global Codex settings, MCP servers or runtime packages are installed by the standards importer.

The offline doctor and local integrity gate do not establish that a fresh Codex session discovered every skill, or that an unfamiliar SI agent can complete the product task. Those outcomes remain NOT_RUN unless separately observed.

## Interface rules approved on 3 October 2026

The owner requested this standards update across VINASIG. LANG-004 requires natural punctuation, sentence case and custom list markers in authored interfaces. LANG-005 requires ordinary-reader language and limits parenthetical labels. Required code, URLs, times, regulatory identifiers, official names and user input retain their correct syntax.

WEB-008 requires matching closed and opened dropdown, calendar, color and slider controls. Operating-system popups do not satisfy the requirement. The snapshot includes `templates/web/interface.mjs` for rendered-copy and control regressions. Consumer tests exercise real routes and dynamic states. Visual, keyboard and ordinary-language review remain necessary.
