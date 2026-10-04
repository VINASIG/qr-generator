import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { startServer } from '../../scripts/serve.ts';
import { contentFixtures } from '../content-fixtures.ts';
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
test.use({ timezoneId: 'Asia/Ho_Chi_Minh' });
for (const [width, height, theme] of [
  [390, 844, 'dark'],
  [1440, 900, 'light'],
] as const) {
  test(
    'Vietnamese nine content types ' + String(width) + ' ' + theme,
    async ({ page }, info) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(new URL('vi/', app.url).href);
      const requests: string[] = [];
      page.on('request', (request) => {
        if (
          !/^(?:blob:|data:)/.test(request.url()) &&
          !['brand/reversed.svg', 'brand/primary-color.svg'].some(
            (asset) => request.url() === new URL(asset, app.url).href,
          )
        )
          requests.push(request.url());
      });
      const fixtures = [
        {
          kind: 'text',
          first: 'content',
          values: { content: 'Nguyễn An & 日本語' },
          expected: 'Nguyễn An & 日本語',
        },
        {
          kind: 'wifi',
          first: 'ssid',
          values: { ssid: 'VINASIG fixture', password: 'example-password' },
          expected: 'WIFI:T:WPA;S:VINASIG fixture;P:example-password;H:false;;',
        },
        ...contentFixtures,
      ];
      for (const fixture of fixtures) {
        await page.locator('#clear').click();
        await page.locator('#content-type-control').click();
        await page
          .locator('#content-type-options [data-value="' + fixture.kind + '"]')
          .click();
        await page.locator('#' + fixture.first).focus();
        await page.locator('#' + fixture.first).blur();
        await expect(page.locator('#' + fixture.first)).toHaveAttribute(
          'aria-invalid',
          'true',
        );
        await expect(page.locator('#form-status')).not.toBeEmpty();
        await expect(page.locator('#form-status')).not.toContainText('Enter ');
        const details =
          fixture.kind === 'contact'
            ? 'contact-more'
            : fixture.kind === 'event'
              ? 'event-more'
              : '';
        if (details) await page.locator('#' + details + ' summary').click();
        for (const [id, value] of Object.entries(fixture.values))
          await page.locator('#' + id).fill(value);
        await expect(page.locator('#download-png')).toBeEnabled();
        await expect(page.locator('#form-status')).toContainText('Mã QR');
        const event = page.waitForEvent('download');
        await page.locator('#download-png').click();
        const downloaded = await event;
        const file = await downloaded.path();
        assert(file);
        const image = PNG.sync.read(await readFile(file)),
          decoded = jsQR(
            new Uint8ClampedArray(image.data),
            image.width,
            image.height,
          );
        assert(decoded);
        const actual =
          fixture.kind === 'event'
            ? decoded.data
                .replace(/UID:[^\r]+/, 'UID:urn:uuid:IDENTIFIER')
                .replace(/DTSTAMP:[^\r]+/, 'DTSTAMP:TIMESTAMP')
            : decoded.data;
        expect(actual).toBe(fixture.expected);
        await page.locator('#encoded-details summary').click();
        await expect(page.locator('#encoded-content')).toHaveText(decoded.data);
        const inputBefore = await page
          .locator('#' + fixture.first)
          .inputValue();
        await page.locator('[data-theme-toggle]').click();
        await expect(page.locator('#' + fixture.first)).toHaveValue(
          inputBefore,
        );
        await expect(page.locator('#download-png')).toBeEnabled();
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
        await page.screenshot({
          path: info.outputPath(
            'vi-' + fixture.kind + '-' + String(width) + '.png',
          ),
          fullPage: true,
        });
      }
      expect(requests).toEqual([]);
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
        'vinasig-theme',
      ]);
    },
  );
}
