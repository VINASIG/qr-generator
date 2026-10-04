import { contentFixtures } from '../content-fixtures.ts';
import assert from 'node:assert/strict';
import { mkdir, readFile, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import type { Page, TestInfo, Locator } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { startServer } from '../../scripts/serve.ts';
import { wifiPayload } from '../../src/lib/qr.ts';
import { inspectInterface } from '../../.vinasig/standards/templates/web/interface.mjs';

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
const phase = process.env['CAPTURE_PHASE'] === 'before' ? 'before' : 'after';
const captureRun = process.env['CAPTURE_RUN'];
if (captureRun && !/^[a-z\d-]+$/u.test(captureRun))
  throw new Error('Use a simple capture run name');
const captureRoot = 'output/responsive' + (captureRun ? '/' + captureRun : '');
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
  scriptEnabled = true,
): Promise<void> {
  const viewport = page.viewportSize();
  assert(viewport);
  if (!scriptEnabled && scroll) {
    // Disabled page scripts cannot service animation-frame callbacks.
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    await expect(page.getByRole('contentinfo')).toBeInViewport();
    await page
      .getByRole('heading', { name: 'QR Generator', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('heading', { name: 'QR Generator', exact: true }),
    ).toBeInViewport();
  } else if (scriptEnabled)
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
  if (scriptEnabled) {
    expect(await page.evaluate(inspectInterface)).toEqual([]);
  }
  await mkdir(captureRoot, { recursive: true });
  const name =
    captureRoot +
    '/' +
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
  await writeFile(
    name.replace(/\.png$/u, '.json'),
    JSON.stringify(
      {
        geometry,
        browser: info.project.name,
        state,
        controls: await page
          .locator('input, textarea, select, button, summary')
          .evaluateAll((nodes) =>
            nodes
              .filter((node) => node.getClientRects().length > 0)
              .map((node) => ({
                id: node.id,
                tag: node.tagName,
                bounds: (() => {
                  const r = node.getBoundingClientRect();
                  return { x: r.x, y: r.y, width: r.width, height: r.height };
                })(),
                font: getComputedStyle(node).fontSize,
                minWidth: getComputedStyle(node).minWidth,
              })),
          ),
      },
      null,
      2,
    ),
  );
}
async function settle(page: Page): Promise<void> {
  await expect(page.locator('#qr-form')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#qr-form')).not.toHaveAttribute(
    'data-updating',
    'true',
  );
  await expect(page.locator('#qr-form')).not.toHaveAttribute(
    'aria-busy',
    'true',
  );
}
async function generate(page: Page, payload: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Link or text' }).fill(payload);
  await settle(page);
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
        await page.locator('#content').focus();
        await page.locator('#content').blur();
        await settle(page);
        await expect(page.getByRole('status')).toContainText('Enter a link');
        await capture(page, info, 'error');
        await generate(
          page,
          'https://example.com/' + 'long-path-'.repeat(14) + '?lang=tiếng-việt',
        );
        await page.getByText('Encoded content', { exact: true }).click();
        await page.getByText('Before you print', { exact: true }).click();
        await capture(page, info, 'long-success-notes-open');
        await page.getByText('Advanced settings', { exact: true }).click();
        await page.getByText('Technical details', { exact: true }).click();
        await capture(page, info, 'advanced-open');
        await chooseSelect(
          page.getByLabel('Content type', { exact: true }),
          'wifi',
        );
        await page
          .getByRole('textbox', { name: 'Network name' })
          .fill('Cafe; Guest');
        await page
          .getByLabel('Password', { exact: true })
          .fill('demo-password');
        await settle(page);
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
          await page.getByRole('textbox', { name: 'Link or text' }).fill('');
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
  await chooseSelect(page.getByLabel('Content type', { exact: true }), 'wifi');
  await page.locator('#ssid').focus();
  await page.locator('#ssid').blur();
  await settle(page);
  await expect(page.getByRole('status')).toContainText('network name');
  await page.getByRole('textbox', { name: 'Network name' }).fill('Cafe; West');
  await page.locator('#password').focus();
  await page.locator('#password').blur();
  await settle(page);
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
  await settle(page);
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
  await chooseSelect(page.getByLabel('Security', { exact: true }), 'nopass');
  await expect(page.getByLabel('Password', { exact: true })).toBeHidden();
  await page
    .getByRole('button', { name: 'Download PNG', exact: true })
    .isDisabled()
    .then((disabled) => {
      expect(disabled).toBe(true);
    });
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'WIFI:T:nopass;S:Cafe\\; West;H:true;;',
  );
  await capture(page, info, 'wifi-open-network');
});

