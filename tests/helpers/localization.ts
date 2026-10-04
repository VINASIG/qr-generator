import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Browser } from 'playwright';

/** Read template copy only. User values, code and protocol identifiers are excluded. */
export function collectAuthoredCopy(): string[] {
  const values: string[] = [];
  const skip =
    'script,style,code,pre,svg,textarea,[data-user-content],.site-preferences';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.parentElement?.closest(skip)) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (text) values.push(text);
    }
  }
  for (const element of document.body.querySelectorAll('*')) {
    if (element.closest(skip.replace(',textarea', ''))) continue;
    for (const name of [
      'aria-label',
      'aria-description',
      'aria-valuetext',
      'aria-roledescription',
      'title',
      'alt',
      'placeholder',
    ]) {
      const text = (element.getAttribute(name) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) values.push(text);
    }
  }
  return [...new Set(values)].sort();
}

export async function checkLocalization(
  browser: Browser,
  baseURL: string,
  output: string,
  options: {
    defaultLanguage: 'en' | 'vi';
    routes: string[];
    dictionary?: string;
  },
): Promise<void> {
  await mkdir(output, { recursive: true });
  const other = options.defaultLanguage === 'en' ? 'vi' : 'en';
  const prefix = other + '/';
  let dictionary: Record<string, string> = {};
  let verbatim: string[] = [];
  if (options.dictionary) {
    dictionary = JSON.parse(
      await readFile(options.dictionary, 'utf8'),
    ) as Record<string, string>;
    verbatim = JSON.parse(
      await readFile('tests/locale-verbatim.json', 'utf8'),
    ) as string[];
  }
  for (const route of options.routes) {
    const first = route === '404.html' ? '404.html' : route;
    const second = prefix + (route === '404.html' ? '404/' : route);
    const firstURL = new URL(first, baseURL).href;
    const secondURL = new URL(second, baseURL).href;
    const noScript = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
    });
    try {
      const page = await noScript.newPage();
      await page.goto(firstURL);
      const english = options.dictionary
        ? await page.evaluate(collectAuthoredCopy)
        : [];
      const missing = english.filter(
        (text) => !Object.hasOwn(dictionary, text) && !verbatim.includes(text),
      );
      assert.deepEqual(
        missing,
        [],
        'New authored copy needs a reviewed translation',
      );
      const link = page.locator('.language-switch');
      assert.equal(
        await link.evaluate((element: HTMLAnchorElement) => element.href),
        secondURL,
      );
      assert.equal(
        await page.locator('[data-theme-toggle]').isDisabled(),
        true,
      );
      await link.click();
      assert.equal(page.url(), secondURL);
      assert.equal(await page.locator('html').getAttribute('lang'), other);
      assert.equal(await page.locator('h1').count(), 1);
      if (options.dictionary) {
        const translated = await page.evaluate(collectAuthoredCopy);
        const omitted = english.filter(
          (text) => !translated.includes(dictionary[text] ?? text),
        );
        assert.deepEqual(
          omitted,
          [],
          'The alternate page must include every reviewed template phrase',
        );
      }
      assert.equal(
        await page
          .locator('.language-switch')
          .evaluate((element: HTMLAnchorElement) => element.href),
        firstURL,
      );
    } finally {
      await noScript.close();
    }
    for (const [url, language] of [
      [firstURL, options.defaultLanguage],
      [secondURL, other],
    ] as const) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(url);
        const toggle = page.locator('[data-theme-toggle]');
        await toggle.waitFor({ state: 'visible' });
        await page.waitForFunction(
          () =>
            !document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
              ?.disabled,
        );
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          'dark',
        );
        assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
        assert.equal(
          await toggle.getAttribute('aria-label'),
          language === 'vi'
            ? 'Chuyển sang giao diện sáng'
            : 'Switch to light theme',
        );
        if (!route.includes('404')) {
          assert.equal(
            await page.locator('link[rel="alternate"][hreflang="en"]').count(),
            1,
          );
          assert.equal(
            await page.locator('link[rel="alternate"][hreflang="vi"]').count(),
            1,
          );
          const canonical = await page
            .locator('link[rel="canonical"]')
            .getAttribute('href');
          assert.equal(
            new URL(canonical ?? '').pathname,
            new URL(url).pathname,
          );
          assert.equal(
            (await page
              .locator('meta[name="description"]')
              .getAttribute('content')) === '',
            false,
          );
        }
        const inputs = page
          .locator(
            'main input:not([type="hidden"]):not([type="file"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="date"]):not([type="color"]):visible',
          )
          .first();
        if (await inputs.count()) await inputs.fill('170');
        const before = await page
          .locator('input,textarea,select')
          .evaluateAll((elements) =>
            elements.map((element) => (element as HTMLInputElement).value),
          );
        // Measure settled font and layout geometry without relaxing touch targets.
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                resolve();
              }),
            ),
          );
        });
        const boxes = await page
          .locator('.site-preferences button,.site-preferences a')
          .all();
        for (const control of boxes) {
          assert.equal(await control.isVisible(), true);
          // DOMRect retains CSS pixel precision. Firefox's protocol box can
          // round an exact 44 px height to 43.99999809265137 px.
          const box = await control.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          assert(box.width >= 44 && box.height >= 44, JSON.stringify(box));
        }
        await toggle.focus();
        await page.keyboard.press('Enter');
        assert.equal(
          await toggle.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        );
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          'light',
        );
        assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
        assert.deepEqual(
          await page
            .locator('input,textarea,select')
            .evaluateAll((elements) =>
              elements.map((element) => (element as HTMLInputElement).value),
            ),
          before,
        );
        assert.equal(
          await page.evaluate(() => localStorage.getItem('vinasig-theme')),
          'light',
        );
        assert.equal(await page.evaluate(() => sessionStorage.length), 0);
        assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [
          'vinasig-theme',
        ]);
        const light = await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        );
        await page.reload();
        await page.waitForFunction(
          () => document.documentElement.dataset['theme'] === 'light',
        );
        assert.equal(
          await page.evaluate(
            () => getComputedStyle(document.body).backgroundColor,
          ),
          light,
        );
        await page.goto(url + '?preference-test=discarded#main');
        await page.waitForFunction(
          () =>
            document.querySelector<HTMLAnchorElement>('.language-switch')
              ?.hash === '#main',
        );
        const target = await page
          .locator('.language-switch')
          .evaluate((element: HTMLAnchorElement) => element.href);
        assert.equal(new URL(target).hash, '#main');
        assert.equal(new URL(target).search, '');
        await page.locator('.language-switch').click();
        assert.equal(page.url(), target);
        assert.equal(
          await page.locator('html').getAttribute('lang'),
          language === 'vi' ? 'en' : 'vi',
        );
        await page.waitForFunction(
          () => document.documentElement.dataset['theme'] === 'light',
        );
        assert.equal(
          await page.evaluate(
            () => getComputedStyle(document.body).backgroundColor,
          ),
          light,
        );
        const sources = await page.locator('[data-brand-logo] source').all();
        for (const source of sources)
          assert.equal(await source.getAttribute('media'), 'not all');
        await page.locator('[data-theme-toggle]').click();
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          'dark',
        );
        for (const source of sources)
          assert.equal(await source.getAttribute('media'), 'all');
        const widths = await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ]);
        assert((widths[0] ?? 0) <= (widths[1] ?? 0) + 1);
        assert.deepEqual(errors, []);
        await page.screenshot({
          path: path.join(
            output,
            (route.replaceAll('/', '-') || 'home') +
              '-' +
              language +
              '-switched.png',
          ),
          fullPage: !route.includes('elements'),
        });
      } finally {
        await context.close();
      }
    }
  }
  const blocked = await browser.newContext({ colorScheme: 'light' });
  try {
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Storage unavailable', 'SecurityError');
        },
      });
    });
    const page = await blocked.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL);
    await page.waitForFunction(
      () =>
        !document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
          ?.disabled,
    );
    await page.locator('[data-theme-toggle]').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.deepEqual(errors, []);
  } finally {
    await blocked.close();
  }
}
