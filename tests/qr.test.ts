import assert from 'node:assert/strict';
import { test } from 'node:test';
import jsQR from 'jsqr';
import {
  geometry,
  makeMatrix,
  MAX_BYTES,
  QUIET_ZONE,
  svgSource,
  validatePayload,
  wifiPayload,
} from '../src/lib/qr.ts';
import type { Matrix } from '../src/lib/qr.ts';

function decode(matrix: Matrix): string | undefined {
  const { scale, offset, pixels } = geometry(matrix, 512);
  const rgba = new Uint8ClampedArray(pixels * pixels * 4).fill(255);
  for (let row = 0; row < matrix.size; row++)
    for (let column = 0; column < matrix.size; column++)
      if (matrix.data[row * matrix.size + column]) {
        for (let y = 0; y < scale; y++)
          for (let x = 0; x < scale; x++) {
            const index =
              ((offset + row * scale + y) * pixels +
                offset +
                column * scale +
                x) *
              4;
            rgba[index] = rgba[index + 1] = rgba[index + 2] = 0;
          }
      }
  return jsQR(rgba, pixels, pixels)?.data;
}
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
