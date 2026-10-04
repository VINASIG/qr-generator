import assert from 'node:assert/strict';
import { test } from 'node:test';
import { translateHtml, translateCopy } from '../src/lib/localization.ts';
const dictionary = {
  'Hello & goodbye': 'Xin chào và tạm biệt',
  Copy: 'Sao chép',
  'A quotation': 'Một dấu " và <tag>',
};
await test('authored copy handles entities, spacing and escaped attributes', () => {
  assert.equal(
    translateCopy('  Hello &amp; goodbye  ', dictionary),
    '  Xin chào và tạm biệt  ',
  );
  assert.equal(
    translateHtml(
      '<p>Hello &amp; goodbye</p><button aria-label="A quotation">Copy</button>',
      dictionary,
    ),
    '<p>Xin chào và tạm biệt</p><button aria-label="Một dấu &quot; và &lt;tag&gt;">Sao chép</button>',
  );
});
await test('protocols, input values, code and user content remain literal', () => {
  const html =
    '<script>Copy</script><style>Copy</style><code title="Copy">Copy</code><pre>Copy</pre><svg title="Copy"><text>Copy</text></svg><textarea>Copy</textarea><input value="Copy"><span data-user-content title="Copy"><a href="/">Copy</a></span>';
  assert.equal(translateHtml(html, dictionary, { '/': '/vi/' }), html);
});
await test('local links change while reciprocal locale links keep their target', () => {
  assert.equal(
    translateHtml(
      '<a href="/">Copy</a><a href="/" hreflang="en">EN</a>',
      dictionary,
      { '/': '/vi/' },
    ),
    '<a href="/vi/">Sao chép</a><a href="/" hreflang="en">EN</a>',
  );
});

await test('textarea guidance translates while its content remains literal', () => {
  assert.equal(
    translateHtml(
      '<textarea placeholder="Copy" aria-label="Hello &amp; goodbye">Copy</textarea>',
      dictionary,
    ),
    '<textarea placeholder="Sao chép" aria-label="Xin chào và tạm biệt">Copy</textarea>',
  );
});