test('clearing Wi-Fi resets the visible mode and removes all entered data', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(app.url);
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('Previous text');
  await chooseSelect(page.getByLabel('Content type', { exact: true }), 'wifi');
  await page
    .getByLabel('Network name', { exact: true })
    .fill('Fixture network');
  await page
    .getByLabel('Password', { exact: true })
    .fill('fixture-password-only');
  await page.getByLabel('Show password', { exact: true }).check();
  await page.getByLabel('Hidden network', { exact: true }).check();
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await capture(page, info, 'cleared-from-wifi');
  const text = page.getByRole('textbox', { name: 'Link or text' });
  await expect(page.locator('#content-type')).toHaveValue('text');
  await expect(text).toBeVisible();
  await expect(text).toBeEnabled();
  await expect(text).toHaveValue('');
  await expect(text).toBeFocused();
  await expect(page.locator('#ssid')).toHaveValue('');
  await expect(page.locator('#password')).toHaveValue('');
  await expect(page.locator('#show-password')).not.toBeChecked();
  await expect(page.locator('#hidden-network')).not.toBeChecked();
  await expect(page.locator('#wifi-fields')).toBeHidden();
  await expect(page.locator('#encoded-content')).toHaveText('');
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Download SVG', exact: true }),
  ).toBeDisabled();
  await generate(page, 'After clearing');
  expect(decodePng(await download(page, 'PNG')).text).toBe('After clearing');
});

test('all PNG sizes and content capacity', async ({ page }) => {
  await page.goto(app.url);
  for (const pixels of [512, 1024, 2048]) {
    await chooseSelect(
      page.getByLabel('PNG size', { exact: true }),
      String(pixels),
    );
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
  await page.locator('#content').blur();
  await settle(page);
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
    await settle(page);
    await expect(page.locator('#content')).toBeFocused();
    await expect(page.getByRole('status')).toContainText(
      'Your QR code is ready',
    );
    await page.getByRole('button', { name: 'Clear', exact: true }).tap();
    await expect(
      page.getByLabel('Link or text', { exact: true }),
    ).toBeFocused();
    const type = page.getByLabel('Content type', { exact: true });
    await type.tap();
    await page.keyboard.press('Escape');
    await type.focus();
    // Custom typeahead preserves the original form values after dismissing its popup.
    await page.keyboard.press('w');
    await page.keyboard.press('Tab');
    await expect(page.locator('#content-type')).toHaveValue('wifi');
    await expect(page.locator('#ssid')).toBeFocused();
    await expect(page.locator('#wifi-fields')).toBeVisible();
    await expect(page.locator('#wifi-fields')).toBeEnabled();
    const select = page.getByLabel('Security', { exact: true });
    await select.focus();
    await page.keyboard.press('o');
    await page.keyboard.press('Tab');
    await expect(page.locator('#security')).toHaveValue('nopass');
    await expect(page.locator('#password-fields')).toBeHidden();
    await expect(page.locator('#password')).toBeDisabled();
    await capture(page, info, 'custom-select-keyboard');
    const box = await page
      .getByRole('button', { name: 'Clear', exact: true })
      .boundingBox();
    assert(box);
    expect(box.height).toBeGreaterThanOrEqual(44);
  } finally {
    await context.close();
  }
});

