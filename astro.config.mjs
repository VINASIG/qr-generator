import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://qr.vinasig.io.vn',
  base: '/',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'never' },
});
