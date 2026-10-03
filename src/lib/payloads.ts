import { InputError, byteLength, validatePayload } from './qr.ts';

function finish(payload: string, field: string): string {
  try {
    return validatePayload(payload);
  } catch (error) {
    if (error instanceof InputError) throw new InputError(field, error.message);
    throw error;
  }
}

function largestField(fields: Record<string, string>): string {
  const sorted = Object.entries(fields).sort(
    (a, b) => byteLength(b[1]) - byteLength(a[1]),
  );
  const first = sorted[0];
  if (!first) throw new Error('Missing fields for payload validation');
  return first[0];
}

function clean(value: string, field: string, multiline = false): string {
  if (/[\uD800-\uDFFF]/u.test(value))
    throw new InputError(field, 'Remove incomplete Unicode characters.');
  if (
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return (
        code === 127 ||
        (code < 32 && !(multiline && [9, 10, 13].includes(code)))
      );
    })
  )
    throw new InputError(
      field,
      'Remove unsupported control characters from this field.',
    );
  return value;
}

function required(value: string, field: string, message: string): string {
  const result = clean(value, field).trim();
  if (!result) throw new InputError(field, message);
  return result;
}

export function httpLink(value: string, field = 'file-url'): string {
  const result = required(
    value,
    field,
    'Enter the complete https:// or http:// link.',
  );
  let url: URL;
  try {
    url = new URL(result);
  } catch {
    throw new InputError(field, 'Use a complete https:// or http:// link.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    /\s/u.test(result)
  )
    throw new InputError(
      field,
      'Use an http:// or https:// link without spaces or sign-in credentials.',
    );
  // Validate the scheme without rewriting case, escapes, path or query.
  return finish(result, field);
}

export function phoneNumber(value: string, field: string): string {
  const result = required(
    value,
    field,
    'Enter a phone number with + and its country code.',
  );
  const normalized = result.replace(/[ ().-]/gu, '');
  if (!/^\+[1-9]\d{1,14}$/u.test(normalized))
    throw new InputError(
      field,
      'Use + and a country code, followed by 2 to 15 digits in total.',
    );
  return normalized;
}

export function emailAddress(value: string, field: string): string {
  const result = required(
    value,
    field,
    'Enter one email address, such as hello@example.com.',
  );
  const [local, domain, extra] = result.split('@');
  if (
    !local ||
    !domain ||
    extra !== undefined ||
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/u.test(
      local,
    )
  )
    throw new InputError(
      field,
      'Use one email address with an unquoted ASCII name before @.',
    );
  let asciiDomain: string;
  try {
    asciiDomain = new URL('https://' + domain).hostname;
  } catch {
    throw new InputError(
      field,
      'Check the domain after @ in your email address.',
    );
  }
  if (
    /[:/\\?#%\s]/u.test(domain) ||
    !asciiDomain
      .split('.')
      .every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/iu.test(label))
  )
    throw new InputError(
      field,
      'Check the domain after @ in your email address.',
    );
  return local + '@' + asciiDomain;
}

const percent = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/gu,
    (character) => '%' + character.charCodeAt(0).toString(16).toUpperCase(),
  );

export function emailPayload(input: {
  address: string;
  subject: string;
  body: string;
}): string {
  const address = emailAddress(input.address, 'email-to');
  const subject = clean(input.subject, 'email-subject');
  const body = clean(input.body, 'email-body', true).replace(
    /\r\n|\r|\n/gu,
    '\r\n',
  );
  const fields = [];
  if (subject) fields.push('subject=' + percent(subject));
  if (body) fields.push('body=' + percent(body));
  const at = address.lastIndexOf('@');
  return finish(
    'mailto:' +
      percent(address.slice(0, at)) +
      address.slice(at) +
      (fields.length ? '?' + fields.join('&') : ''),
    largestField({
      'email-to': address,
      'email-subject': percent(subject),
      'email-body': percent(body),
    }),
  );
}

export function phonePayload(number: string, extension: string): string {
  const phone = phoneNumber(number, 'phone-number');
  const ext = clean(extension, 'phone-extension').trim();
  if (ext && !/^\d+$/u.test(ext))
    throw new InputError(
      'phone-extension',
      'Use digits only for the extension.',
    );
  return finish(
    'tel:' + phone + (ext ? ';ext=' + ext : ''),
    ext ? 'phone-extension' : 'phone-number',
  );
}

export function smsPayload(number: string, message: string): string {
  const phone = phoneNumber(number, 'sms-number');
  const body = clean(message, 'sms-message', true);
  return finish(
    'sms:' + phone + (body ? '?body=' + percent(body) : ''),
    body ? 'sms-message' : 'sms-number',
  );
}

function coordinate(value: string, field: string, limit: number): string {
  const label = limit === 90 ? 'latitude' : 'longitude';
  const result = required(
    value,
    field,
    'Enter the ' + label + ' in decimal degrees.',
  ).replace(',', '.');
  if (
    !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(result) ||
    Math.abs(Number(result)) > limit
  )
    throw new InputError(
      field,
      'Use a ' +
        label +
        ' between -' +
        String(limit) +
        ' and ' +
        String(limit) +
        '.',
    );
  return result
    .replace(/^\+/u, '')
    .replace(/^\./u, '0.')
    .replace(/^-\./u, '-0.');
}

export function locationPayload(latitude: string, longitude: string): string {
  const lat = coordinate(latitude, 'latitude', 90);
  const lon = coordinate(longitude, 'longitude', 180);
  // RFC 5870 uses longitude zero at the poles.
  return finish(
    'geo:' + lat + ',' + (Math.abs(Number(lat)) === 90 ? '0' : lon),
    largestField({ latitude: lat, longitude: lon }),
  );
}

