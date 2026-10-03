# VINASIG QR Generator

Create traditional static QR codes for links, text, Wi-Fi, email, phone calls, SMS, contacts, locations and calendar events. Generation happens in the browser, and the output contains the supplied content directly.

The intended public website is [VINASIG QR Generator](https://vinasig.github.io/qr-generator/). The source is maintained at [VINASIG/qr-generator](https://github.com/VINASIG/qr-generator). Publication results are verified for an exact commit and recorded separately from this source description.

## A focused tool

- Enter a complete URL or any text, then create a code.
- Choose one content type; only its fields are shown. Contact and event extras stay collapsed until needed.
- Use Wi-Fi for personal WPA, WEP or open networks; email, phone and SMS for compatible app actions; vCard for a contact; coordinates for a location; or iCalendar for an event.
- Share an image, PDF or other file using its direct HTTP(S) link. The file stays with its existing host; it is not embedded or uploaded here.
- Leave Advanced settings closed for everyday use, or choose error correction L/M/Q/H, a 4/8/12-module border, version 1-40 and mask 0-7. Version and mask default to Auto.
- Download PNG at 512, 1024 or 2048 pixels, or a scalable SVG.
- Inspect the exact encoded content and generated technical details before sharing it.
- Clear all input and restore defaults. Editing input, content type, size or technical settings immediately disables old exports.

No account, subscription, app cookies, analytics, history storage or QR redirect service is part of this application. It never requests the destination URL or uploads payloads. Hosting receives normal page requests. After the application loads, creation and export can work without a network connection. Offline reload or installation is not provided.

A static code has no service-controlled expiry. A linked page can still move or go offline, and a Wi-Fi password can change. Changing the code's content means generating and distributing another image. The downloaded image contains its data, including a Wi-Fi password when supplied.

## Run locally

Use Node 24.21.0 and npm 12.2.0.

```sh
npx --yes npm@12.2.0 ci
npx --yes npm@12.2.0 run dev
```

Read the URL from the dev-server log. The site uses the project base path `/qr-generator/`.

```sh
npm run check
npm test
npm run build
npm exec -- playwright install chromium firefox webkit
npm run test:browser
npm run test:performance
```

The production preview uses an automatically selected loopback port through `npm run preview`. Browser tests start and close their own production server. CI requires all three engines on Windows and Linux before deployment.

## Decisions and evidence

- [Product scope](docs/PRODUCT.md) and [public user research](docs/RESEARCH.md)
- [Brand adoption](docs/BRAND.md), [pinned assets](docs/asset-manifest.json) and [SI-agent standards](docs/STANDARDS.md)
- [Toolchain and version decisions](docs/TOOLCHAIN.md)
- [Tests and verification boundaries](tests/README.md)
- [Content expansion audit](docs/audits/2026-10-03-content-types.md)
- [Source and artwork rights](LICENSE_STATUS.md) and [third-party notices](THIRD_PARTY_NOTICES.md)

The interface uses English, local Space Grotesk and VINASIG's adopted design tokens. QR exports use standard Model 2, are black on white, keep at least a four-module quiet zone and contain no VINASIG logo, watermark or remote resources. PNG modules use integer pixel sizes. Error correction defaults to M. Content is limited to 2,000 UTF-8 bytes and must fit its selected correction level and version. Higher correction can require a denser code; an explicit version that is too small produces a correction rather than a broken export.

Screen-based decoder tests do not replace a scan from the final physical print. Test the final size, contrast and viewing distance on the devices your audience uses.

Content formats are interpreted by the scanner and destination app. An SMS reader may open only the recipient; calendar and contact actions also vary. These outputs do not automatically send messages, call numbers or import events. Check the final action on the intended devices.

## License scopes

VINASIG-authored software uses **AGPL-3.0-or-later**. Authored documentation uses **CC-BY-SA-4.0**. Commercial use is allowed under those standard licenses. Fonts and third-party components retain their original terms. Official VINASIG identity assets follow the separate brand policy.

Read [LICENSE](LICENSE), [LICENSES.md](LICENSES.md), [VINASIG Brand Usage Policy](BRAND_POLICY.md) and [the licensing review](docs/audits/licensing-2026-10-04.md) for exact scopes, rationale and remaining review.
