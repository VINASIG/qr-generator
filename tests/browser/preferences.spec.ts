import path from 'node:path';
import { test } from '@playwright/test';
import { startServer } from '../../scripts/serve.ts';
import { checkLocalization } from '../helpers/localization.ts';
let app: Awaited<ReturnType<typeof startServer>>;
test.beforeAll(async () => {
  app = await startServer(path.resolve('dist'));
});
test.afterAll(async () => {
  await app.close();
});
test('reviewed locales and appearance preferences', async ({
  browser,
}, info) => {
  await checkLocalization(browser, app.url, info.outputPath('localization'), {
    defaultLanguage: 'en',
    routes: [''],
    dictionary: 'src/locales/vi.json',
  });
});