const textValue = (value: string): string =>
  value
    .replace(/\\/gu, '\\\\')
    .replace(/\r\n|\r|\n/gu, '\\n')
    .replace(/;/gu, '\\;')
    .replace(/,/gu, '\\,');

export function foldLine(line: string): string {
  const parts: string[] = [];
  let part = '',
    bytes = 0;
  for (const character of line) {
    const size = byteLength(character);
    if (bytes + size > 75) {
      parts.push(part);
      part = ' ';
      bytes = 1;
    }
    part += character;
    bytes += size;
  }
  parts.push(part);
  return parts.join('\r\n');
}

export interface ContactInput {
  name: string;
  given: string;
  family: string;
  phone: string;
  email: string;
  organization: string;
  website: string;
  note: string;
}

export function contactPayload(input: ContactInput): string {
  const name = required(
    input.name,
    'contact-name',
    'Enter the full name for this contact.',
  );
  const given = clean(input.given, 'contact-given').trim();
  const family = clean(input.family, 'contact-family').trim();
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:' + textValue(family) + ';' + textValue(given) + ';;;',
    'FN:' + textValue(name),
  ];
  if (input.phone.trim())
    lines.push('TEL;TYPE=CELL:' + phoneNumber(input.phone, 'contact-phone'));
  if (input.email.trim())
    lines.push(
      'EMAIL;TYPE=INTERNET:' +
        textValue(emailAddress(input.email, 'contact-email')),
    );
  if (input.organization.trim())
    lines.push(
      'ORG:' + textValue(clean(input.organization, 'contact-organization')),
    );
  if (input.website.trim())
    lines.push('URL:' + httpLink(input.website, 'contact-website'));
  if (input.note)
    lines.push('NOTE:' + textValue(clean(input.note, 'contact-note', true)));
  lines.push('END:VCARD');
  return finish(
    lines.map(foldLine).join('\r\n') + '\r\n',
    largestField({
      'contact-name': input.name,
      'contact-given': input.given,
      'contact-family': input.family,
      'contact-phone': input.phone,
      'contact-email': input.email,
      'contact-organization': input.organization,
      'contact-website': input.website,
      'contact-note': input.note,
    }),
  );
}

function validDate(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || Number(value.slice(0, 4)) < 1000)
    throw new InputError(
      field,
      'Choose a date with a year between 1000 and 9999.',
    );
  const date = new Date(value + 'T00:00:00Z');
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new InputError(field, 'Choose a valid calendar date.');
  return date;
}

export function localDateTimeToUtc(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u.test(value))
    throw new InputError(field, 'Choose both a date and a time.');
  validDate(value.slice(0, 10), field);
  const date = new Date(value);
  const [hours, minutes] = value.slice(11).split(':').map(Number);
  if (
    !Number.isFinite(date.getTime()) ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getDate() !== Number(value.slice(8, 10))
  )
    throw new InputError(
      field,
      'Choose a valid local time. This time may be skipped by daylight saving.',
    );
  const iso = date.toISOString();
  if (iso.length !== 24 || Number(iso.slice(0, 4)) < 1000)
    throw new InputError(
      field,
      'Use a date that also fits within years 1000 to 9999 in UTC.',
    );
  return iso;
}

export interface EventInput {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  description: string;
}

const utcStamp = (value: string, field: string): string => {
  const date = new Date(value);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) ||
    Number(value.slice(0, 4)) < 1000 ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString() !== value
  )
    throw new InputError(field, 'Choose a valid event date and time.');
  return value.replace(/[-:]/gu, '').replace(/\.\d{3}/u, '');
};

export function eventPayload(
  input: EventInput,
  metadata: { uid: string; stamp: string },
): string {
  const title = required(
    input.title,
    'event-title',
    'Enter a title for this event.',
  );
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/iu.test(metadata.uid))
    throw new InputError(
      'event-title',
      'The event identifier could not be created. Try again.',
    );
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QR Generator//Static Event//EN',
    'BEGIN:VEVENT',
    'UID:urn:uuid:' + metadata.uid,
    'DTSTAMP:' + utcStamp(metadata.stamp, 'event-title'),
    'SUMMARY:' + textValue(title),
  ];
  if (input.allDay) {
    const start = validDate(input.start, 'event-start'),
      end = validDate(input.end, 'event-end');
    if (end < start)
      throw new InputError(
        'event-end',
        'The last day must be on or after the first day.',
      );
    end.setUTCDate(end.getUTCDate() + 1);
    if (end.toISOString().length !== 24)
      throw new InputError(
        'event-end',
        'Choose a last day before 31 December 9999.',
      );
    lines.push(
      'DTSTART;VALUE=DATE:' + input.start.replace(/-/gu, ''),
      'DTEND;VALUE=DATE:' + end.toISOString().slice(0, 10).replace(/-/gu, ''),
    );
  } else {
    const start = utcStamp(input.start, 'event-start'),
      end = utcStamp(input.end, 'event-end');
    if (input.end <= input.start)
      throw new InputError('event-end', 'The end must be after the start.');
    lines.push('DTSTART:' + start, 'DTEND:' + end);
  }
  if (input.location.trim())
    lines.push(
      'LOCATION:' + textValue(clean(input.location, 'event-location')),
    );
  if (input.description)
    lines.push(
      'DESCRIPTION:' +
        textValue(clean(input.description, 'event-description', true)),
    );
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return finish(
    lines.map(foldLine).join('\r\n') + '\r\n',
    largestField({
      'event-title': input.title,
      'event-location': input.location,
      'event-description': input.description,
    }),
  );
}