test('unavailable client script cannot submit QR content to the host', async ({
  browser,
}, info) => {
  for (const unavailable of ['disabled', 'blocked'] as const) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: unavailable !== 'disabled',
    });
    const page = await context.newPage();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    try {
      if (unavailable === 'blocked')
        await page.route(/\/_astro\/[^/]+\.js$/u, (route) =>
          route.abort('blockedbyclient'),
        );
      await page.goto(app.url);
      const content = page.getByRole('textbox', { name: 'Link or text' });
      await expect(content).toBeDisabled();
      await content.evaluate((node) => {
        if (!(node instanceof HTMLTextAreaElement))
          throw new Error('Expected content input');
        node.value = 'synthetic-privacy-fixture';
      });
      const create = page.getByRole('button', {
        name: 'Create QR code',
        exact: true,
      });
      await expect(create).toHaveCount(0);
      await expect(page.locator('#clear')).toBeDisabled();
      for (const control of await page.getByRole('combobox').all())
        await expect(control).toBeDisabled();
      expect(await page.evaluate(inspectInterface)).toEqual([]);
      for (const control of await page.locator('input, textarea, select').all())
        await expect(control).not.toHaveAttribute('name', /./u);
      await content.press('Enter');
      await capture(
        page,
        info,
        'script-' + unavailable,
        true,
        unavailable !== 'disabled',
      );
      expect(page.url()).toBe(app.url);
      expect(
        requests.some((request) =>
          request.includes('synthetic-privacy-fixture'),
        ),
      ).toBe(false);
      await expect(
        page.getByRole('button', { name: 'Download PNG', exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: 'Download SVG', exact: true }),
      ).toBeDisabled();
    } finally {
      await context.close();
    }
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
    await settle(page);
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
    'https://qr.vinasig.io.vn/',
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
  await expect(page.locator('#qr-form')).toHaveAttribute('aria-busy', 'true');
  await page.getByRole('textbox', { name: 'Link or text' }).fill('new payload');
  await expect(
    page.getByRole('button', { name: 'Clear', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('img', { name: 'Generated QR code' }),
  ).toBeHidden();
  await settle(page);
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
  await settle(page);
  await expect(page.getByRole('status')).toContainText(
    'PNG could not be created',
  );
  await expect(
    page.getByRole('button', { name: 'Clear', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Download SVG', exact: true }),
  ).toBeDisabled();
  await page.locator('#content').fill('PNG recovery updated');
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'PNG recovery updated',
  );
});

test('motion reverses promptly and respects reduced preference', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(app.url);
  const button = page.getByRole('button', { name: 'Clear', exact: true });
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

async function decodeSvg(page: Page, source: string): Promise<string> {
  const raster = await page.evaluate(async (svg) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      // An integer multiple of the vector grid avoids sampling ambiguity.
      canvas.width = canvas.height = image.naturalWidth * 4;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Missing SVG rasterizer');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png').split(',')[1];
    } finally {
      URL.revokeObjectURL(url);
    }
  }, source);
  assert(raster);
  return decodePng(Buffer.from(raster, 'base64')).text;
}

