import assert from 'node:assert/strict';
import { mkdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { startServer } from '../../scripts/serve.ts';
import { wifiPayload } from '../../src/lib/qr.ts';

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
const phase = process.env['CAPTURE_PHASE'] === 'before' ? 'before' : 'after';
const viewports = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 440, height: 800 },
  { width: 600, height: 800 },
  { width: 759, height: 1024 },
  { width: 760, height: 1024 },
  { width: 761, height: 1024 },
  { width: 768, height: 1024 },
  { width: 900, height: 800 },
  { width: 1023, height: 768 },
  { width: 1024, height: 768 },
  { width: 1439, height: 900 },
  { width: 1440, height: 900 },
];
async function capture(
  page: Page,
  info: TestInfo,
  state: string,
  scroll = true,
): Promise<void> {
  const viewport = page.viewportSize();
  assert(viewport);
  await page.evaluate(async (shouldScroll) => {
    await document.fonts.ready;
    if (shouldScroll) {
      // Let the compositor paint each scroll before a full-page capture.
      // Chromium can reject a capture while an instant scroll is pending.
      const painted = () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              resolve();
            }),
          ),
        );
      window.scrollTo(0, document.documentElement.scrollHeight);
      await painted();
      window.scrollTo(0, 0);
      await painted();
    }
  }, scroll);
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.html, JSON.stringify(geometry)).toBeLessThanOrEqual(
    geometry.width + 1,
  );
  expect(geometry.body, JSON.stringify(geometry)).toBeLessThanOrEqual(
    geometry.width + 1,
  );
  await mkdir('output/responsive', { recursive: true });
  const name =
    'output/responsive/' +
    phase +
    '-home-' +
    String(viewport.width) +
    'x' +
    String(viewport.height) +
    '-' +
    info.project.name +
    '-text-' +
    (info.title.includes('200%') ? '200' : '100') +
    '-' +
    state +
    '.png';
  if (phase === 'before') {
    const exists = await access(name).then(
      () => true,
      () => false,
    );
    if (exists) throw new Error('Before screenshots must remain immutable');
  }
  await page.screenshot({ path: name, fullPage: true });
}
async function generate(page: Page, payload: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Link or text' }).fill(payload);
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
}
function decodePng(bytes: Buffer): {
  text: string;
  width: number;
  height: number;
} {
  const image = PNG.sync.read(bytes);
  const code = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  assert(code, 'An independent decoder must read the actual output');
  // Exports keep the quiet zone entirely white and opaque.
  for (const point of [
    [0, 0],
    [image.width - 1, 0],
    [0, image.height - 1],
    [image.width - 1, image.height - 1],
  ]) {
    const index = ((point[1] ?? 0) * image.width + (point[0] ?? 0)) * 4;
    assert.deepEqual(
      [...image.data.subarray(index, index + 4)],
      [255, 255, 255, 255],
    );
  }
  return { text: code.data, width: image.width, height: image.height };
}
async function download(page: Page, type: 'PNG' | 'SVG'): Promise<Buffer> {
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download ' + type, exact: true })
    .click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe('qr-code.' + type.toLowerCase());
  const filename = await file.path();
  assert(filename);
  return readFile(filename);
}

