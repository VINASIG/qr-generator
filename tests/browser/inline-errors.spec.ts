import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { inspectInterface } from '../../.vinasig/standards/templates/web/interface.mjs';

let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
async function choose(page: Page, kind: string): Promise<void> {
  await page.locator('#content-type-control').click();
  await page.locator(`#content-type-options [data-value="${kind}"]`).click();
}
async function inlineError(
  page: Page,
  id: string,
  text: string,
): Promise<void> {
  const field = page.locator('#' + id);
  const error = page.locator('#' + id + '-error');
  await field.blur();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(error).toBeVisible();
  await expect(error).toContainText(text);
  await expect(error).toHaveCSS(
    'color',
    await page
      .locator('#form-status')
      .evaluate((node) => getComputedStyle(node).color),
  );
  const facts = await field.evaluate((node) => {
    // Date/time inputs and their adjacent picker triggers form one control row.
    const box = (
      node.closest('.date-input-row, .time-input-row') ?? node
    ).getBoundingClientRect();
    const error = document.getElementById(node.id + '-error');
    if (!error) throw new Error('Missing local error');
    const bounds = error.getBoundingClientRect();
    return {
      gap: bounds.top - box.bottom,
      left: Math.abs(bounds.left - box.left),
      right: bounds.right - box.right,
      allowedGap:
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) /
          2 +
        1,
      described: (node.getAttribute('aria-describedby') ?? '')
        .split(/\s+/u)
        .includes(error.id),
    };
  });
  expect(facts.described).toBe(true);
  expect(facts.gap).toBeGreaterThanOrEqual(0);
  expect(facts.gap).toBeLessThanOrEqual(facts.allowedGap);
  expect(facts.left).toBeLessThanOrEqual(1);
  expect(facts.right).toBeLessThanOrEqual(1);
  await expect(page.locator('#download-png')).toBeDisabled();
  await expect(page.locator('#download-svg')).toBeDisabled();
}
async function clearButton(page: Page, lang: 'en' | 'vi'): Promise<void> {
  const clear = page.getByRole('button', {
    name: lang === 'vi' ? 'Xóa tất cả' : 'Clear all',
    exact: true,
  });
  await expect(clear).toBeEnabled();
  await expect(clear.locator('svg[aria-hidden="true"]')).toBeVisible();
  const facts = await clear.evaluate((node) => {
    const style = getComputedStyle(node);
    const icon = node.querySelector('svg');
    if (!icon) throw new Error('Missing Clear icon');
    const box = node.getBoundingClientRect();
    const bounds = icon.getBoundingClientRect();
    return {
      height: box.height,
      border: Number.parseFloat(style.borderTopWidth),
      style: style.borderTopStyle,
      color: style.borderTopColor,
      width: bounds.width,
      contained: bounds.left >= box.left && bounds.right <= box.right,
    };
  });
  expect(facts.height).toBeGreaterThanOrEqual(44);
  expect(facts.border).toBeGreaterThanOrEqual(1);
  expect(facts.style).toBe('solid');
  expect(facts.color).not.toMatch(/transparent|rgba\([^)]*, 0\)$/u);
  expect(facts.width).toBe(18);
  expect(facts.contained).toBe(true);
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
      test(`inline QR errors ${lang} ${theme} ${String(width)}`, async ({
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
        await page.evaluate(() => document.fonts.ready);
        if (width === 320)
          await page.addStyleTag({ content: 'html {font-size:200%}' });
        await clearButton(page, lang);
        for (const fixture of [
          {
            kind: 'email',
            id: 'email-to',
            bad: 'a',
            good: 'hello@example.com',
            message: 'hello@example.com',
            prefix: 'mailto:',
          },
          {
            kind: 'sms',
            id: 'sms-number',
            bad: '2',
            good: '+84912345678',
            message: lang === 'vi' ? 'mã quốc gia' : 'country code',
            prefix: 'sms:',
          },
          {
            kind: 'phone',
            id: 'phone-number',
            bad: '2',
            good: '+84912345678',
            message: lang === 'vi' ? 'mã quốc gia' : 'country code',
            prefix: 'tel:',
          },
        ]) {
          await choose(page, fixture.kind);
          await page.locator('#' + fixture.id).fill(fixture.bad);
          await expect(page.locator('#' + fixture.id + '-error')).toBeHidden();
          await inlineError(page, fixture.id, fixture.message);
          await expect(page.locator('#form-status')).toHaveText(
            lang === 'vi'
              ? 'Kiểm tra ô được đánh dấu.'
              : 'Check the highlighted field.',
          );
          expect(await page.evaluate(inspectInterface)).toEqual([]);
          const folder =
            'output/responsive/inline-errors-clear-2026-10-04/after';
          await mkdir(folder, { recursive: true });
          const name = `${lang}-${theme}-${String(width)}x${String(height)}-${info.project.name}-${fixture.kind}`;
          await page
            .locator('.workspace')
            .screenshot({ path: `${folder}/${name}-workspace.png` });
          await page.locator('#' + fixture.id).scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${folder}/${name}-viewport.png` });
          await page.locator('#' + fixture.id).fill(fixture.good);
          await expect(page.locator('#download-png')).toBeEnabled();
          await expect(page.locator('#' + fixture.id + '-error')).toBeHidden();
          await expect(page.locator('#' + fixture.id)).not.toHaveAttribute(
            'aria-invalid',
            'true',
          );
          await expect(page.locator('#' + fixture.id)).toBeFocused();
          await expect(page.locator('#encoded-content')).toContainText(
            fixture.prefix + fixture.good,
          );
          // Clear must win over blur validation and a pending automatic update.
          await page.locator('#' + fixture.id).fill(fixture.bad);
          await page.locator('#clear').click();
          await expect(page.locator('#content-type')).toHaveValue('text');
          await expect(page.locator('#content')).toBeFocused();
          await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);
          await expect(page.locator('[data-field-error]:visible')).toHaveCount(
            0,
          );
          await expect(page.locator('#' + fixture.id)).toHaveValue('');
          await expect(page.locator('#qr-image')).toBeHidden();
          await expect(page.locator('#download-png')).toBeDisabled();
        }
      });
    }
for (const lang of ['en', 'vi'] as const) {
  test(`inline QR validation preserves a pointer click ${lang}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(app.url + (lang === 'vi' ? 'vi/' : ''));
    await expect(page.locator('#qr-form')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.locator('#content').focus();
    const trigger = page.locator('#content-type-control');
    await trigger.scrollIntoViewIfNeeded();
    const box = await trigger.boundingBox();
    if (!box) throw new Error('Missing content-type control');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(page.locator('#content-error')).toBeHidden();
    await page.mouse.up();
    await page.clock.runFor(1);
    await expect(page.locator('#content-error')).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toBeFocused();
    await page.locator('#content-type-options [data-value="file"]').click();
    await expect(page.locator('#content-type')).toHaveValue('file');
    await expect(page.locator('#content-error')).toBeHidden();
    await expect(page.locator('#content')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
  test(`inline QR supplemental fields ${lang}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(app.url + (lang === 'vi' ? 'vi/' : ''));
    await expect(page.locator('#qr-form')).toHaveAttribute(
      'data-ready',
      'true',
    );
    for (const fixture of [
      {
        kind: 'wifi',
        id: 'ssid',
        bad: 'x'.repeat(33),
        values: { password: 'fixture-password' },
        message: '32',
      },
      {
        kind: 'file',
        id: 'file-url',
        bad: 'not-a-link',
        values: {},
        message: 'http',
      },
      {
        kind: 'location',
        id: 'latitude',
        bad: '91',
        values: { longitude: '106' },
        message: '90',
      },
      {
        kind: 'contact',
        id: 'contact-email',
        bad: 'a',
        values: { 'contact-name': 'VINASIG fixture' },
        message: 'hello@example.com',
      },
      {
        kind: 'event',
        id: 'event-start',
        bad: '2026-02-31',
        values: {
          'event-title': 'VINASIG fixture',
          'event-start-time': '09:00',
          'event-end': '2026-03-01',
          'event-end-time': '10:00',
        },
        message: lang === 'vi' ? 'ngày' : 'date',
      },
      {
        kind: 'event',
        id: 'event-start-time',
        bad: '25:00',
        values: {
          'event-title': 'VINASIG fixture',
          'event-start': '2026-10-01',
          'event-end': '2026-10-02',
          'event-end-time': '10:00',
        },
        message:
          lang === 'vi'
            ? 'Chọn giờ địa phương hợp lệ. Giờ này có thể không tồn tại do thay đổi giờ mùa hè.'
            : 'Choose a valid local time. This time may be skipped by daylight saving.',
      },
    ]) {
      await choose(page, fixture.kind);
      for (const [id, value] of Object.entries(fixture.values))
        await page.locator('#' + id).fill(value);
      await page.locator('#' + fixture.id).fill(fixture.bad);
      await inlineError(page, fixture.id, fixture.message);
      const folder = 'output/responsive/inline-errors-clear-2026-10-04/after';
      await mkdir(folder, { recursive: true });
      const name = `${lang}-light-1440x900-${info.project.name}-supplemental-${fixture.id}`;
      await page
        .locator('.workspace')
        .screenshot({ path: `${folder}/${name}-workspace.png` });
      await page.locator('#' + fixture.id).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${folder}/${name}-viewport.png` });
      await page.locator('#clear').click();
      await expect(page.locator('[data-field-error]:visible')).toHaveCount(0);
      await expect(page.locator('[aria-invalid=true]')).toHaveCount(0);
    }
  });
}