const standardViewports = viewports.filter((viewport) =>
  [360, 390, 768, 1024, 1440].includes(viewport.width),
);
for (const viewport of standardViewports)
  for (const theme of ['light', 'dark'] as const)
    for (const fixture of contentFixtures) {
      test(
        'content types responsive ' +
          fixture.kind +
          ' ' +
          String(viewport.width) +
          ' ' +
          theme,
        async ({ page, context }, info) => {
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.setViewportSize(viewport);
          await page.emulateMedia({ colorScheme: theme });
          await page.goto(app.url);
          await page.evaluate(() => document.fonts.ready);
          const requests: string[] = [];
          page.on('request', (request) => {
            if (
              !request.url().startsWith('blob:') &&
              !request.url().startsWith('data:')
            )
              requests.push(request.url());
          });
          await expect(page.locator('#advanced-settings')).not.toHaveAttribute(
            'open',
            '',
          );
          await expect(page.locator('#contact-more')).not.toHaveAttribute(
            'open',
            '',
          );
          await expect(page.locator('#event-more')).not.toHaveAttribute(
            'open',
            '',
          );
          await chooseSelect(
            page.getByLabel('Content type', { exact: true }),
            fixture.kind,
          );
          await expect(
            page.locator('fieldset[data-content-type]:not([hidden])'),
          ).toHaveCount(1);
          await capture(page, info, theme + '-' + fixture.kind + '-empty');
          await page.locator('#' + fixture.first).focus();
          await page.locator('#' + fixture.first).blur();
          await settle(page);
          await expect(page.locator('#' + fixture.first)).not.toBeFocused();
          await expect(page.locator('#' + fixture.first)).toHaveAttribute(
            'aria-invalid',
            'true',
          );
          if (fixture.more)
            await page.getByText(fixture.more, { exact: true }).click();
          for (const [id, value] of Object.entries(fixture.values))
            await page.locator('#' + id).fill(value);
          await settle(page);
          await expect(page.getByRole('status')).toContainText(
            'Your QR code is ready',
          );
          const payload = await page.locator('#encoded-content').textContent();
          assert(payload);
          if (fixture.kind === 'event') {
            expect(payload).toMatch(
              /UID:urn:uuid:[a-f\d-]{36}\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/u,
            );
            expect(
              payload.replace(
                /UID:urn:uuid:[a-f\d-]{36}\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/u,
                'UID:urn:uuid:IDENTIFIER\r\nDTSTAMP:TIMESTAMP\r\n',
              ),
            ).toBe(fixture.expected);
          } else expect(payload).toBe(fixture.expected);
          expect(decodePng(await download(page, 'PNG')).text).toBe(payload);
          expect(
            await decodeSvg(
              page,
              (await download(page, 'SVG')).toString('utf8'),
            ),
          ).toBe(payload);
          await page.getByText('Encoded content', { exact: true }).click();
          await page.getByText('Technical details', { exact: true }).click();
          await capture(page, info, theme + '-' + fixture.kind + '-ready');
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(axe.violations).toEqual([]);
          await page.locator('#' + fixture.first).fill('changed');
          await expect(
            page.getByRole('button', { name: 'Download PNG', exact: true }),
          ).toBeDisabled();
          await expect(
            page.getByRole('button', { name: 'Download SVG', exact: true }),
          ).toBeDisabled();
          await expect(
            page.getByRole('img', { name: 'Generated QR code' }),
          ).toBeHidden();
          await page
            .getByRole('button', { name: 'Clear', exact: true })
            .click();
          await expect(page.locator('#content-type')).toHaveValue('text');
          await expect(
            page.getByRole('textbox', { name: 'Link or text' }),
          ).toBeFocused();
          expect(
            await page
              .locator('input:not([type="checkbox"]), textarea')
              .evaluateAll((nodes) =>
                nodes.every(
                  (node) =>
                    (node instanceof HTMLInputElement ||
                      node instanceof HTMLTextAreaElement) &&
                    node.value === '',
                ),
              ),
          ).toBe(true);
          expect(await context.cookies()).toEqual([]);
          expect(
            await page.evaluate(() => ({
              local: localStorage.length,
              session: sessionStorage.length,
              cookie: document.cookie,
            })),
          ).toEqual({ local: 0, session: 0, cookie: '' });
          expect(requests).toEqual([]);
          expect(errors).toEqual([]);
        },
      );
    }

