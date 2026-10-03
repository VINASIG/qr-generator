import QRCode from 'qrcode';

export const MAX_BYTES = 2000;
export const QUIET_ZONE = 4;
export type ImageSize = 512 | 1024 | 2048;
export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QuietZone = 4 | 8 | 12;
export interface QrOptions {
  errorCorrectionLevel?: ErrorCorrection;
  quietZone?: QuietZone;
  version?: number;
  maskPattern?: number;
}
export class InputError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
    this.name = 'InputError';
  }
}
export interface Matrix {
  size: number;
  data: Uint8Array;
  version: number;
  maskPattern: number;
  errorCorrectionLevel: ErrorCorrection;
  quietZone: QuietZone;
  bytes: number;
}
export interface WifiInput {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}
export const byteLength = (value: string): number =>
  new TextEncoder().encode(value).length;

export function validatePayload(value: string): string {
  if (!value.trim())
    throw new InputError(
      'content',
      'Enter a link or some text to create your QR code.',
    );
  if (byteLength(value) > MAX_BYTES)
    throw new InputError(
      'content',
      'This is too long for one QR code. Use a shorter link or less text.',
    );
  if (/[\uD800-\uDFFF]/u.test(value))
    throw new InputError(
      'content',
      'Remove incomplete Unicode characters from your content.',
    );
  if (
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return (
        (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127
      );
    })
  )
    throw new InputError(
      'content',
      'Remove unsupported control characters from your content.',
    );
  return value;
}

const wifiEscape = (value: string): string => {
  const escaped = value.replace(/[\\;,:"]/gu, '\\$&');
  return /^(?:[\da-f]{2})+$/iu.test(value) ? '"' + escaped + '"' : escaped;
};

export function wifiPayload(input: WifiInput): string {
  if (!input.ssid.trim())
    throw new InputError('ssid', 'Enter the Wi-Fi network name.');
  if (byteLength(input.ssid) > 32)
    throw new InputError(
      'ssid',
      'The Wi-Fi network name must fit within 32 UTF-8 bytes.',
    );
  if (
    Array.from(input.ssid + input.password).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    throw new InputError(
      'ssid',
      'Remove control characters from the Wi-Fi details.',
    );
  if (!['WPA', 'WEP', 'nopass'].includes(input.security))
    throw new InputError('security', 'Choose a supported Wi-Fi security type.');
  if (input.security !== 'nopass' && !input.password)
    throw new InputError(
      'password',
      'Enter the Wi-Fi password, or choose an open network.',
    );
  if (byteLength(input.password) > 128)
    throw new InputError('password', 'The Wi-Fi password is too long.');
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

export function makeMatrix(payload: string, options: QrOptions = {}): Matrix {
  validatePayload(payload);
  const level = options.errorCorrectionLevel ?? 'M';
  const quietZone = options.quietZone ?? QUIET_ZONE;
  if (!['L', 'M', 'Q', 'H'].includes(level))
    throw new InputError(
      'error-correction',
      'Choose a supported error correction level.',
    );
  if (![4, 8, 12].includes(quietZone))
    throw new InputError(
      'quiet-zone',
      'Keep a white border of 4, 8 or 12 modules.',
    );
  if (
    options.version !== undefined &&
    (!Number.isInteger(options.version) ||
      options.version < 1 ||
      options.version > 40)
  )
    throw new InputError(
      'qr-version',
      'Choose Auto or a QR version from 1 to 40.',
    );
  if (
    options.maskPattern !== undefined &&
    (!Number.isInteger(options.maskPattern) ||
      options.maskPattern < 0 ||
      options.maskPattern > 7)
  )
    throw new InputError(
      'mask-pattern',
      'Choose Auto or a mask pattern from 0 to 7.',
    );
  let code: QRCode.QRCode;
  try {
    code = QRCode.create(payload, { errorCorrectionLevel: level });
  } catch {
    throw new InputError(
      'error-correction',
      'This content will not fit at level ' +
        level +
        '. Use less content or a lower error correction level.',
    );
  }
  if (options.version !== undefined && options.version < code.version)
    throw new InputError(
      'qr-version',
      'This content needs version ' +
        String(code.version) +
        ' or larger at level ' +
        level +
        '. Choose Auto or a larger version.',
    );
  if (options.version !== undefined || options.maskPattern !== undefined)
    code = QRCode.create(payload, {
      errorCorrectionLevel: level,
      ...(options.version !== undefined ? { version: options.version } : {}),
      ...(options.maskPattern !== undefined
        ? { maskPattern: options.maskPattern as QRCode.QRCodeMaskPattern }
        : {}),
    });
  if (code.maskPattern === undefined)
    throw new Error('The QR encoder did not return a mask pattern.');
  return {
    size: code.modules.size,
    data: new Uint8Array(code.modules.data),
    version: code.version,
    maskPattern: code.maskPattern,
    errorCorrectionLevel: level,
    quietZone,
    bytes: byteLength(payload),
  };
}

export function geometry(matrix: Matrix, pixels: ImageSize) {
  const scale = Math.floor(pixels / (matrix.size + 2 * matrix.quietZone));
  const offset = Math.floor((pixels - matrix.size * scale) / 2);
  if (scale < 1 || offset < matrix.quietZone * scale)
    throw new Error('Choose a larger PNG size for this content.');
  return { scale, offset, pixels };
}

export function svgSource(matrix: Matrix): string {
  const width = matrix.size + matrix.quietZone * 2;
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
        String(start + matrix.quietZone) +
        ' ' +
        String(row + matrix.quietZone) +
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
