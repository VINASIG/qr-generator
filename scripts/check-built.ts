import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { FileSystemConfigLoader, HtmlValidate } from 'html-validate';
import {
  digest,
  readLocal,
  record,
  parseJson,
  text,
  repositoryRoot,
  writeOutput,
} from './local.ts';

const html = (await readLocal(repositoryRoot, 'dist/index.html')).toString(
  'utf8',
);
const validation = await new HtmlValidate(
  new FileSystemConfigLoader(),
).validateString(html, 'dist/index.html');
assert(
  validation.valid,
  JSON.stringify(
    validation.results.flatMap((result) => result.messages),
    null,
    2,
  ),
);
const canonical = 'https://vinasig.github.io/qr-generator/';
assert(html.includes('href="' + canonical + '"'));
assert(html.includes('application/ld+json') && html.includes('WebApplication'));
assert(
  (await readLocal(repositoryRoot, 'dist/sitemap.xml'))
    .toString()
    .includes('<loc>' + canonical + '</loc>'),
);
const manifest = record(
  parseJson(await readLocal(repositoryRoot, 'docs/asset-manifest.json')),
);
const assets = Object.entries(record(manifest['files']));
// Add only the reviewed Reversed export. Every existing digest stays fixed.
assert.equal(assets.length, 9);
for (const [file, expected] of assets) {
  assert(file.startsWith('public/'));
  const bytes = await readLocal(repositoryRoot, file);
  assert.equal(digest(bytes), text(expected), 'Changed asset ' + file);
  assert.deepEqual(
    await readLocal(repositoryRoot, 'dist/' + file.slice(7)),
    bytes,
    'Published asset differs ' + file,
  );
}
const notices = [
  ['node_modules/qrcode/license', 'licenses/node-qrcode.txt'],
  ['node_modules/@lucide/astro/LICENSE', 'licenses/lucide.txt'],
] as const;
for (const [installed, published] of notices) {
  const bytes = await readFile(path.join(repositoryRoot, installed));
  assert.deepEqual(
    await readLocal(repositoryRoot, 'public/' + published),
    bytes,
    'Source notice differs ' + published,
  );
  assert.deepEqual(
    await readLocal(repositoryRoot, 'dist/' + published),
    bytes,
    'Published notice differs ' + published,
  );
}
await writeOutput(
  repositoryRoot,
  'output/checks/built.json',
  JSON.stringify({
    status: 'PASS',
    html: 'PASS',
    canonical,
    preservedAssets: assets.length,
    preservedNotices: notices.length,
  }) + '\n',
);
console.log('Built HTML, metadata and preserved asset digests passed.');
