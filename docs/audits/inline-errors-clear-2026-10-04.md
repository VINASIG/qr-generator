# Inline input errors and recognizable reset action

Date: 2026-10-04

## Scope and baseline

The owner reported email/phone/SMS messages at the bottom of the form and a Clear action that looked like ordinary text. A Chromium live baseline covered both locales/themes at 390x844 and 1440x900. On English/light/1440, the email message started 500.53 CSS px below its field. Clear had a transparent border. Immutable before images are in `output/responsive/inline-errors-clear-2026-10-04/before`. The shared baseline manifest `output/inline-errors-clear-before.json` contains 40 observed cases across this repository and the two BMI tools. Clear from valid BMI input did not reproduce immediate empty-field errors.

## Implementation

The reusable FieldError component is shared by text, structured content, date/time and select controls. Every field references its own message with aria-describedby. Typed-input errors appear after blur or Enter. Encoder option errors appear beside the option. A disclosure containing an error opens without moving focus or scrolling, so the message remains visible. The form status summarizes the invalid field instead of duplicating the detailed message at the bottom. System/export failures retain the form status. The original payload validation rules and encoder are unchanged.

Email UI guidance now uses an example address and familiar words. Raw validation messages and accepted address rules are preserved. Clear all has a contrasting outline, a decorative Lucide Trash icon and a localized label. Pointer reset intent suppresses blur reflow until the click completes. Reset removes all inline messages and pending output.

The first full run exposed a Firefox click interruption after resetting and opening the content-type menu. Inline validation inserted content during pointer down/up and changed scroll anchoring before the click completed. Pointer blur validation now waits until after the click and checks the same generation revision. A reset or type change cancels the obsolete check. Keyboard/programmatic blur still validates immediately. A controlled-clock regression asserts the message stays hidden during pointer down, the menu stays open after pointer up, and choosing another content type clears the previous error.

## Regression coverage

New `tests/browser/inline-errors.spec.ts` covers both locales/themes and six sizes, including 320x800 with 200% text. It measures adjacency, alignment and the describedby relationship, exercises email/SMS/phone recovery and reset while invalid, and checks real automatic payload output. Supplemental fixtures cover Wi-Fi, file links, coordinates, contact email, date and time entry. Date/time inputs and their adjacent picker triggers are measured as one visible control row. Their error precedes the format hint. Existing error-message assertions moved to their field-specific regions, retaining exact content checks, export invalidation and focus assertions. Technical/contact disclosures now assert visible errors when opened automatically. Source quality and accessibility gates remain enabled.

A focused regression found an inherited 16 px bottom margin adding to the 8 px error margin on standalone Wi-Fi inputs. The source now removes that old margin only when an adjacent inline error is visible. The same 8 px adjacency assertion remains in place. Focused rerun passed 9/9 across all engines.

## Verification

- `npm run check`, `npm test` and `npm run build` passed, including 91/91 unit tests, standards/license checks, HTML validation and preserved asset digests.
- The complete final Playwright run passed 765/765 across Chromium, Firefox and WebKit, with zero skipped, unexpected or flaky cases and no retries. This includes 84 cases in the new inline-error suite and the previously failing oversized-content/type-change scenario. Full output is `output/inline-errors-clear-browser-final.log` and `output/playwright/report.json`. The first failure and trace remain in `output/inline-errors-clear-first-full`.
- Browser coverage includes both routes/themes, the five standard viewports, 320x800 with 200% text, existing breakpoint neighbors/intermediate widths, payload/export decoding, keyboard/touch, accessibility, offline/script failure, privacy and custom controls. Opened images include email/SMS/phone, supplemental fields and Clear in each supported engine. Before captures remain separate from `output/responsive/inline-errors-clear-2026-10-04/after`.
- `npm run test:performance` passed 12 cold lab navigations, three per locale/device size. Median LCP was 2280.3 ms for English/mobile, 2289.1 ms for Vietnamese/mobile, 525.9 ms for English/desktop and 529.1 ms for Vietnamese/desktop. All medians had CLS 0 and TBT 0. Budgets remain LCP 2500 ms, CLS 0.1 and TBT 200 ms. Summaries are `output/lighthouse/after/summary.json` and `output/lighthouse/after/vi/summary.json`.

Publication and deployed-browser evidence is recorded separately in `output/inline-errors-clear-publication.json`. Real devices, screen readers and field performance are NOT_RUN.