for (const fixture of contentFixtures)
  test(
    'content types responsive ' + fixture.kind + ' 320 text 200%',
    async ({ page }, info) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(app.url);
      await page.addStyleTag({ content: 'html {font-size:200%}' });
      await chooseSelect(
        page.getByLabel('Content type', { exact: true }),
        fixture.kind,
      );
      if (fixture.more)
        await page.getByText(fixture.more, { exact: true }).click();
      await page.getByText('Advanced settings', { exact: true }).click();
      for (const [id, value] of Object.entries(fixture.values))
        await page.locator('#' + id).fill(value);
      if (fixture.kind === 'event') {
        for (const id of ['event-start', 'event-end']) {
          await expect(page.locator('#' + id)).toHaveAttribute('type', 'text');
          await expect(page.locator('#' + id)).toHaveAttribute(
            'data-date-picker',
            '',
          );
        }
        for (const id of ['event-start-time', 'event-end-time']) {
          await expect(page.locator('#' + id)).toHaveAttribute('type', 'text');
          await expect(page.locator('#' + id)).toHaveAttribute(
            'data-time-input',
            '',
          );
        }
        expect(
          await page
            .locator('#event-start')
            .evaluate((input) => getComputedStyle(input).fontSize),
        ).toBe('32px');
      }
      await settle(page);
      await expect(page.getByRole('status')).toContainText(
        'Your QR code is ready',
      );
      await page.getByText('Encoded content', { exact: true }).click();
      await page.getByText('Technical details', { exact: true }).click();
      await capture(page, info, '320-text-200-' + fixture.kind + '-advanced');
    },
  );

test('advanced options validate capacity, invalidate every setting and reset to safe defaults', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(app.url);
  await page.getByText('Advanced settings', { exact: true }).click();
  for (const [index, level] of ['L', 'M', 'Q', 'H'].entries()) {
    await chooseSelect(
      page.getByLabel('Error correction', { exact: true }),
      level,
    );
    await chooseSelect(page.getByLabel('White border', { exact: true }), '8');
    await chooseSelect(page.getByLabel('QR version', { exact: true }), '5');
    await chooseSelect(
      page.getByLabel('Mask pattern', { exact: true }),
      String(index),
    );
    await generate(page, 'Settings fixture');
    expect(decodePng(await download(page, 'PNG')).text).toBe(
      'Settings fixture',
    );
    const svg = (await download(page, 'SVG')).toString('utf8');
    expect(svg).toContain('viewBox="0 0 53 53"');
    expect(await decodeSvg(page, svg)).toBe('Settings fixture');
    await expect(page.locator('#code-correction')).toHaveText(level);
    await expect(page.locator('#code-version')).toHaveText(
      'Version 5 - 37 x 37',
    );
    await expect(page.locator('#code-mask')).toHaveText(
      'Pattern ' + String(index),
    );
    await expect(page.locator('#code-border')).toHaveText('8 modules minimum');
  }
  for (const [label, value] of [
    ['Error correction', 'M'],
    ['White border', '12'],
    ['QR version', '40'],
    ['Mask pattern', '7'],
  ]) {
    assert(label && value);
    await chooseSelect(page.getByLabel(label, { exact: true }), value);
    await expect(
      page.getByRole('button', { name: 'Download PNG', exact: true }),
    ).toBeDisabled();
    await expect(page.locator('#technical-details')).toBeHidden();
    await generate(page, 'Settings fixture');
  }
  expect(decodePng(await download(page, 'PNG')).text).toBe('Settings fixture');
  await chooseSelect(page.getByLabel('QR version', { exact: true }), '1');
  await generate(page, 'x');
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('a'.repeat(100));
  await settle(page);
  await expect(page.getByRole('status')).toContainText('needs version');
  await expect(page.locator('#content')).toBeFocused();
  await capture(page, info, 'version-too-small');
  await chooseSelect(page.getByLabel('QR version', { exact: true }), 'auto');
  await chooseSelect(page.getByLabel('Error correction', { exact: true }), 'H');
  await page
    .getByRole('textbox', { name: 'Link or text' })
    .fill('a'.repeat(1274));
  await page.getByText('Advanced settings', { exact: true }).click();
  await settle(page);
  await expect(page.getByRole('status')).toContainText(
    'will not fit at level H',
  );
  await expect(page.locator('#advanced-settings')).not.toHaveAttribute(
    'open',
    '',
  );
  await expect(
    page.getByRole('button', { name: 'Download SVG', exact: true }),
  ).toBeDisabled();
  await capture(page, info, 'correction-capacity-error');
  await page.getByText('Advanced settings', { exact: true }).click();
  await chooseSelect(page.getByLabel('Error correction', { exact: true }), 'M');
  await generate(page, 'Recovered settings');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'Recovered settings',
  );
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('#advanced-settings')).not.toHaveAttribute(
    'open',
    '',
  );
  await expect(page.locator('#error-correction')).toHaveValue('M');
  await expect(page.locator('#quiet-zone')).toHaveValue('4');
  await expect(page.locator('#qr-version')).toHaveValue('auto');
  await expect(page.locator('#mask-pattern')).toHaveValue('auto');
  await expect(page.locator('#image-size')).toHaveValue('1024');
});

