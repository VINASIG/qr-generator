import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vinasig.github.io',
  base: '/qr-generator',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'never' },
});