for (const viewport of viewports)
  for (const scale of [100, 200]) {
    test(
      'responsive ' +
        String(viewport.width) +
        'x' +
        String(viewport.height) +
        ' text ' +
        String(scale) +
        '%',
      async ({ page }, info) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setViewportSize(viewport);
        await page.goto(app.url);
        if (scale === 200)
          await page.addStyleTag({ content: 'html {font-size:200%}' });
        await capture(page, info, 'idle');
        await page.getByRole('button', { name: 'Create QR code' }).click();
        await expect(page.getByRole('status')).toContainText('Enter a link');
        await capture(page, info, 'error');
        await generate(
          page,
          'https://example.com/' + 'long-path-'.repeat(14) + '?lang=tiếng-việt',
        );
        await page.getByText('Encoded content', { exact: true }).click();
        await page.getByText('Before you print', { exact: true }).click();
        await capture(page, info, 'long-success-notes-open');
        await page.getByRole('radio', { name: 'Wi-Fi', exact: true }).check();
        await page
          .getByRole('textbox', { name: 'Network name' })
          .fill('Cafe; Guest');
        await page
          .getByLabel('Password', { exact: true })
          .fill('demo-password');
        await page.getByRole('button', { name: 'Create QR code' }).click();
        await expect(page.getByRole('status')).toContainText(
          'Your QR code is ready',
        );
        await capture(page, info, 'wifi');
        expect(errors).toEqual([]);
      },
    );
  }

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
])
  for (const theme of ['light', 'dark'] as const)
    for (const motion of ['no-preference', 'reduce'] as const) {
      test(
        'export and privacy ' +
          String(viewport.width) +
          ' ' +
          theme +
          ' ' +
          motion,
        async ({ page, context }, info) => {
          const external: string[] = [],
            requests: string[] = [],
            errors: string[] = [];
          page.on('request', (request) => {
            if (
              !request
                .url()
                .startsWith(app.url.replace(/qr-generator\/$/, '')) &&
              !request.url().startsWith('blob:') &&
              !request.url().startsWith('data:')
            )
              external.push(request.url());
            if (request.method() !== 'GET') requests.push(request.method());
          });
          page.on('pageerror', (error) => errors.push(error.message));
          await page.setViewportSize(viewport);
          await page.emulateMedia({
            colorScheme: theme,
            reducedMotion: motion,
          });
          await page.goto(app.url);
          await page.evaluate(() => document.fonts.ready);
          expect(
            await page.evaluate(
              () => getComputedStyle(document.documentElement).colorScheme,
            ),
          ).toBe(theme);
          expect(
            await page.evaluate(() =>
              document.fonts.check('16px "Space Grotesk"'),
            ),
          ).toBe(true);
          const idle = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(idle.violations).toEqual([]);
          const payload = 'https://example.com/path?a=one&b=two#tiếng-việt';
          await generate(page, payload);
          const png = decodePng(await download(page, 'PNG'));
          expect(png.text).toBe(payload);
          expect(png.width).toBe(1024);
          expect(png.height).toBe(1024);
          const svg = (await download(page, 'SVG')).toString('utf8');
          expect(svg).toContain('shape-rendering="crispEdges"');
          expect(svg).not.toContain('href=');
          const displayedSvg = await page
            .getByRole('img', { name: 'Generated QR code' })
            .evaluate(async (node) => {
              if (!(node instanceof HTMLImageElement))
                throw new Error('Expected QR image');
              return (await fetch(node.src)).text();
            });
          expect(svg).toBe(displayedSvg);
          // Decode the browser's actual vector preview using a separate QR reader.
          const vector = decodePng(
            await page
              .getByRole('img', { name: 'Generated QR code' })
              .screenshot(),
          );
          expect(vector.text).toBe(payload);
          await page.getByText('Encoded content', { exact: true }).click();
          await expect(page.locator('#encoded-content')).toHaveText(payload);
          const expanded = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(expanded.violations).toEqual([]);
          await capture(page, info, theme + '-' + motion + '-export');
          await page
            .getByRole('textbox', { name: 'Link or text' })
            .fill('changed');
          await expect(
            page.getByRole('button', { name: 'Download PNG', exact: true }),
          ).toBeDisabled();
          await expect(
            page.getByRole('img', { name: 'Generated QR code' }),
          ).toBeHidden();
          await generate(page, 'Tiếng Việt • 日本語 • 😀');
          expect(decodePng(await download(page, 'PNG')).text).toBe(
            'Tiếng Việt • 日本語 • 😀',
          );
          await page
            .getByRole('button', { name: 'Clear', exact: true })
            .click();
          await expect(
            page.getByRole('textbox', { name: 'Link or text' }),
          ).toHaveValue('');
          await expect(
            page.getByRole('button', { name: 'Download SVG', exact: true }),
          ).toBeDisabled();
          const storage = await page.evaluate(() => ({
            local: localStorage.length,
            session: sessionStorage.length,
            cookies: document.cookie,
          }));
          expect(storage).toEqual({ local: 0, session: 0, cookies: '' });
          expect(await context.cookies()).toEqual([]);
          expect(external).toEqual([]);
          expect(requests).toEqual([]);
          expect(errors).toEqual([]);
        },
      );
    }

test('Wi-Fi validation, punctuation, password visibility and open network', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(app.url);
  await page.getByRole('radio', { name: 'Wi-Fi', exact: true }).check();
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('network name');
  await page.getByRole('textbox', { name: 'Network name' }).fill('Cafe; West');
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('password');
  await page.getByLabel('Password', { exact: true }).fill('a\\b:c,"d');
  await page
    .getByRole('checkbox', { name: 'Show password', exact: true })
    .check();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page
    .getByRole('checkbox', { name: 'Hidden network', exact: true })
    .check();
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    wifiPayload({
      ssid: 'Cafe; West',
      password: 'a\\b:c,"d',
      security: 'WPA',
      hidden: true,
    }),
  );
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.getByLabel('Security', { exact: true }).selectOption('nopass');
  await expect(page.getByLabel('Password', { exact: true })).toBeHidden();
  await page
    .getByRole('button', { name: 'Download PNG', exact: true })
    .isDisabled()
    .then((disabled) => {
      expect(disabled).toBe(true);
    });
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'WIFI:T:nopass;S:Cafe\\; West;H:true;;',
  );
  await capture(page, info, 'wifi-open-network');
});

test('all PNG sizes and content capacity', async ({ page }) => {
  await page.goto(app.url);
  for (const pixels of [512, 1024, 2048]) {
    await page
      .getByLabel('PNG size', { exact: true })
      .selectOption(String(pixels));
    await generate(page, 'https://example.com');
    const decoded = decodePng(await download(page, 'PNG'));
    expect(decoded.width).toBe(pixels);
    expect(decoded.height).toBe(pixels);
    expect(decoded.text).toBe('https://example.com');
  }
  await generate(page, 'a'.repeat(2000));
  expect(decodePng(await download(page, 'PNG')).text).toBe('a'.repeat(2000));
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('a'.repeat(2001));
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('too long');
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
});

