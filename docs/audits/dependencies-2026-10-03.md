# Dependency review on 3 October 2026

This review covers the open Dependabot proposals and the current supported toolchain. Registry metadata and each proposal's manifest, lockfile and CI result were inspected before resolution.

## Selected versions

- TypeScript remains pinned to 6.0.3. The latest stable registry release is 7.0.2.
- `typescript-eslint` 8.71.0 requires TypeScript `>=4.8.4 <6.1.0`. TypeScript 7 cannot be installed with the required typed lint without violating its peer contract.
- `@astrojs/check` 0.9.10 accepts TypeScript `^5.0.0 || ^6.0.0`. Its current peer contract also excludes TypeScript 7.
- `@types/node` remains pinned to 24.19.1, the latest verified release in major 24. The global latest is 26.6.4. Node 26 declarations can expose APIs absent from the supported Node 24 runtime, even when current source passes a check.
- ESLint is selected at 10.12.0, the current stable release accepted by the typed lint peer range. This is a compatible minor update.

## Pull requests

- [PR #2](https://github.com/VINASIG/qr-generator/pull/2) proposes TypeScript 7.0.2, which the required toolchain does not support. The proposal was closed with its compatibility reason. Required checks remain in place.
- [PR #1](https://github.com/VINASIG/qr-generator/pull/1) proposes Node 26 declarations for a Node 24 project. The proposal was closed with its compatibility reason. Required checks remain in place.

## Maintenance policy

Dependabot continues weekly npm and GitHub Actions updates. A targeted version ignore prevents repeated TypeScript 7 proposals until the required compiler consumers support that major. Projects with Node declarations ignore major 25 and above while Node 24 is the supported runtime. Updates within supported ranges remain eligible for review.

Review these bounds by 17 October 2026, and before adopting a new compiler, checker, typed lint or runtime major. A compatible migration must update the manifest and lockfile together and pass the repository's source, behavior and CI gates. Security updates still require review, including any change that needs a runtime migration.

Registry sources are [TypeScript](https://registry.npmjs.org/typescript/latest), [typescript-eslint](https://registry.npmjs.org/typescript-eslint/latest), [Astro checker](https://registry.npmjs.org/@astrojs/check/latest), [Node declarations](https://registry.npmjs.org/@types/node) and [ESLint](https://registry.npmjs.org/eslint/latest). The organization audit retains the dated metadata, original proposal diffs, CI diagnostics and subsequent verification receipts under ignored `output/org-audit-2026-10-03/` in the `vinasig` checkout. CI checks for the final pushed revision provide the public execution evidence.

## Security audit

`npm audit --json` reported 10 high-severity affected package entries, tracing to 2 distinct upstream advisories. The npm exit status is **FAIL**. Propagated parent-package entries are not separate vulnerabilities.

- [braces: braces vulnerable to stack-exhaustion denial of service through deeply nested patterns](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): the official registry still selects 3.0.3, and the reviewed advisory lists no patched release. This enters through the Stylelint/glob tooling. The configured checks use repository-owned source paths; do not accept untrusted glob patterns or run a validation service over arbitrary patterns.
- [http-cache-semantics: http-cache-semantics max-stale handling can disclose cross-user cached responses](https://github.com/advisories/GHSA-ch52-4w7c-c8xp): the official registry still selects 4.2.0, and the reviewed advisory lists no patched release. This enters through Astro. This project publishes static files to GitHub Pages, with no Node application server, authenticated shared HTTP cache or remote-image service in the deployed artifact. A future server deployment or private remote-content cache needs a separate exposure review.

No supported patched release was available on 3 October 2026. Audit warnings remain visible; no forced downgrade, override, vulnerability dismissal or check suppression was applied. Review the official package releases and advisories by 17 October 2026, and before changing input trust or the deployment model. Adopt a supported patch as soon as it is available and rerun source, native and browser checks.

The organization audit retains the original JSON result under `vinasig/output/org-audit-2026-10-03/qr-generator/security-before.json`. Public CI proves the selected source checks, not the absence of these dependency advisories.
