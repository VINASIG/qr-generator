import jsQR from 'jsqr';
import { geometry } from '../../src/lib/qr.ts';
import type { Matrix } from '../../src/lib/qr.ts';

export function decode(matrix: Matrix): string | undefined {
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
