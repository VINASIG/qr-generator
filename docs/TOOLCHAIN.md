# Toolchain selection

Verified against official npm registry metadata on 3 October 2026. Direct dependencies are exact-pinned and the resolved graph is locked. Node 24.21.0 is the supported LTS runtime used by the adjacent VINASIG products, with npm 12.2.0. No global tooling is upgraded.

| Tool                          | Latest checked   | Selected         | Reason                                                                                |
| ----------------------------- | ---------------- | ---------------- | ------------------------------------------------------------------------------------- |
| Astro                         | 7.3.5            | 7.3.5            | Static shell and bundled local TypeScript, consistent with Favicon Forge              |
| @lucide/astro                 | 1.50.0           | 1.50.0           | Only used SVGs are emitted                                                            |
| qrcode                        | 1.5.4            | 1.5.4            | Existing matrix encoder with automatic segments, correction, version and mask options |
| @types/qrcode                 | 1.5.6            | 1.5.6            | Typed encoder boundary                                                                |
| Playwright Test               | 1.63.0           | 1.63.0           | Persistent task and viewport regression                                               |
| axe integration               | 4.13.0           | 4.13.0           | Automated accessibility subset                                                        |
| TypeScript                    | 7.0.2            | 6.0.3            | Newest compatible version with Astro check and typed ESLint's peer range below 6.1    |
| typescript-eslint             | 8.71.0           | 8.71.0           | Strict typed checks                                                                   |
| ESLint                        | 10.12.0          | 10.12.0          | Current stable checked for this new project                                           |
| Astro ESLint plugin           | 3.2.1            | 3.2.1            | Astro template adapter                                                                |
| @astrojs/check                | 0.9.10           | 0.9.10           | Framework diagnostics                                                                 |
| Prettier and Astro plugin     | 3.9.9 / 1.1.0    | 3.9.9 / 1.1.0    | One formatter                                                                         |
| Stylelint and standard config | 17.16.0 / 40.0.0 | 17.16.0 / 40.0.0 | Actual CSS rules                                                                      |
| HTML-validate                 | 11.16.1          | 11.16.1          | Generated static HTML                                                                 |
| Lighthouse                    | 13.5.0           | 13.5.0           | Repeatable local lab reports                                                          |
| jsQR                          | 1.4.0            | 1.4.0            | Independent test decoder only, not shipped to browsers                                |
| pngjs and types               | 7.0.0 / 6.0.5    | 7.0.0 / 6.0.5    | Decode exported test PNG pixels                                                       |
| Node types                    | 26.6.4           | 24.19.1          | Match the supported runtime major                                                     |

Old-looking version numbers are not assumed stale. qrcode and jsQR's selected versions are the latest published stable values returned by their registries on the review date. Compatibility and independent output checks matter alongside release recency.

npm 12 blocks unapproved install scripts by default. The local build succeeded using the locked platform esbuild package with its postinstall blocked. No global approval or blanket script allowlist was added. CI verifies a clean install on both operating systems.

The Lighthouse trace dependency exposes declarations incompatible with exact optional property checking. The test runner loads that external driver through a validated unknown runtime boundary. Project and other declaration checking stay enabled.

GitHub Actions are pinned to reviewed full SHAs. Dependabot proposes weekly npm and Actions updates without automatic merging. Motion, a UI framework, hosted QR services and additional agent-browser tools have no demonstrated role in the initial product.

The expanded content formats and technical controls use the same locked dependencies. Pure TypeScript builds URI, vCard and iCalendar payloads; the existing encoder supplies all four correction levels and version/mask selection. Native controls avoid another UI/runtime package.
