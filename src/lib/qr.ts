import QRCode from 'qrcode';

export const MAX_BYTES = 2000;
export const QUIET_ZONE = 4;
export type ImageSize = 512 | 1024 | 2048;
export interface Matrix {
  size: number;
  data: Uint8Array;
}
export interface WifiInput {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}
const byteLength = (value: string): number =>
  new TextEncoder().encode(value).length;

export function validatePayload(value: string): string {
  if (!value.trim())
    throw new Error('Enter a link or some text to create your QR code.');
  if (byteLength(value) > MAX_BYTES)
    throw new Error(
      'This is too long for one QR code. Use a shorter link or less text.',
    );
  if (/[\uD800-\uDFFF]/u.test(value))
    throw new Error('Remove incomplete Unicode characters from your content.');
  if (
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return (
        (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127
      );
    })
  )
    throw new Error('Remove unsupported control characters from your content.');
  return value;
}

const wifiEscape = (value: string): string => {
  const escaped = value.replace(/[\\;,:"]/gu, '\\$&');
  return /^(?:[\da-f]{2})+$/iu.test(value) ? '"' + escaped + '"' : escaped;
};

export function wifiPayload(input: WifiInput): string {
  if (!input.ssid.trim()) throw new Error('Enter the Wi-Fi network name.');
  if (byteLength(input.ssid) > 32)
    throw new Error('The Wi-Fi network name must fit within 32 UTF-8 bytes.');
  if (
    Array.from(input.ssid + input.password).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    throw new Error('Remove control characters from the Wi-Fi details.');
  if (!['WPA', 'WEP', 'nopass'].includes(input.security))
    throw new Error('Choose a supported Wi-Fi security type.');
  if (input.security !== 'nopass' && !input.password)
    throw new Error('Enter the Wi-Fi password, or choose an open network.');
  if (byteLength(input.password) > 128)
    throw new Error('The Wi-Fi password is too long.');
  const password =
    input.security === 'nopass' ? '' : ';P:' + wifiEscape(input.password);
  return validatePayload(
    'WIFI:T:' +
      input.security +
      ';S:' +
      wifiEscape(input.ssid) +
      password +
      ';H:' +
      String(input.hidden) +
      ';;',
  );
}

export function makeMatrix(payload: string): Matrix {
  const code = QRCode.create(validatePayload(payload), {
    errorCorrectionLevel: 'M',
  });
  return { size: code.modules.size, data: new Uint8Array(code.modules.data) };
}

export function geometry(matrix: Matrix, pixels: ImageSize) {
  const scale = Math.floor(pixels / (matrix.size + 2 * QUIET_ZONE));
  const offset = Math.floor((pixels - matrix.size * scale) / 2);
  if (scale < 1 || offset < QUIET_ZONE * scale)
    throw new Error('Choose a larger PNG size for this content.');
  return { scale, offset, pixels };
}

export function svgSource(matrix: Matrix): string {
  const width = matrix.size + QUIET_ZONE * 2;
  let shape = '';
  for (let row = 0; row < matrix.size; row++) {
    let column = 0;
    while (column < matrix.size) {
      if (!matrix.data[row * matrix.size + column]) {
        column++;
        continue;
      }
      const start = column;
      while (column < matrix.size && matrix.data[row * matrix.size + column])
        column++;
      shape +=
        'M' +
        String(start + QUIET_ZONE) +
        ' ' +
        String(row + QUIET_ZONE) +
        'h' +
        String(column - start) +
        'v1h-' +
        String(column - start) +
        'z';
    }
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    String(width) +
    '" height="' +
    String(width) +
    '" viewBox="0 0 ' +
    String(width) +
    ' ' +
    String(width) +
    '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' +
    shape +
    '" fill="#000"/></svg>'
  );
}

export function drawCanvas(
  canvas: HTMLCanvasElement,
  matrix: Matrix,
  pixels: ImageSize,
): void {
  const { scale, offset } = geometry(matrix, pixels);
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error(
      'Your browser could not draw this QR code. Try another browser.',
    );
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, pixels, pixels);
  context.fillStyle = '#000';
  for (let row = 0; row < matrix.size; row++)
    for (let column = 0; column < matrix.size; column++) {
      if (matrix.data[row * matrix.size + column])
        context.fillRect(
          offset + column * scale,
          offset + row * scale,
          scale,
          scale,
        );
    }
}