test('keyboard, native selection and touch work without hover', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.goto(app.url);
    await page
      .getByRole('textbox', { name: 'Link or text' })
      .fill('Keyboard and touch');
    await page.getByRole('button', { name: 'Create QR code' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText(
      'Your QR code is ready',
    );
    await page.getByRole('button', { name: 'Clear', exact: true }).tap();
    await page.getByRole('radio', { name: 'Wi-Fi', exact: true }).tap();
    const select = page.getByLabel('Security', { exact: true });
    await select.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await capture(page, info, 'native-select-keyboard');
    const box = await page
      .getByRole('button', { name: 'Create QR code' })
      .boundingBox();
    assert(box);
    expect(box.height).toBeGreaterThanOrEqual(44);
  } finally {
    await context.close();
  }
});

test('loaded app generates offline and uses no destination fetch', async ({
  page,
  context,
}) => {
  await page.goto(app.url);
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('https://example.com/private?secret=fixture');
  await context.setOffline(true);
  try {
    await page.getByRole('button', { name: 'Create QR code' }).click();
    await expect(page.getByRole('status')).toContainText(
      'Your QR code is ready',
    );
    expect(decodePng(await download(page, 'PNG')).text).toBe(
      'https://example.com/private?secret=fixture',
    );
  } finally {
    await context.setOffline(false);
  }
});

test('public metadata, local assets and HTML content are available', async ({
  page,
}) => {
  await page.goto(app.url);
  await expect(page).toHaveTitle(
    'VINASIG QR Generator - Static QR codes, no signup',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://vinasig.github.io/qr-generator/',
  );
  const metadata: unknown = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  );
  assert(metadata && typeof metadata === 'object' && 'name' in metadata);
  expect(metadata.name).toBe('VINASIG QR Generator');
  const links = await page
    .locator('link[rel="icon"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
  for (const link of links) {
    assert(link);
    expect((await page.request.get(new URL(link, app.url).href)).ok()).toBe(
      true,
    );
  }
  expect(
    (await page.request.get(new URL('sitemap.xml', app.url).href)).ok(),
  ).toBe(true);
  expect(
    await page
      .locator('.brand img')
      .evaluate(
        (node) =>
          node instanceof HTMLImageElement &&
          node.complete &&
          node.naturalWidth > 0,
      ),
  ).toBe(true);
});

test('a changed input cannot be restored by an older PNG callback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const candidate: unknown = Reflect.get(
      HTMLCanvasElement.prototype,
      'toBlob',
    );
    if (typeof candidate !== 'function')
      throw new Error('Missing canvas encoder');
    const original = candidate as HTMLCanvasElement['toBlob'];
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      window.setTimeout(() => {
        original.apply(this, args);
      }, 350);
    };
  });
  await page.goto(app.url);
  await page.getByRole('textbox', { name: 'Link or text' }).fill('old payload');
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(
    page.getByRole('button', { name: 'Create QR code' }),
  ).toBeDisabled();
  await page.getByRole('textbox', { name: 'Link or text' }).fill('new payload');
  await expect(
    page.getByRole('button', { name: 'Create QR code' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('img', { name: 'Generated QR code' }),
  ).toBeHidden();
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe('new payload');
});

test('PNG failure recovers without leaving an old download enabled', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const candidate: unknown = Reflect.get(
      HTMLCanvasElement.prototype,
      'toBlob',
    );
    if (typeof candidate !== 'function')
      throw new Error('Missing canvas encoder');
    const original = candidate as HTMLCanvasElement['toBlob'];
    let fail = true;
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      if (fail) {
        fail = false;
        args[0](null);
      } else original.apply(this, args);
    };
  });
  await page.goto(app.url);
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('PNG recovery');
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText(
    'PNG could not be created',
  );
  await expect(
    page.getByRole('button', { name: 'Create QR code' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download SVG', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Create QR code' }).click();
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe('PNG recovery');
});

test('motion reverses promptly and respects reduced preference', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(app.url);
  const button = page.getByRole('button', { name: 'Create QR code' });
  await button.hover();
  await capture(page, info, 'hover-start', false);
  await page.waitForTimeout(80);
  await capture(page, info, 'hover-mid', false);
  await page.waitForTimeout(180);
  await capture(page, info, 'hover-end', false);
  expect(
    await button.evaluate(
      (node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,
    ),
  ).toBe(-1);
  await page.mouse.move(0, 0);
  await button.hover();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(180);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await button.hover();
  const style = await button.evaluate((node) => ({
    transition: getComputedStyle(node).transitionDuration,
    transform: getComputedStyle(node).transform,
  }));
  expect(style.transition).toBe('0s');
  expect(style.transform).toBe('none');
});
