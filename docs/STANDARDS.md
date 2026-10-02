# Standards integration

The project adopts the `web-typescript` profile from VINASIG/agent-standards version 0.1.0, a public preview, at commit `c9d33c73a89edaf1773fa4d31f1c7258e549b7b1`.

The reviewed offline bundle digest is `ad5dcbe4601a9a3668d3433330a582e6d780b8f2527e1dcc8cfbb93f8f264870`. A dry-run plan was reviewed before import. The local `.vinasig/provenance.json` pins this source and manifest digest. The marked AGENTS.md block and 37 managed payloads are checked for integrity. Seven task-specific skills are installed under `.agents/skills/`.

The Astro consumer adapts the strict reference profile with Astro's strictest TypeScript config, explicit declaration checking, the Astro ESLint parser, generated-HTML validation and checks of actual CSS. Typed ESLint remains strict with zero warnings. Runtime, browser and product behavior require separate tests.

The formatter ignores immutable snapshot files and AGENTS.md's managed block. Owner code and documentation remain formatted. No global Codex settings, MCP servers or runtime packages are installed by the standards importer.

The offline doctor and local integrity gate do not establish that a fresh Codex session discovered every skill, or that an unfamiliar SI agent can complete the product task. Those outcomes remain NOT_RUN unless separately observed.
