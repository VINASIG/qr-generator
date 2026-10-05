# Standards integration

The project adopts the `web-typescript` profile from VINASIG/agent-standards version 0.1.0, a public preview, at commit `00fd107bfc651d4eb9cf7f34cf5e0a9f2ee93ee9`.

The reviewed offline bundle digest is `efe05f654da53716186663ff3186623e521003fbc82eedc624a4c46d0cc8adef`. A dry-run plan was reviewed before import. The local `.vinasig/provenance.json` pins this source and manifest digest. The marked AGENTS.md block and 47 managed payloads are checked for integrity. Seven task-specific skills are installed under `.agents/skills/`.

The Astro consumer adapts the strict reference profile with Astro's strictest TypeScript config, explicit declaration checking, the Astro ESLint parser, generated-HTML validation and checks of actual CSS. Typed ESLint remains strict with zero warnings. Runtime, browser and product behavior require separate tests.

The formatter ignores immutable snapshot files and AGENTS.md's managed block. Owner code and documentation remain formatted. No global Codex settings, MCP servers or runtime packages are installed by the standards importer.

The offline doctor and local integrity gate do not establish that a fresh Codex session discovered every skill, or that an unfamiliar SI agent can complete the product task. Those outcomes remain NOT_RUN unless separately observed.

## Interface rules approved on 3 October 2026

The owner requested this standards update across VINASIG. LANG-004 requires natural punctuation, sentence case and custom list markers in authored interfaces. LANG-005 requires ordinary-reader language and limits parenthetical labels. Required code, URLs, times, regulatory identifiers, official names and user input retain their correct syntax.

WEB-008 requires matching closed and opened dropdown, calendar, color and slider controls. Operating-system popups do not satisfy the requirement. The snapshot includes `templates/web/interface.mjs` for rendered-copy and control regressions. Consumer tests exercise real routes and dynamic states. Visual, keyboard and ordinary-language review remain necessary.

## Header rules approved on 4 October 2026

The owner approved original transparent horizontal logos selected for the actual header surface under WEB-001. Keep the source asset bytes, proportions and internal artwork. Avoid white panels, padded or rounded cards and artwork effects. Maintain the accessible logo link and its usable target independently of image size.

This reviewed snapshot adds `inspectHeaderBrand` to `templates/web/interface.mjs`. The consumer browser regressions check the real header alongside rendered copy. Asset integrity, screenshot review and script-unavailable states remain separate checks.

## Licensing adopted on 4 October 2026

The reviewed snapshot includes the licensing policy, LIC-001 through LIC-004, full GPL/CC texts, material map, brand policy, review template and license checker. It retains its own software/prose grants rather than setting this project's primary license. The owner separately selected this project's scopes in LICENSES.md. Use npm run check:licenses for source metadata/text verification. Web builds also verify published legal text and source notices. Original assets and existing gates remain required.

## Dropdown indicator spacing clarified on 4 October 2026

WEB-008 now requires at least 16 CSS px between the indicator SVG box and the inner trailing border, and 12 CSS px between selected text and the SVG box. The shared control uses existing spacing tokens and logical inline-end padding. Preserve the 20 px icon, wrapping, keyboard and form behavior in initial and enhanced HTML. Both use `data-control-value` and `data-control-indicator` markers.

Run the imported `inspectControlIndicators` on actual controls. The browser suite checks every primary/advanced trigger at the standard widths and breakpoint neighbors, both locales/themes, open options, long/enlarged selected text and unavailable scripts. Missing markers, crowded spacing, shrunken icons and clipping must fail. Inspect screenshots as well as geometry. The offline update was reviewed with diff and dry-run, then verified by doctor and the existing provenance gate.

## Organization profile synchronization adopted on 5 October 2026

The active import uses reviewed Agent Standards source commit [2027d64b7af235b23a8b4bfa4911c924ffb47d05](https://github.com/VINASIG/agent-standards/commit/2027d64b7af235b23a8b4bfa4911c924ffb47d05), version 0.1.0, with the existing `web-typescript` profile. Earlier pins in this document describe historical imports. Current source, bundle and manifest digests are recorded in [.vinasig/provenance.json](../.vinasig/provenance.json).

CORE-009 and the [project publication checklist](../.vinasig/standards/templates/project-publication.md) require reviewing affected project README/repository details, the VINASIG website inventory and both organization profile languages when publishing a tool or changing its public facts. The public GitHub org profile uses `VINASIG/.github/profile/README.md`. Updates remain within current user authorization. Missing access or authorization is reported as pending.

The installer update preserved the consumer profile and retained a rollback backup. Snapshot structural integrity passed. A new Codex session's instruction discovery is NOT_RUN. Original artwork, application behavior and license grants are unaffected.
