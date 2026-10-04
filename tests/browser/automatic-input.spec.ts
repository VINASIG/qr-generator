import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { startServer } from '../../scripts/serve.ts';
import { inspectInterface } from '../../.vinasig/standards/templates/web/interface.mjs';

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
async function ready(page: Page): Promise<void> {
  await expect(page.locator('#qr-form')).not.toHaveAttribute(
    'data-updating',
    'true',
  );
  await expect(page.locator('#download-png')).toBeEnabled();
}
async function decodedDownload(
  page: Page,
): Promise<{ text: string; width: number }> {
  const waiting = page.waitForEvent('download');
  await page.locator('#download-png').click();
  const file = await (await waiting).path();
  assert(file);
  const image = PNG.sync.read(await readFile(file));
  const decoded = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
  );
  assert(decoded, 'The actual automatic export must independently decode');
  return { text: decoded.data, width: image.width };
}
for (const lang of ['en', 'vi'] as const)
  for (const theme of ['light', 'dark'] as const)
    for (const [width, height] of [
      [320, 800],
      [360, 800],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1440, 900],
    ] as const) {
      test(`automatic QR ${lang} ${theme} ${String(width)}`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width, height });
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        await page.goto(app.url + (lang === 'vi' ? 'vi/' : ''));
        await expect(page.locator('#qr-form')).toHaveAttribute(
          'data-ready',
          'true',
        );
        if (width === 320)
          await page.addStyleTag({ content: 'html {font-size:200%}' });
        await expect(page.locator('#generate')).toHaveCount(0);
        await page.locator('#content').fill('https://example.com/first');
        await ready(page);
        await expect(page.locator('#content')).toBeFocused();
        const scroll = await page.evaluate(() => scrollY);
        await page
          .locator('#content')
          .fill('https://example.com/updated?lang=vi');
        await ready(page);
        await expect(page.locator('#encoded-content')).toHaveText(
          'https://example.com/updated?lang=vi',
        );
        await expect(page.locator('#content')).toBeFocused();
        expect(await page.evaluate(() => scrollY)).toBe(scroll);
        expect(await page.evaluate(inspectInterface)).toEqual([]);
        const folder = `output/responsive/${process.env['CAPTURE_RUN'] ?? 'automatic-input-2026-10-04'}/after`;
        await mkdir(folder, { recursive: true });
        await page.evaluate(async () => {
          await document.fonts.ready;
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => {
              resolve();
            }),
          );
          window.scrollTo(0, 0);
        });
        await page.screenshot({
          path: `${folder}/${lang}-${theme}-${String(width)}x${String(height)}-${info.project.name}-automatic-result.png`,
          fullPage: true,
        });
        expect((await decodedDownload(page)).text).toBe(
          'https://example.com/updated?lang=vi',
        );
        await page.locator('#content').fill('');
        await expect(page.locator('#download-png')).toBeDisabled();
        await expect(page.locator('#download-svg')).toBeDisabled();
        await expect(page.locator('#qr-image')).toBeHidden();
        await expect(page.locator('#encoded-content')).toBeEmpty();
        await expect(page.locator('#content')).not.toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await page.locator('#content').blur();
        await expect(page.locator('#content')).toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await page.locator('#content').fill('Recovered');
        await ready(page);
        await expect(page.locator('#content')).not.toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await page.locator('#clear').click();
        await expect(page.locator('#content')).toHaveValue('');
        await expect(page.locator('#download-png')).toBeDisabled();
      });
    }
for (const lang of ['en', 'vi'] as const) {
  test(`automatic QR coalesces rapid edits and respects composition ${lang}`, async ({
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
        document.documentElement.dataset['encodes'] = String(
          Number(document.documentElement.dataset['encodes'] ?? '0') + 1,
        );
        original.apply(this, args);
      };
    });
    await page.goto(app.url + (lang === 'vi' ? 'vi/' : ''));
    await expect(page.locator('#qr-form')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await page.locator('#content').evaluate((node) => {
      assertInput(node);
      for (const value of ['one', 'two', 'three', 'final']) {
        node.value = value;
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }
      function assertInput(
        value: Element,
      ): asserts value is HTMLTextAreaElement {
        if (!(value instanceof HTMLTextAreaElement))
          throw new Error('Expected textarea');
      }
    });
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('data-encodes', '1');
    expect((await decodedDownload(page)).text).toBe('final');
    await page.locator('#content').focus();
    await page
      .locator('#content')
      .dispatchEvent('compositionstart', { bubbles: true });
    await page.locator('#content').evaluate((node) => {
      if (!(node instanceof HTMLTextAreaElement))
        throw new Error('Expected content input');
      node.value = 'Tiếng Việt';
      node.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          isComposing: true,
          inputType: 'insertCompositionText',
          data: 'Tiếng Việt',
        }),
      );
    });
    await expect(page.locator('#qr-image')).toBeHidden();
    await expect(page.locator('#download-png')).toBeDisabled();
    await page.waitForTimeout(250);
    await expect(page.locator('html')).toHaveAttribute('data-encodes', '1');
    await page
      .locator('#content')
      .dispatchEvent('compositionend', { bubbles: true });
    await ready(page);
    expect((await decodedDownload(page)).text).toBe('Tiếng Việt');
    await expect(page.locator('html')).toHaveAttribute('data-encodes', '2');
  });
  test(`automatic QR settings and reset cancel pending output ${lang}`, async ({
    page,
  }) => {
    await page.goto(app.url + (lang === 'vi' ? 'vi/' : ''));
    await expect(page.locator('#qr-form')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await page.locator('#content').fill('Automatic settings');
    await ready(page);
    await page.locator('#image-size-control').click();
    await page.locator('#image-size-options [data-value="512"]').click();
    await ready(page);
    expect(await decodedDownload(page)).toEqual({
      text: 'Automatic settings',
      width: 512,
    });
    await page.locator('#advanced-settings summary').click();
    await page.locator('#error-correction-control').click();
    await page.locator('#error-correction-options [data-value="H"]').click();
    await ready(page);
    await expect(page.locator('#code-correction')).toHaveText('H');
    await page.locator('#content').fill('Pending result');
    await page.locator('#clear').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#content')).toHaveValue('');
    await expect(page.locator('#qr-image')).toBeHidden();
    await expect(page.locator('#download-png')).toBeDisabled();
    await expect(page.locator('#encoded-content')).toBeEmpty();
  });
}
