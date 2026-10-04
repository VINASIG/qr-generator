import {
  drawCanvas,
  geometry,
  InputError,
  makeMatrix,
  svgSource,
  validatePayload,
  wifiPayload,
} from '../lib/qr';
import type {
  ErrorCorrection,
  ImageSize,
  QrOptions,
  QuietZone,
  WifiInput,
} from '../lib/qr';
import {
  contactPayload,
  emailPayload,
  eventPayload,
  httpLink,
  localDateTimeToUtc,
  locationPayload,
  phonePayload,
  smsPayload,
} from '../lib/payloads';
import { installSelects, focusControl } from './select-control';
import { installDates } from './date-control';
import { interfaceCopy } from '../lib/interface-copy.ts';
const vietnamese = document.documentElement.lang === 'vi';
const t = (value: string): string => interfaceCopy(value, vietnamese);

installSelects();
installDates();

function element<T extends HTMLElement>(id: string, kind: { new (): T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof kind))
    throw new Error('Missing interface element ' + id);
  return node;
}
const form = element('qr-form', HTMLFormElement);
const kind = element('content-type', HTMLSelectElement);
const content = element('content', HTMLTextAreaElement);
const ssid = element('ssid', HTMLInputElement);
const password = element('password', HTMLInputElement);
const security = element('security', HTMLSelectElement);
const hidden = element('hidden-network', HTMLInputElement);
const show = element('show-password', HTMLInputElement);
const panels = [
  ...form.querySelectorAll<HTMLFieldSetElement>('fieldset[data-content-type]'),
];
const passwordFields = element('password-fields', HTMLDivElement);
const clear = element('clear', HTMLButtonElement);
const size = element('image-size', HTMLSelectElement);
const pngButton = element('download-png', HTMLButtonElement);
const svgButton = element('download-svg', HTMLButtonElement);
const status = element('form-status', HTMLParagraphElement);
const preview = element('qr-image', HTMLImageElement);
const empty = element('empty-preview', HTMLDivElement);
const details = element('encoded-details', HTMLDetailsElement);
const encoded = element('encoded-content', HTMLParagraphElement);
const technical = element('technical-details', HTMLDetailsElement);
const correction = element('error-correction', HTMLSelectElement);
const border = element('quiet-zone', HTMLSelectElement);
const version = element('qr-version', HTMLSelectElement);
const mask = element('mask-pattern', HTMLSelectElement);
const allDay = element('event-all-day', HTMLInputElement);
const eventStart = element('event-start', HTMLInputElement);
const eventEnd = element('event-end', HTMLInputElement);
const eventStartTime = element('event-start-time', HTMLInputElement);
const eventEndTime = element('event-end-time', HTMLInputElement);
const timezone = element('event-timezone', HTMLParagraphElement);
let revision = 0;
let imageUrl = '';
let png: Blob | null = null;
let svg: Blob | null = null;
const downloads = new Set<string>();
const validated = new Set<string>();
let pending: number | undefined;
let composing = false;

