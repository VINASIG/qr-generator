# Licensing review - 4 October 2026

## Decision and authorization

The owner requested an organization-wide licensing implementation on 4 October 2026, including the shared SI agent procedure and separate brand usage permissions. This record implements that authorization for VINASIG-authored material only.

Reviewed baseline commit `6aca9b141b8f6b62b29c690796124b6ff95d4bd5`.

The generator is web-delivered application software. AGPL protects software modifications without adding a condition to user QR payloads or images solely because they were processed by the tool.

The current grant and exact material paths are in [LICENSES.md](../../LICENSES.md). The software SPDX identifier is `AGPL-3.0-or-later`. Documentation uses CC-BY-SA-4.0. No present repository is a separately published reusable library requiring an LGPL decision.

## Ownership and existing rights

The inspected Git author history and live GitHub contributor response identify the maintainer account NhanAZ. Historical commits also use the maintainer's supplied author names. Dependency-update bot commits are present where recorded. No other human contributor appeared in the inspected records. These observations do not establish a legal title audit or replace third-party consent.

The prior primary metadata was UNLICENSED. No previous standard license grant for VINASIG-owned project code was found at the reviewed baseline. Existing font, icon and vendor grants remain intact. Historical publication audits are preserved as dated evidence.

## Dependencies and delivery

The committed npm lockfile was inspected across all resolved package records. Direct runtime dependencies are `@lucide/astro 1.50.0`, `astro 7.3.5`, `qrcode 1.5.4`. Permissive MIT, ISC, BSD, Apache, CC0 and Zlib notices keep their own terms. MPL and LGPL dependencies must retain their obligations if their covered files or binaries are redistributed.

Astro/Sharp native build tooling is not copied into the static site. No node_modules, development tools or standards backups are published. svg-tags 1.0.0 lacks the modern lockfile license field in affected toolchains, but its installed LICENSE and legacy licenses metadata explicitly state MIT. This metadata gap is not treated as an unknown license.

The static publication includes full AGPL and CC BY-SA texts, a copied brand policy and source directions in NOTICE.txt. The repository supplies preferred source, scripts, lockfile and rebuild instructions. Hosting changes and forks must keep the actual shipped revision's Corresponding Source available. A later modified interactive server also has the AGPL section 13 obligation.

## Implementation files

- LICENSE, LICENSES/CC-BY-SA-4.0.txt, LICENSES.md and BRAND_POLICY.md.
- README.md, CONTRIBUTING.md and root package/lockfile SPDX metadata.
- LICENSE_STATUS.md and the website's published license/notice directory.

## Verification and remaining review

License texts are copied verbatim from their publisher or the pinned SPDX official mirror. [Text source provenance](../license-text-sources.json) records source URLs and SHA-256. Source and build gates, snapshot integrity, asset preservation, metadata and exact-commit publication are checked during this change. Post-commit CI outcomes are external evidence and are not predicted here.

No blocking external-contributor consent issue was identified in the inspected VINASIG-authored scope. This is an evidence-based repository review, not an independent legal ownership determination.

Future external contributions, a new binary distribution, added datasets or a separately packaged library require another scoped review. Existing trademark registration status and formal corporate ownership were not independently verified. The brand policy makes no registration claim.
