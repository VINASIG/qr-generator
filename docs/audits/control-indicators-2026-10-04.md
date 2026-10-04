# Dropdown indicator spacing audit

Reviewed on 4 October 2026 following the owner's screenshots of crowded dropdown arrows.

## Cause and implementation

The shared `.select-control` used 12 CSS px padding on each side. Its trailing icon box therefore sat only 12 CSS px from the inner border. The existing custom-popup rule did not prescribe measured indicator spacing.

The shared stylesheet now uses the existing spacing tokens for a 16 CSS px logical inline-end inset and a 12 CSS px value gap. Both the disabled initial component and its enhanced controller expose `data-control-value` and `data-control-indicator`. The Lucide SVG retains its declared 20 by 20 px size and does not flex-shrink. The change applies to content type, Wi-Fi security, error correction, quiet zone, version, mask and PNG size.

## Prevention and standards update

The reviewed agent-standards source is `59c4b39cfd5f6aa90050da529af1d9894cfe41fb`. WEB-008, the responsive skill, installer entrypoint and integration guidance now specify the inset, value gap, declared SVG dimensions, initial HTML, long values, enlarged text and screenshot review.

The imported `inspectControlIndicators` reports insufficient spacing, incorrect dimensions, missing or hidden markup and clipping. Separate negative fixtures prove it rejects 12 px and 15.5 px insets, insufficient gaps, shrunken icons and overlapping bounds. Tests assert expected control and marker counts before inspecting geometry.

The offline bundle update used a reviewed diff and dry-run, preserved owner instructions and passed doctor and the project's provenance gate. The same approved rule snapshot was applied to the organization's other current consumers.

## Observed browser evidence

The immutable before matrix and separate after matrix cover English `/` and Vietnamese `/vi/`, both themes, at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. Each matrix contains 20 QR cases plus 20 Design System cases. Measurement was 12 CSS px before and 16 CSS px after, with 20 px icons. All eight QR locale/theme contact sheets were opened, along with desktop and open mobile popup captures.

The existing browser suite also checks 320 px, intermediate widths and the layout breakpoint's 759, 760 and 761 px neighbors. Regression cases cover expanded settings, open options, selection, keyboard focus, Wi-Fi security, long selected values at 200% text and disabled HTML without scripts. The original independent decoding, exports, privacy and input-state assertions remain active.

## Completed local gates

- Source checks passed TypeScript, strict ESLint, CSS lint, Prettier, standards integrity and license validation.
- Native unit tests passed 90 cases. The production build passed built HTML, metadata, original-asset and legal-text checks.
- The complete Chromium, Firefox and WebKit browser run passed 561 cases with zero failures, skipped cases or retries. Its 24 focused long-value/initial-HTML cases are included in that total.
- Publication performance passed all existing median budgets across 12 cold Lighthouse runs, with three mobile and three desktop reports per locale. English median LCP was 2253.94 ms mobile and 483.16 ms desktop. Vietnamese median LCP was 2254.33 ms mobile and 482.55 ms desktop. Median CLS and TBT were zero in every group. Performance scores were 97 mobile and 100 desktop, with accessibility, SEO and best-practice scores of 100. These are lab observations rather than field metrics.

## Evidence and verification boundaries

Before and after screenshots and measured geometry are under ignored `output/responsive/control-inset-2026-10-04/before/` and `after/`. Each phase retains its own `*-gallery.png` contact sheets. The focused browser fixtures retain `long-enlarged.png`, `long-enlarged-open.png` and `initial-html.png` under `output/playwright/results/`. Lighthouse retains cold mobile and desktop reports under `output/lighthouse/after/`, with a separate `vi/` directory.

Current-commit CI, deployment and live-domain checks are verified separately before delivery. Screenshots and browser emulation do not establish physical-device or screen-reader behavior. Field metrics, physical scans, independent SI-agent trials and fresh Codex skill discovery are NOT_RUN.
