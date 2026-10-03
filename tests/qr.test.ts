import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decode } from './helpers/decode.ts';
import {
  geometry,
  makeMatrix,
  MAX_BYTES,
  QUIET_ZONE,
  svgSource,
  validatePayload,
  wifiPayload,
} from '../src/lib/qr.ts';
for (const payload of [
  'https://example.com/path?a=one&b=two#section',
  ' leading and trailing spaces ',
  'VINASIG\nSecond line',
  'Tiếng Việt • 日本語 • 😀',
  '<script>alert("x")</script>',
  'a'.repeat(MAX_BYTES),
]) {
  void test(
    'independent decoder preserves exact content ' + payload.slice(0, 45),
    () => {
      assert.equal(decode(makeMatrix(payload)), payload);
    },
  );
}
for (const value of [
  '',
  ' \n\t ',
  'a'.repeat(MAX_BYTES + 1),
  '\u0000test',
  '\uD800',
  '\uDC00',
]) {
  void test(
    'reject invalid payload ' + JSON.stringify(value.slice(0, 15)),
    () => {
      assert.throws(() => validatePayload(value));
    },
  );
}
void test('capacity uses UTF-8 bytes', () => {
  assert.equal(validatePayload('é'.repeat(1000)), 'é'.repeat(1000));
  assert.throws(() => validatePayload('é'.repeat(1001)));
});
void test('Wi-Fi escapes punctuation and keeps hidden network flag', () => {
  const result = wifiPayload({
    ssid: 'Cafe; West',
    password: 'a\\b:c,"d',
    security: 'WPA',
    hidden: true,
  });
  assert.equal(
    result,
    'WIFI:T:WPA;S:Cafe\\; West;P:a\\\\b\\:c\\,\\"d;H:true;;',
  );
  assert.equal(decode(makeMatrix(result)), result);
});
void test('hex-looking names and passwords are literal strings', () => {
  assert.equal(
    wifiPayload({
      ssid: 'CAFE',
      password: '12345678',
      security: 'WPA',
      hidden: false,
    }),
    'WIFI:T:WPA;S:"CAFE";P:"12345678";H:false;;',
  );
});
void test('open network never encodes an old password', () => {
  assert.equal(
    wifiPayload({
      ssid: 'Guest',
      password: 'sensitive',
      security: 'nopass',
      hidden: false,
    }),
    'WIFI:T:nopass;S:Guest;H:false;;',
  );
});
void test('Wi-Fi validates SSID bytes and required password', () => {
  for (const ssid of ['', 'a'.repeat(33), 'é'.repeat(17), 'one\ntwo'])
    assert.throws(() =>
      wifiPayload({
        ssid,
        password: 'example',
        security: 'WPA',
        hidden: false,
      }),
    );
  assert.throws(() =>
    wifiPayload({
      ssid: 'Guest',
      password: '',
      security: 'WPA',
      hidden: false,
    }),
  );
});
void test('integer pixels maintain minimum quiet zone at every export size', () => {
  const matrix = makeMatrix('https://example.com');
  for (const size of [512, 1024, 2048] as const) {
    const result = geometry(matrix, size);
    assert(Number.isInteger(result.scale));
    assert(result.offset >= QUIET_ZONE * result.scale);
    assert(
      size - result.offset - matrix.size * result.scale >=
        QUIET_ZONE * result.scale,
    );
  }
});
void test('SVG is self-contained vector geometry with no input markup or remote links', () => {
  const svg = svgSource(makeMatrix('<script>alert("x")</script>'));
  assert(svg.includes('shape-rendering="crispEdges"'));
  assert(svg.includes('fill="#fff"') && svg.includes('fill="#000"'));
  assert(
    !svg.includes('<script') &&
      !svg.includes('href=') &&
      !svg.includes('<text'),
  );
});

for (const level of ['L', 'M', 'Q', 'H'] as const)
  void test(
    'error correction ' + level + ' independently decodes exact Unicode',
    () => {
      const payload = 'Tiếng Việt • https://example.com/?a=1&b=2';
      const matrix = makeMatrix(payload, { errorCorrectionLevel: level });
      assert.equal(matrix.errorCorrectionLevel, level);
      assert.equal(matrix.bytes, new TextEncoder().encode(payload).length);
      assert.equal(matrix.size, 17 + 4 * matrix.version);
      assert.equal(decode(matrix), payload);
    },
  );
for (const mask of [0, 1, 2, 3, 4, 5, 6, 7])
  void test('mask ' + String(mask) + ' keeps the same content', () => {
    const matrix = makeMatrix('Mask fixture', {
      maskPattern: mask,
      version: 5,
    });
    assert.equal(matrix.maskPattern, mask);
    assert.equal(matrix.version, 5);
    assert.equal(matrix.size, 37);
    assert.equal(decode(matrix), 'Mask fixture');
  });
for (const quietZone of [4, 8, 12] as const)
  void test(
    'quiet zone ' + String(quietZone) + ' is retained in PNG geometry and SVG',
    () => {
      const matrix = makeMatrix('Border fixture', { quietZone });
      for (const pixels of [512, 1024, 2048] as const) {
        const { scale, offset } = geometry(matrix, pixels);
        assert.equal(Math.floor(scale), scale);
        assert(offset >= quietZone * scale);
        assert(pixels - offset - matrix.size * scale >= quietZone * scale);
      }
      assert(
        svgSource(matrix).includes(
          'viewBox="0 0 ' + String(matrix.size + quietZone * 2),
        ),
      );
      assert.equal(decode(matrix), 'Border fixture');
    },
  );
void test('a version too small explains the minimum version and preserves automatic generation', () => {
  const payload = 'a'.repeat(100);
  const minimum = makeMatrix(payload).version;
  assert.throws(
    () => makeMatrix(payload, { version: 1 }),
    new RegExp('needs version ' + String(minimum)),
  );
  assert.equal(decode(makeMatrix(payload, { version: minimum })), payload);
  assert.equal(makeMatrix('x', { version: 40 }).size, 177);
});
void test('correction capacity uses actual encoder modes rather than a false universal character limit', () => {
  assert.equal(
    decode(makeMatrix('a'.repeat(1273), { errorCorrectionLevel: 'H' })),
    'a'.repeat(1273),
  );
  assert.throws(
    () => makeMatrix('a'.repeat(1274), { errorCorrectionLevel: 'H' }),
    /will not fit at level H/u,
  );
  assert.equal(
    decode(makeMatrix('1'.repeat(2000), { errorCorrectionLevel: 'H' })),
    '1'.repeat(2000),
  );
  assert.throws(
    () => makeMatrix('1'.repeat(2001), { errorCorrectionLevel: 'L' }),
    /too long/u,
  );
});
for (const options of [
  { version: 0 },
  { version: 41 },
  { version: 2.5 },
  { maskPattern: -1 },
  { maskPattern: 8 },
  { maskPattern: NaN },
])
  void test('invalid technical settings ' + JSON.stringify(options), () => {
    assert.throws(() => makeMatrix('Fixture', options));
  });