function message(text: string, state = 'info'): void {
  status.textContent = t(text);
  status.dataset['state'] = state;
}
function invalidate(): void {
  window.clearTimeout(pending);
  pending = undefined;
  revision++;
  form.removeAttribute('aria-busy');
  delete form.dataset['updating'];
  png = null;
  svg = null;
  pngButton.disabled = true;
  svgButton.disabled = true;
  preview.hidden = true;
  preview.removeAttribute('src');
  empty.hidden = false;
  details.hidden = true;
  encoded.textContent = '';
  technical.hidden = true;
  for (const fact of technical.querySelectorAll('dd[id]'))
    fact.textContent = '';
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = '';
  for (const field of form.querySelectorAll('[aria-invalid]'))
    field.removeAttribute('aria-invalid');
}
function updateFields(): void {
  const wifi = kind.value === 'wifi';
  for (const panel of panels) {
    panel.hidden = panel.dataset['contentType'] !== kind.value;
    panel.disabled = panel.hidden;
  }
  const open = security.value === 'nopass';
  passwordFields.hidden = open;
  password.disabled = open || !wifi;
  if (open) {
    password.value = '';
    show.checked = false;
  }
  password.type = show.checked ? 'text' : 'password';
  for (const time of [eventStartTime, eventEndTime]) {
    time.closest('.field')?.toggleAttribute('hidden', allDay.checked);
    time.disabled = allDay.checked || kind.value !== 'event';
  }
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timezone.textContent = allDay.checked
    ? t(
        'Start date is the first day. End date is the last day included. Times are not included in an all-day event.',
      )
    : vietnamese
      ? `Giờ dùng múi giờ ${zone} của thiết bị và được mã hóa theo giờ UTC.`
      : `Times use this device's timezone, ${zone}. They are encoded as universal time.`;
}
function selectedSize(): ImageSize {
  const value = Number(size.value);
  if (value !== 512 && value !== 1024 && value !== 2048)
    throw new Error('Choose a supported PNG size.');
  return value;
}
function value(id: string): string {
  const field = document.getElementById(id);
  if (!(
    field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
  ))
    throw new Error('Missing content field ' + id);
  return field.value;
}
function readOptions(): QrOptions {
  const level = correction.value as ErrorCorrection;
  const quietZone = Number(border.value) as QuietZone;
  return {
    errorCorrectionLevel: level,
    quietZone,
    ...(version.value !== 'auto' ? { version: Number(version.value) } : {}),
    ...(mask.value !== 'auto' ? { maskPattern: Number(mask.value) } : {}),
  };
}
function eventTime(date: HTMLInputElement, time: HTMLInputElement): string {
  if (!date.value)
    throw new InputError(date.id, 'Choose a date for this event.');
  if (!time.value)
    throw new InputError(time.id, 'Choose a time for this event.');
  return localDateTimeToUtc(date.value + 'T' + time.value, time.id);
}
function readPayload(): string {
  switch (kind.value) {
    case 'text':
      return validatePayload(content.value);
    case 'wifi': {
      if (
        security.value !== 'WPA' &&
        security.value !== 'WEP' &&
        security.value !== 'nopass'
      )
        throw new InputError(
          'security',
          'Choose a supported Wi-Fi security type.',
        );
      const input: WifiInput = {
        ssid: ssid.value,
        password: password.value,
        security: security.value,
        hidden: hidden.checked,
      };
      return wifiPayload(input);
    }
    case 'email':
      return emailPayload({
        address: value('email-to'),
        subject: value('email-subject'),
        body: value('email-body'),
      });
    case 'phone':
      return phonePayload(value('phone-number'), value('phone-extension'));
    case 'sms':
      return smsPayload(value('sms-number'), value('sms-message'));
    case 'contact':
      return contactPayload({
        name: value('contact-name'),
        given: value('contact-given'),
        family: value('contact-family'),
        phone: value('contact-phone'),
        email: value('contact-email'),
        organization: value('contact-organization'),
        website: value('contact-website'),
        note: value('contact-note'),
      });
    case 'location':
      return locationPayload(value('latitude'), value('longitude'));
    case 'file':
      return httpLink(value('file-url'));
    case 'event':
      if (!value('event-title').trim())
        throw new InputError('event-title', 'Enter a title for this event.');
      return eventPayload(
        {
          title: value('event-title'),
          start: allDay.checked
            ? eventStart.value
            : eventTime(eventStart, eventStartTime),
          end: allDay.checked
            ? eventEnd.value
            : eventTime(eventEnd, eventEndTime),
          allDay: allDay.checked,
          location: value('event-location'),
          description: value('event-description'),
        },
        { uid: crypto.randomUUID(), stamp: new Date().toISOString() },
      );
    default:
      throw new InputError('content-type', 'Choose a supported content type.');
  }
}
function presentError(error: unknown, focus = false): void {
  const candidate =
    error instanceof InputError ? document.getElementById(error.field) : null;
  const field =
    candidate instanceof HTMLInputElement ||
    candidate instanceof HTMLTextAreaElement ||
    candidate instanceof HTMLSelectElement
      ? !candidate.matches(':disabled')
        ? candidate
        : null
      : null;
  const target =
    field ??
    panels
      .find((panel) => !panel.hidden)
      ?.querySelector<HTMLElement>('input, textarea, select') ??
    kind;
  if (
    error instanceof InputError &&
    !focus &&
    !(target instanceof HTMLSelectElement) &&
    !validated.has(target.id)
  ) {
    message('Complete the required fields to see your QR code.');
    return;
  }
  target.setAttribute('aria-invalid', 'true');
  if (focus) {
    let disclosure = target.closest('details');
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest('details') ?? null;
    }
    focusControl(target);
  }
  message(
    error instanceof Error
      ? error.message
      : 'The QR code could not be created. Try again.',
    'error',
  );
}
async function create(focusError = false): Promise<void> {
  const ticket = revision;
  form.setAttribute('aria-busy', 'true');
  try {
    const payload = readPayload();
    const pixels = selectedSize();
    const options = readOptions();
    message('Updating your QR code...');
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );
    if (ticket !== revision) return;
    const matrix = makeMatrix(payload, options);
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
    technical.hidden = false;
    const facts = {
      'code-bytes':
        String(matrix.bytes) + (vietnamese ? ' byte UTF-8' : ' UTF-8 bytes'),
      'code-version':
        (vietnamese ? 'Phiên bản ' : 'Version ') +
        String(matrix.version) +
        ' - ' +
        String(matrix.size) +
        ' x ' +
        String(matrix.size),
      'code-correction': matrix.errorCorrectionLevel,
      'code-mask':
        (vietnamese ? 'Mặt nạ ' : 'Pattern ') + String(matrix.maskPattern),
      'code-border':
        String(matrix.quietZone) +
        (vietnamese ? ' ô tối thiểu' : ' modules minimum'),
      'code-scale':
        String(geometry(matrix, pixels).scale) +
        (vietnamese ? ' pixel mỗi ô' : ' pixels per module'),
    };
    for (const [id, fact] of Object.entries(facts))
      element(id, HTMLElement).textContent = fact;
    pngButton.disabled = false;
    svgButton.disabled = false;
    message('Your QR code is ready. Download PNG or SVG.', 'success');
  } catch (error) {
    if (ticket !== revision) return;
    presentError(error, focusError);
  } finally {
    if (ticket === revision) {
      form.removeAttribute('aria-busy');
      delete form.dataset['updating'];
    }
  }
}
function schedule(): void {
  invalidate();
  updateFields();
  message('Your QR code updates automatically as you type.');
  if (composing) return;
  form.dataset['updating'] = 'true';
  pending = window.setTimeout(() => {
    pending = undefined;
    void create();
  }, 200);
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
  if (composing) return;
  invalidate();
  updateFields();
  void create(true);
});
form.addEventListener('keydown', (event) => {
  if (
    event.key === 'Enter' &&
    !event.defaultPrevented &&
    event.target instanceof HTMLInputElement &&
    !['checkbox', 'radio'].includes(event.target.type)
  ) {
    event.preventDefault();
    if (!event.isComposing) form.requestSubmit();
  }
});
form.addEventListener('input', (event) => {
  if (event.target === show) {
    updateFields();
    return;
  }
  if (event.target instanceof HTMLElement) validated.delete(event.target.id);
  schedule();
});
form.addEventListener('focusout', (event) => {
  if (event.relatedTarget === clear) return;
  if (
    composing ||
    !(
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
  )
    return;
  validated.add(event.target.id);
  try {
    readPayload();
  } catch (error) {
    presentError(error);
  }
});
form.addEventListener('compositionstart', () => {
  composing = true;
  invalidate();
});
form.addEventListener('compositionend', () => {
  composing = false;
  schedule();
});
size.addEventListener('input', schedule);
form.addEventListener('reset', () => {
  composing = false;
  validated.clear();
  invalidate();
  details.open = false;
  technical.open = false;
  // Read defaults after the native reset action completes.
  window.setTimeout(() => {
    size.value = '1024';
    size.dispatchEvent(new Event('vinasig-select-sync'));
    element('advanced-settings', HTMLDetailsElement).open = false;
    element('contact-more', HTMLDetailsElement).open = false;
    element('event-more', HTMLDetailsElement).open = false;
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
window.addEventListener('pageshow', (event) => {
  if (event.persisted) form.reset();
});
updateFields();
clear.disabled = false;
for (const submit of form.querySelectorAll<HTMLButtonElement>(
  '[data-enter-submit]',
))
  submit.disabled = false;
form.dataset['ready'] = 'true';
