import path from 'node:path';
import { test, expect } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { inspectControlIndicators } from '../../.vinasig/standards/templates/web/interface.mjs';

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});

for (const locale of ['', 'vi/'])
  for (const theme of ['light', 'dark'] as const) {
    test(`dropdown spacing with long enlarged values ${locale || 'en'} ${theme}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(new URL(locale, app.url).href);
      const type = page.getByRole('combobox', {
        name: locale ? 'Loại nội dung' : 'Content type',
        exact: true,
      });
      await type.press('Home');
      await type.press('ArrowDown');
      await type.press('Enter');
      await expect(page.locator('#security-control')).toBeVisible();
      expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
      // Deliberately long fixture content exercises the actual shared controller.
      await page.locator('#content-type').evaluate(
        (select, text) => {
          if (!(select instanceof HTMLSelectElement))
            throw new Error('Missing select');
          const option = select.selectedOptions[0];
          if (!option) throw new Error('Missing selected option');
          option.textContent = text;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          document.documentElement.style.fontSize = '200%';
        },
        locale
          ? 'Mạng không dây có tên và thông tin kết nối rất dài để kiểm tra xuống dòng'
          : 'A wireless network with a deliberately long selected label for wrapping',
      );
      await page.locator('#advanced-settings summary').click();
      expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
      await page.locator('.workspace').screenshot({
        path: info.outputPath('long-enlarged.png'),
        animations: 'disabled',
      });
      await type.click();
      expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
      await page.screenshot({
        path: info.outputPath('long-enlarged-open.png'),
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await expect(type).toBeFocused();
      const widths = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
    });

    test(`dropdown spacing before scripts ${locale || 'en'} ${theme}`, async ({
      browser,
    }, info) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
        colorScheme: theme,
      });
      try {
        const page = await context.newPage();
        await page.goto(new URL(locale, app.url).href);
        await page.locator('#advanced-settings summary').click();
        await expect(
          page.locator('.select-control').filter({ visible: true }),
        ).toHaveCount(6);
        for (const trigger of await page
          .locator('.select-control')
          .filter({ visible: true })
          .all())
          await expect(trigger).toBeDisabled();
        expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
        await page.locator('.workspace').screenshot({
          path: info.outputPath('initial-html.png'),
          animations: 'disabled',
        });
      } finally {
        await context.close();
      }
    });
  }
