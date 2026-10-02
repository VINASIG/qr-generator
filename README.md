# VINASIG QR Generator

Create traditional static QR codes for URLs, text and Wi-Fi. Generation happens in the browser, and the output contains the supplied content directly.

The intended public website is [VINASIG QR Generator](https://vinasig.github.io/qr-generator/). The source is maintained at [VINASIG/qr-generator](https://github.com/VINASIG/qr-generator). Publication results are verified for an exact commit and recorded separately from this source description.

## A focused tool

- Enter a complete URL or any text, then create a code.
- Use the optional Wi-Fi form for personal WPA, WEP or open networks.
- Download PNG at 512, 1024 or 2048 pixels, or a scalable SVG.
- Inspect the exact encoded content before sharing it.
- Clear your input and start again. Editing input or size immediately disables old exports.

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
- [Source and artwork rights](LICENSE_STATUS.md) and [third-party notices](THIRD_PARTY_NOTICES.md)

The interface uses English, local Space Grotesk and VINASIG's adopted design tokens. QR exports are black on white, keep at least a four-module quiet zone and contain no VINASIG logo, watermark or remote resources. PNG modules use integer pixel sizes. Error correction is fixed at M, and input is limited to 2,000 UTF-8 bytes.

Screen-based decoder tests do not replace a scan from the final physical print. Test the final size, contrast and viewing distance on the devices your audience uses.
