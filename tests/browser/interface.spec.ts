import path from 'node:path';
import { test, expect } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import {
  inspectInterface,
  inspectHeaderBrand,
  inspectControlIndicators,
} from '../../.vinasig/standards/templates/web/interface.mjs';
import { captureFullPage } from '../../.vinasig/standards/templates/web/responsive.mjs';
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
for (const route of ['', 'vi/'])
  for (const theme of ['light', 'dark'] as const)
    for (const [width, height] of [
      [320, 800],
      [360, 800],
      [390, 844],
      [759, 1024],
      [760, 1024],
      [761, 1024],
      [768, 1024],
      [1024, 768],
      [1440, 900],
    ] as const) {
      test(
        'interface copy ' +
          (route || 'home') +
          ' ' +
          theme +
          ' ' +
          String(width),
        async ({ page }, info) => {
          await page.setViewportSize({ width, height });
          await page.emulateMedia({
            colorScheme: theme,
            reducedMotion: 'reduce',
          });
          await page.goto(new URL(route, app.url).href);
          await captureFullPage(page, info, 'initial');
          expect(await page.evaluate(inspectHeaderBrand)).toEqual([]);
          const brand = page.locator('[data-brand-logo]');
          await brand.focus();
          await expect(brand).toBeFocused();
          expect(await page.evaluate(inspectHeaderBrand)).toEqual([]);
          await brand.hover();
          expect(await page.evaluate(inspectHeaderBrand)).toEqual([]);
          expect(await page.evaluate(inspectInterface)).toEqual([]);
          expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
          for (const disclosure of await page.locator('details').all()) {
            if (
              (await disclosure.isVisible()) &&
              (await disclosure.getAttribute('open')) === null
            )
              await disclosure.locator('summary').click();
          }
          await captureFullPage(page, info, 'expanded');
          expect(await page.evaluate(inspectInterface)).toEqual([]);
          for (const id of [
            'content-type',
            'error-correction',
            'quiet-zone',
            'qr-version',
            'mask-pattern',
            'image-size',
          ]) {
            await expect(page.locator('#' + id + '-control')).toBeVisible();
            await expect(
              page.locator('#' + id + '-control [data-control-indicator]'),
            ).toHaveCount(1);
            await expect(
              page.locator('#' + id + '-control [data-control-value]'),
            ).toHaveCount(1);
          }
          expect(await page.evaluate(inspectControlIndicators)).toEqual([]);

          {
            for (const select of await page
              .locator('select[data-custom-select]')
              .all()) {
              const id = await select.getAttribute('id');
              if (!id) throw new Error('Unidentified select');
              const trigger = page.locator('#' + id + '-control');
              if (!(await trigger.isVisible())) continue;
              await trigger.click();
              expect(await page.evaluate(inspectInterface)).toEqual([]);
              expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
              const bounds = await page
                .locator('#' + id + '-options')
                .boundingBox();
              expect(bounds).not.toBeNull();
              if (!bounds) throw new Error('Missing opened options');
              expect(bounds.x).toBeGreaterThanOrEqual(0);
              expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
              expect(bounds.y).toBeGreaterThanOrEqual(0);
              expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1);
              const screenshot = info.outputPath(id + '-open.png');
              await page.screenshot({
                path: screenshot,
                animations: 'disabled',
              });
              await info.attach(id + '-open', {
                path: screenshot,
                contentType: 'image/png',
              });
              await page.keyboard.press('Escape');
              await expect(trigger).toBeFocused();
            }
          }
          const widths = await page.evaluate(() => [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
          ]);
          expect(widths[0]).toBeLessThanOrEqual((widths[1] ?? 0) + 1);
        },
      );
    }
