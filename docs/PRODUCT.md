# Product decisions

The owner's brief asks for a clean traditional QR generator and authorizes standardization and public publication under VINASIG. This product adopts Bright Playful Minimalism from the design system for this scope.

## Primary task

Choose URL or text, enter the exact content, create a code and download it. Input is not trimmed, rewritten, shortened or fetched. Blank input, unsupported control characters, incomplete Unicode and more than 2,000 UTF-8 bytes are rejected with a correction. This conservative capacity keeps byte-mode data within the encoder's M-level limits.

Wi-Fi is the only structured form in the first version. It escapes reserved characters, quotes hex-looking literal values, supports the hidden-network flag and drops a previous password when an open network is chosen. SSID is limited to 32 UTF-8 bytes and the password to 128 bytes. Personal WPA/WPA2, WEP and open payloads are supported. Enterprise authentication is not provided. Scanner and device interpretation can vary.

## Output and state

The app builds one matrix at error-correction level M. SVG contains only a white rectangle and black vector runs, with a four-module margin. PNG centers integer modules inside the selected pixel dimensions with at least the same margin. There are no logos, colored dots, transparent backgrounds or watermarks.

Editing content, changing mode or choosing another size invalidates the previous preview and downloads. A generation revision prevents an asynchronous PNG callback from restoring an outdated result. Errors restore controls and retain entered data. Clear resets both modes. Temporary object URLs are revoked on replacement and page exit. The SVG never embeds input as markup or external references.

On a narrow screen a successful creation moves focus and the viewport to the preview. Form errors focus the applicable input. The layout uses native radio controls, checkboxes, selects, details and buttons. Motion is limited to a small fine-pointer button response and disappears for reduced motion.

## Privacy and delivery

Creation and export run locally with bundled code. There is no payload storage, remote QR API, destination fetch, analytics, account, hosted redirect or server application. Payloads are not added to URLs, download filenames, logs or telemetry. Browser or operating-system tools may retain user downloads or input independently of this app. Hosting sees page requests. Anyone who receives a code can decode its contents.

The first version does not include batch generation, campaigns, subscriptions, contact-builder forms, scanning, logo styling, clipboard permissions, camera access or persistent PWA caching. These need an observed task and a separate scope before adding controls. Arbitrary text can already represent other payload formats without a dedicated interface.
