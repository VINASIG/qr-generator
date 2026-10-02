# Brand adoption

This product explicitly adopts the design system's Bright Playful Minimalism proposal for the current brief. It does not change the status of draft guidance for sibling products.

- Design source is VINASIG/web-design-system at `7ca081e190a7baa3682edf4d1d12ec6485332349`.
- Artwork source is VINASIG/vinasig-brand-assets at `673d1392d5d78e87323ca91eac480e25b57210a9`.
- Selected exported logo, mark and 16/32/48 px favicons are byte-preserved copies of the assets already verified for VINASIG Unphar. The asset manifest records their digests.
- Space Grotesk is served locally. The original variable TTF and OFL are preserved. The full-glyph WOFF2 container was derived for Unphar, preserving the 968 glyphs, Vietnamese coverage, shaping tables and 300-700 weight axis. It is reused without subsetting or further editing.
- Semantic tokens are adopted from the pinned design source through the reviewed Unphar token snapshot. Font loading is separated into a public relative CSS file to preserve the GitHub Pages base path and avoid duplicate font requests.
- Dark-mode semantic aliases follow the same reviewed Unphar adoption. The system preference changes interface surfaces and text; generated QR geometry remains black on white in both themes.
- Identity anchors remain Scout Blue #21497b, Thinker Orange #eb7114, Builder Green #47a036, Auditor Red #971607 and Core Graphite #443a3b.
- Lucide supplies the QR placeholder and download icons. Simple Icons would supply third-party company marks if needed. This product needs none.

Generated QR files contain the user's data and geometry only. They do not contain VINASIG artwork, names or tracking links. Public visibility does not grant a license for VINASIG artwork.