test('calendar all-day, inclusive end, timezone and errors remain local', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(app.url);
  await chooseSelect(page.getByLabel('Content type', { exact: true }), 'event');
  // Engines can return the IANA alias Asia/Saigon for Asia/Ho_Chi_Minh.
  const zone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  await expect(page.locator('#event-timezone')).toContainText(zone);
  expect(
    await page.evaluate(() => new Date('2026-10-03T09:00').getTimezoneOffset()),
  ).toBe(-420);
  await page.getByLabel('Event title', { exact: true }).fill('All-day fixture');
  await page.getByLabel('Start date', { exact: true }).fill('2026-12-31');
  await page.getByLabel('End date', { exact: true }).fill('2026-12-31');
  await page.locator('#event-start-time').focus();
  await page.locator('#event-start-time').blur();
  await settle(page);
  await expect(
    page.getByLabel('Start time', { exact: true }),
  ).not.toBeFocused();
  await expect(page.getByRole('status')).toContainText('Choose a time');
  await page.getByLabel('Start time', { exact: true }).fill('09:00');
  await page.getByLabel('End time', { exact: true }).fill('10:00');
  await page.getByLabel('All-day event', { exact: true }).check();
  await expect(page.locator('#event-start')).toHaveAttribute('type', 'text');
  await expect(page.locator('#event-start')).toHaveAttribute(
    'data-date-picker',
    '',
  );
  await expect(page.getByLabel('Start date', { exact: true })).toHaveValue(
    '2026-12-31',
  );
  await expect(page.getByLabel('Start time', { exact: true })).toBeHidden();
  await expect(page.getByLabel('Start time', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('End time', { exact: true })).toBeHidden();
  await expect(page.getByLabel('End time', { exact: true })).toBeDisabled();
  await page.getByLabel('End date', { exact: true }).fill('2026-12-30');
  await page.locator('#event-end').blur();
  await settle(page);
  await expect(page.getByRole('status')).toContainText(
    'last day must be on or after',
  );
  await expect(page.getByLabel('End date', { exact: true })).not.toBeFocused();
  await page.getByLabel('End date', { exact: true }).fill('2026-12-31');
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  const payload = decodePng(await download(page, 'PNG')).text;
  expect(payload).toContain(
    'DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101\r\n',
  );
  expect(payload).not.toMatch(/DT(?:START|END):/u);
  await page.getByText('Encoded content', { exact: true }).click();
  await capture(page, info, 'calendar-all-day');
  await page.getByLabel('All-day event', { exact: true }).uncheck();
  await expect(page.getByLabel('Start date', { exact: true })).toHaveValue(
    '2026-12-31',
  );
  await expect(page.getByLabel('End date', { exact: true })).toHaveValue(
    '2026-12-31',
  );
  await expect(page.getByLabel('Start time', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Start time', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('Start time', { exact: true })).toHaveValue(
    '09:00',
  );
  await expect(page.getByLabel('End time', { exact: true })).toHaveValue(
    '10:00',
  );
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  expect(decodePng(await download(page, 'PNG')).text).toContain(
    'DTSTART:20261231T020000Z\r\nDTEND:20261231T030000Z\r\n',
  );
});

test('automatic validation preserves optional disclosures and a changed type cannot revive an old PNG', async ({
  page,
}) => {
  await page.goto(app.url);
  await chooseSelect(
    page.getByLabel('Content type', { exact: true }),
    'contact',
  );
  await page.getByLabel('Full name', { exact: true }).fill('Fixture contact');
  await page.getByText('More contact details', { exact: true }).click();
  await page
    .getByLabel('Website if needed', { exact: true })
    .fill('javascript:alert(1)');
  await page.getByText('More contact details', { exact: true }).click();
  await settle(page);
  await expect(
    page.getByLabel('Website if needed', { exact: true }),
  ).not.toBeFocused();
  await expect(page.locator('#contact-more')).not.toHaveAttribute('open', '');
  await expect(page.getByRole('status')).toContainText('http');
  await page.getByText('More contact details', { exact: true }).click();
  await expect(
    page.getByLabel('Website if needed', { exact: true }),
  ).toHaveValue('javascript:alert(1)');
  await page
    .getByLabel('Website if needed', { exact: true })
    .fill('https://example.com');
  await settle(page);
  await expect(page.getByRole('status')).toContainText('Your QR code is ready');
  await chooseSelect(page.getByLabel('Content type', { exact: true }), 'sms');
  await expect(
    page.getByRole('button', { name: 'Download PNG', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('#encoded-content')).toHaveText('');
  await expect(
    page.getByLabel('Recipient phone number', { exact: true }),
  ).toHaveValue('');
});

test('download URL cleanup preserves the selected settings and current preview', async ({
  page,
}) => {
  await page.goto(app.url);
  await page.clock.install();
  await page.getByText('Advanced settings', { exact: true }).click();
  await chooseSelect(page.getByLabel('QR version', { exact: true }), '5');
  await chooseSelect(page.getByLabel('Mask pattern', { exact: true }), '7');
  await chooseSelect(page.getByLabel('White border', { exact: true }), '12');
  await chooseSelect(page.getByLabel('PNG size', { exact: true }), '512');
  await generate(page, 'Download cleanup fixture');
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'Download cleanup fixture',
  );
  await page.clock.fastForward(60010);
  await expect(page.locator('#advanced-settings')).toHaveAttribute('open', '');
  await expect(page.locator('#image-size')).toHaveValue('512');
  await expect(page.locator('#qr-version')).toHaveValue('5');
  await expect(page.locator('#mask-pattern')).toHaveValue('7');
  await expect(page.locator('#quiet-zone')).toHaveValue('12');
  await expect(
    page.getByRole('img', { name: 'Generated QR code' }),
  ).toBeVisible();
  expect(decodePng(await download(page, 'PNG')).text).toBe(
    'Download cleanup fixture',
  );
});

test('oversized structured content marks its field without focus changes or leaking to another type', async ({
  page,
}) => {
  await page.goto(app.url);
  for (const [kind, first, large, more] of [
    ['email', 'email-to', 'email-body', ''],
    ['sms', 'sms-number', 'sms-message', ''],
    ['contact', 'contact-name', 'contact-note', 'More contact details'],
    ['event', 'event-title', 'event-description', 'More event details'],
    ['file', 'file-url', 'file-url', ''],
  ]) {
    assert(kind && first && large && more !== undefined);
    const fixture = contentFixtures.find((value) => value.kind === kind);
    assert(fixture);
    await chooseSelect(page.getByLabel('Content type', { exact: true }), kind);
    if (more) await page.getByText(more, { exact: true }).click();
    for (const [id, value] of Object.entries(fixture.values))
      await page.locator('#' + id).fill(value);
    await page
      .locator('#' + large)
      .fill((kind === 'file' ? 'https://example.com/' : '') + 'x'.repeat(2100));
    await page.locator('#' + large).blur();
    if (more) await page.getByText(more, { exact: true }).click();
    await settle(page);
    await expect(page.getByRole('status')).toContainText('too long');
    await expect(page.locator('#' + large)).not.toBeFocused();
    await expect(page.locator('#' + large)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.locator('#content')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(
      page.getByRole('button', { name: 'Download PNG', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.locator('#content-type')).toHaveValue('text');
  }
});

async function chooseSelect(locator: Locator, value: string): Promise<void> {
  const page = locator.page();
  const id = await locator.getAttribute('id');
  assert(id);
  const nativeId = id.replace(/-control$/, '');
  const native = page.locator('#' + nativeId);
  const label = await native.evaluate((element, expected) => {
    if (!(element instanceof HTMLSelectElement))
      throw new Error('Missing native form state');
    return [...element.options]
      .find((option) => option.value === expected)
      ?.text.trim();
  }, value);
  assert(label);
  await locator.click();
  await page
    .locator('#' + nativeId + '-options')
    .getByRole('option', { name: label, exact: true })
    .click();
  await expect(native).toHaveValue(value);
}

for (const theme of ['light', 'dark'] as const) {
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`custom controls ${theme} ${String(viewport.width)} keyboard, calendar and time`, async ({
      page,
    }, info) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(app.url);
      const kind = page.getByRole('combobox', {
        name: 'Content type',
        exact: true,
      });
      await kind.click();
      await expect(kind).toBeFocused();
      await page.keyboard.press('Escape');
      await kind.press('ArrowDown');
      await kind.press('End');
      await kind.press('Escape');
      await expect(page.locator('#content-type')).toHaveValue('text');
      await expect(kind).toBeFocused();
      await kind.press('Home');
      await page.keyboard.type('Phone call');
      await kind.press('Enter');
      await expect(page.locator('#content-type')).toHaveValue('phone');
      await expect(page.locator('#phone-fields')).toBeVisible();
      await kind.press('ArrowDown');
      await kind.press('Home');
      await kind.press('Tab');
      await expect(page.locator('#content-type')).toHaveValue('text');
      await expect(page.locator('#content')).toBeFocused();
      await chooseSelect(kind, 'event');
      const start = page.getByLabel('Start date', { exact: true });
      await start.fill('2026-12-31');
      await page.locator('#event-start-open').click();
      const dialog = page.locator('#event-start-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[data-date="2026-12-31"]')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(dialog.locator('[data-date="2027-01-01"]')).toBeFocused();
      await page.keyboard.press('PageUp');
      await expect(dialog.locator('[data-date="2026-12-01"]')).toBeFocused();
      await page.keyboard.press('PageDown');
      const image = info.outputPath('calendar-open.png');
      await page.screenshot({ path: image, animations: 'disabled' });
      await info.attach('calendar-open', {
        path: image,
        contentType: 'image/png',
      });
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      if (!bounds) throw new Error('Calendar bounds missing');
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
      await page.keyboard.press('Enter');
      await expect(start).toHaveValue('2027-01-01');
      await expect(dialog).toBeHidden();
      await expect(page.locator('#event-start-open')).toBeFocused();
      await chooseSelect(
        page.getByLabel('Start time choices', { exact: true }),
        '09:30',
      );
      await expect(page.locator('#event-start-time')).toHaveValue('09:30');
      await page.locator('#event-start-time').fill('09:07');
      await expect(page.locator('#event-start-time-preset')).toHaveValue('');
      await expect(page.locator('#event-start-time-preset-control')).toHaveText(
        'Choose time',
      );
      await page.locator('#event-start-open').click();
      await page.locator('#event-start-clear').click();
      await expect(start).toHaveValue('');
      await expect(dialog).toBeHidden();
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await expect(page.locator('#content-type')).toHaveValue('text');
      await expect(page.locator('#content-type-control')).toHaveText(
        'URL or text',
      );
      await expect(page.locator('#content')).toBeFocused();
    });
  }
}
