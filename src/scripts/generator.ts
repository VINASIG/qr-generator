import {
  drawCanvas,
  makeMatrix,
  svgSource,
  validatePayload,
  wifiPayload,
} from '../lib/qr';
import type { ImageSize, WifiInput } from '../lib/qr';

function element<T extends HTMLElement>(id: string, kind: { new (): T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof kind))
    throw new Error('Missing interface element ' + id);
  return node;
}
const form = element('qr-form', HTMLFormElement);
const content = element('content', HTMLTextAreaElement);
const ssid = element('ssid', HTMLInputElement);
const password = element('password', HTMLInputElement);
const security = element('security', HTMLSelectElement);
const hidden = element('hidden-network', HTMLInputElement);
const show = element('show-password', HTMLInputElement);
const wifiFields = element('wifi-fields', HTMLFieldSetElement);
const textFields = element('text-fields', HTMLDivElement);
const passwordFields = element('password-fields', HTMLDivElement);
const generate = element('generate', HTMLButtonElement);
const clear = element('clear', HTMLButtonElement);
const size = element('image-size', HTMLSelectElement);
const pngButton = element('download-png', HTMLButtonElement);
const svgButton = element('download-svg', HTMLButtonElement);
const status = element('form-status', HTMLParagraphElement);
const preview = element('qr-image', HTMLImageElement);
const previewPanel = element('preview-panel', HTMLElement);
const empty = element('empty-preview', HTMLDivElement);
const details = element('encoded-details', HTMLDetailsElement);
const encoded = element('encoded-content', HTMLParagraphElement);
let revision = 0;
let imageUrl = '';
let png: Blob | null = null;
let svg: Blob | null = null;
const downloads = new Set<string>();

function message(text: string, state = 'info'): void {
  status.textContent = text;
  status.dataset['state'] = state;
}
function invalidate(): void {
  revision++;
  png = null;
  svg = null;
  pngButton.disabled = true;
  svgButton.disabled = true;
  preview.hidden = true;
  preview.removeAttribute('src');
  empty.hidden = false;
  details.hidden = true;
  details.open = false;
  encoded.textContent = '';
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = '';
  for (const field of [content, ssid, password])
    field.removeAttribute('aria-invalid');
}
function updateFields(): void {
  const wifi =
    form.querySelector<HTMLInputElement>('input[name="kind"]:checked')
      ?.value === 'wifi';
  wifiFields.hidden = !wifi;
  wifiFields.disabled = !wifi;
  textFields.hidden = wifi;
  content.disabled = wifi;
  const open = security.value === 'nopass';
  passwordFields.hidden = open;
  password.disabled = open || !wifi;
  if (open) {
    password.value = '';
    show.checked = false;
  }
  password.type = show.checked ? 'text' : 'password';
}
function selectedSize(): ImageSize {
  const value = Number(size.value);
  if (value !== 512 && value !== 1024 && value !== 2048)
    throw new Error('Choose a supported PNG size.');
  return value;
}
function readPayload(): string {
  if (!wifiFields.hidden) {
    if (
      security.value !== 'WPA' &&
      security.value !== 'WEP' &&
      security.value !== 'nopass'
    )
      throw new Error('Choose a supported Wi-Fi security type.');
    const input: WifiInput = {
      ssid: ssid.value,
      password: password.value,
      security: security.value,
      hidden: hidden.checked,
    };
    return wifiPayload(input);
  }
  return validatePayload(content.value);
}
async function create(): Promise<void> {
  invalidate();
  const ticket = revision;
  generate.disabled = true;
  clear.disabled = true;
  form.setAttribute('aria-busy', 'true');
  message('Creating your QR code...');
  try {
    const payload = readPayload();
    const pixels = selectedSize();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );
    const matrix = makeMatrix(payload);
    const canvas = document.createElement('canvas');
    drawCanvas(canvas, matrix, pixels);
    const nextPng = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The PNG could not be created. Try again.'));
      }, 'image/png');
    });
    if (ticket !== revision) return;
    png = nextPng;
    svg = new Blob([svgSource(matrix)], { type: 'image/svg+xml' });
    imageUrl = URL.createObjectURL(svg);
    preview.src = imageUrl;
    preview.hidden = false;
    empty.hidden = true;
    details.hidden = false;
    encoded.textContent = payload;
    pngButton.disabled = false;
    svgButton.disabled = false;
    message('Your QR code is ready. Download PNG or SVG.', 'success');
    if (window.matchMedia('(max-width: 760px)').matches) {
      previewPanel.focus({ preventScroll: true });
      previewPanel.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  } catch (error) {
    if (ticket !== revision) return;
    const field = wifiFields.hidden
      ? content
      : !ssid.value.trim() ||
          (error instanceof Error && error.message.includes('network name'))
        ? ssid
        : password;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
    message(
      error instanceof Error
        ? error.message
        : 'The QR code could not be created. Try again.',
      'error',
    );
  } finally {
    generate.disabled = false;
    clear.disabled = false;
    form.removeAttribute('aria-busy');
  }
}
function download(blob: Blob | null, extension: 'png' | 'svg'): void {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  downloads.add(url);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'qr-code.' + extension;
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive while the browser starts the local download.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    downloads.delete(url);
  }, 60000);
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  void create();
});
form.addEventListener('input', (event) => {
  if (event.target === show) {
    updateFields();
    return;
  }
  invalidate();
  updateFields();
  message('Content changed. Create a new QR code to download it.');
});
size.addEventListener('change', () => {
  invalidate();
  message('Size changed. Create a new QR code to download it.');
});
form.addEventListener('reset', () => {
  invalidate();
  // Read the default radio values after the native reset action completes.
  window.setTimeout(() => {
    updateFields();
    message('Your content stays in this browser.');
    content.focus();
  }, 0);
});
pngButton.addEventListener('click', () => {
  download(png, 'png');
});
svgButton.addEventListener('click', () => {
  download(svg, 'svg');
});
window.addEventListener('pagehide', () => {
  invalidate();
  for (const url of downloads) URL.revokeObjectURL(url);
  downloads.clear();
});
updateFields();
