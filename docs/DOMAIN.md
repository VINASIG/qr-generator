# Canonical domain

Approved by the owner on 4 October 2026. The canonical website for this repository is **https://qr.vinasig.io.vn/**. GitHub Pages publishes the checked static artifact through GitHub Actions.

## Configuration

- Build and preview use the origin root, "/", rather than the former repository prefix.
- Set the repository Pages custom domain to "qr.vinasig.io.vn". Keep the publication source as GitHub Actions. An uploaded CNAME file alone does not configure this deployment type.
- The DNS-only CNAME for this hostname targets vinasig.github.io, without a repository path.
- Retain the existing organization verification TXT and the GitHub Pages domain verification TXT. The apex Google verification TXT maintains the Search Console domain property, including subdomains.
- Wait for the GitHub Pages HTTPS certificate, then enable HTTPS enforcement. Never bypass a browser certificate error or publish an HTTP canonical.
- Keep canonical URLs, social URLs, structured data, translation links, sitemap, robots, README and package metadata aligned. Repository source and issue URLs continue to use github.com.

## Search and maintenance

Submit https://qr.vinasig.io.vn/sitemap.xml in the verified "vinasig.io.vn" Domain property after the site is live over HTTPS. Preserve existing page content and language paths. A sitemap submission or an indexing request does not guarantee indexing or ranking.

Use [the organization domain map](https://github.com/VINASIG/vinasig/blob/main/docs/DOMAINS.md) for cross-project links. Historical audits and decisions retain the former URLs as dated evidence.

## Verification

Run the existing source, unit, built-output and browser gates. Inspect real screenshots and verify public HTML, assets, robots, sitemap, certificate, old Pages redirects, repository homepage and the exact pushed deployment commit. Local records are in ignored output folders. Source configuration alone is not evidence of a live deployment.

Primary references are [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [GitHub HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) and [Google Domain properties](https://support.google.com/webmasters/answer/34592).
