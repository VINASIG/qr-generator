import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeMatrix, InputError, byteLength } from '../src/lib/qr.ts';
import {
  contactPayload,
  emailAddress,
  emailPayload,
  eventPayload,
  foldLine,
  httpLink,
  localDateTimeToUtc,
  locationPayload,
  phonePayload,
  smsPayload,
} from '../src/lib/payloads.ts';
import type { ContactInput, EventInput } from '../src/lib/payloads.ts';
import { decode } from './helpers/decode.ts';

const contact: ContactInput = {
  name: 'Alex Taylor',
  given: 'Alex',
  family: 'Taylor',
  phone: '',
  email: '',
  organization: '',
  website: '',
  note: '',
};
const event: EventInput = {
  title: 'Meetup',
  start: '2026-10-03T02:00:00.000Z',
  end: '2026-10-03T03:00:00.000Z',
  allDay: false,
  location: '',
  description: '',
};
const metadata = {
  uid: '11111111-1111-4111-8111-111111111111',
  stamp: '2026-10-01T12:00:00.000Z',
};

void test('email is an RFC 6068 draft with encoded UTF-8, reserved characters and CRLF', () => {
  const payload = emailPayload({
    address: 'hello+qr@example.com',
    subject: 'Tiếng Việt & Q?',
    body: 'line 1\nline 2 #?&',
  });
  assert.equal(
    payload,
    'mailto:hello%2Bqr@example.com?subject=Ti%E1%BA%BFng%20Vi%E1%BB%87t%20%26%20Q%3F&body=line%201%0D%0Aline%202%20%23%3F%26',
  );
  assert.equal(decode(makeMatrix(payload)), payload);
  assert.equal(
    emailPayload({ address: 'a@example.com', subject: '', body: '' }),
    'mailto:a@example.com',
  );
  assert.equal(
    emailAddress('a@bücher.example', 'email-to'),
    'a@xn--bcher-kva.example',
  );
});
for (const address of [
  '',
  'a,b@example.com',
  'a@host/path',
  'a@host:80',
  'a\n@example.com',
  'a@host%2ecom',
  'a@example.com?bcc=other@example.com',
  '"quoted"@example.com',
  'a..b@example.com',
])
  void test(
    'invalid or unsupported email address ' + JSON.stringify(address),
    () => {
      assert.throws(
        () => emailPayload({ address, subject: '', body: '' }),
        InputError,
      );
    },
  );
void test('email header injection is rejected while a multiline body remains content', () => {
  assert.throws(
    () =>
      emailPayload({
        address: 'a@example.com',
        subject: 'hi\r\nBcc:other@example.com',
        body: '',
      }),
    InputError,
  );
  assert.throws(
    () =>
      emailPayload({ address: 'a@example.com', subject: '\uD800', body: '' }),
    InputError,
  );
  assert.match(
    emailPayload({
      address: 'a@example.com',
      subject: '',
      body: 'Bcc: other@example.com\ntext',
    }),
    /body=Bcc%3A%20other%40example.com%0D%0Atext$/u,
  );
});
void test('phone uses an international tel URI and a separate numeric extension', () => {
  const payload = phonePayload('+1 (202) 555-0100', '123');
  assert.equal(payload, 'tel:+12025550100;ext=123');
  assert.equal(decode(makeMatrix(payload)), payload);
  assert.equal(phonePayload('+44.20.7946.0000', ''), 'tel:+442079460000');
  for (const number of [
    '0912345678',
    '+0123',
    '+1;ext=3',
    '+1\n234',
    '+1234567890123456',
  ])
    assert.throws(() => phonePayload(number, ''));
  assert.throws(() => phonePayload('+12025550100', '1;foo=2'));
});
void test('SMS follows RFC 5724 with one percent-encoded body and no automatic sending', () => {
  const payload = smsPayload('+1 202 555 0100', 'Xin chào &\n!()*');
  assert.equal(
    payload,
    'sms:+12025550100?body=Xin%20ch%C3%A0o%20%26%0A%21%28%29%2A',
  );
  assert.equal(decode(makeMatrix(payload)), payload);
  assert.equal(smsPayload('+12025550100', ''), 'sms:+12025550100');
  assert.throws(() => smsPayload('+12025550100', '\u0000'));
});
void test('vCard includes required N and FN without guessing name structure', () => {
  const payload = contactPayload({ ...contact, given: '', family: '' });
  assert.equal(
    payload,
    'BEGIN:VCARD\r\nVERSION:3.0\r\nN:;;;;\r\nFN:Alex Taylor\r\nEND:VCARD\r\n',
  );
  assert.equal(decode(makeMatrix(payload)), payload);
});
void test('vCard escapes text and prevents line injection; Unicode folds without splitting a character', () => {
  const payload = contactPayload({
    ...contact,
    name: 'Nguyễn; An, 😀',
    phone: '+1 202 555 0100',
    email: 'a@example.com',
    organization: 'One;Two',
    website: 'https://example.com/path?x=1&y=2',
    note: 'One\nTEL:fake\\;,',
  });
  assert(payload.includes('FN:Nguyễn\\; An\\, 😀\r\n'));
  assert(payload.includes('ORG:One\\;Two\r\n'));
  assert(payload.includes('NOTE:One\\nTEL:fake\\\\\\;\\,\r\n'));
  assert.equal(decode(makeMatrix(payload)), payload);
  const long = 'NOTE:' + 'Tiếng Việt 😀 '.repeat(15);
  const folded = foldLine(long);
  assert.equal(folded.replace(/\r\n /gu, ''), long);
  for (const line of folded.split('\r\n')) assert(byteLength(line) <= 75);
  assert(!folded.includes('\uFFFD'));
});
void test('vCard keeps invalid values for field-level corrections and rejects oversized content', () => {
  assert.throws(() => contactPayload({ ...contact, name: '' }), InputError);
  assert.throws(
    () => contactPayload({ ...contact, phone: '0912345678' }),
    InputError,
  );
  assert.throws(
    () => contactPayload({ ...contact, name: 'Alex\nORG:injected' }),
    InputError,
  );
  assert.throws(
    () => contactPayload({ ...contact, note: 'x'.repeat(2100) }),
    /too long/u,
  );
});
for (const [latitude, longitude, expected] of [
  ['10,7769', '106.7009', 'geo:10.7769,106.7009'],
  ['-.5', '+.25', 'geo:-0.5,0.25'],
  ['90', '180', 'geo:90,0'],
  ['-90', '-180', 'geo:-90,0'],
  ['0', '-180', 'geo:0,-180'],
])
  void test(
    'geo coordinates ' + String(latitude) + ',' + String(longitude),
    () => {
      assert(
        latitude !== undefined &&
          longitude !== undefined &&
          expected !== undefined,
      );
      const payload = locationPayload(latitude, longitude);
      assert.equal(payload, expected);
      assert.equal(decode(makeMatrix(payload)), payload);
    },
  );
for (const [latitude, longitude] of [
  ['', '0'],
  ['91', '0'],
  ['0', '181'],
  ['NaN', '0'],
  ['1e2', '0'],
  ['1,2,3', '0'],
  ['0;u=1', '0'],
])
  void test(
    'invalid geo coordinates ' + String(latitude) + ',' + String(longitude),
    () => {
      assert(latitude !== undefined && longitude !== undefined);
      assert.throws(() => locationPayload(latitude, longitude), InputError);
    },
  );
void test('file link is validated without fetching or rewriting its payload', () => {
  const payload = httpLink(
    'https://example.com/Case%2F/image.png?x=one&y=two#file',
  );
  assert.equal(
    payload,
    'https://example.com/Case%2F/image.png?x=one&y=two#file',
  );
  assert.equal(decode(makeMatrix(payload)), payload);
  for (const link of [
    'example.com/image.png',
    'javascript:alert(1)',
    'data:image/png;base64,abc',
    'file:///secret',
    'https://a:b@example.com/image',
    'https://example.com/a b',
    'https://example.com\n',
  ])
    assert.throws(() => httpLink(link), InputError);
});
void test('calendar uses full iCalendar with UID, DTSTAMP and UTC event times', () => {
  const payload = eventPayload(
    {
      ...event,
      title: 'Meet; greet, 😀',
      location: 'Room 1',
      description: 'Line 1\nLine 2',
    },
    metadata,
  );
  assert(payload.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:'));
  assert(
    payload.includes(
      'UID:urn:uuid:' + metadata.uid + '\r\nDTSTAMP:20261001T120000Z\r\n',
    ),
  );
  assert(payload.includes('SUMMARY:Meet\\; greet\\, 😀\r\n'));
  assert(
    payload.includes('DTSTART:20261003T020000Z\r\nDTEND:20261003T030000Z\r\n'),
  );
  assert(payload.includes('DESCRIPTION:Line 1\\nLine 2\r\n'));
  assert(payload.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n'));
  assert.equal(decode(makeMatrix(payload)), payload);
});
void test('all-day end is inclusive in the form and exclusive in iCalendar, including leap/year boundaries', () => {
  for (const [start, end, exclusive] of [
    ['2026-10-03', '2026-10-03', '20261004'],
    ['2028-02-28', '2028-02-29', '20280301'],
    ['2026-12-31', '2026-12-31', '20270101'],
  ]) {
    assert(start !== undefined && end !== undefined && exclusive !== undefined);
    const payload = eventPayload(
      { ...event, allDay: true, start, end },
      metadata,
    );
    assert(
      payload.includes(
        'DTSTART;VALUE=DATE:' + start.replace(/-/gu, '') + '\r\n',
      ),
    );
    assert(payload.includes('DTEND;VALUE=DATE:' + exclusive + '\r\n'));
    assert.equal(decode(makeMatrix(payload)), payload);
  }
});
void test('calendar rejects reversed, missing and invalid dates and line injection', () => {
  for (const input of [
    { ...event, title: '' },
    { ...event, title: 'Meet\nUID:fake' },
    { ...event, end: event.start },
    { ...event, start: '2026-02-30T09:00:00.000Z' },
    { ...event, start: '0999-12-31T23:59:00.000Z' },
    { ...event, allDay: true, start: '2026-02-29', end: '2026-03-01' },
    { ...event, allDay: true, start: '2026-10-04', end: '2026-10-03' },
    { ...event, allDay: true, start: '9999-12-31', end: '9999-12-31' },
  ])
    assert.throws(() => eventPayload(input, metadata), InputError);
  assert.throws(
    () => eventPayload(event, { ...metadata, uid: '-'.repeat(36) }),
    InputError,
  );
});
void test('local datetime conversion preserves the intended local components and rejects invalid times', () => {
  const result = localDateTimeToUtc('2026-10-03T09:30', 'event-start');
  const parsed = new Date(result);
  assert.equal(parsed.getHours(), 9);
  assert.equal(parsed.getMinutes(), 30);
  assert.equal(parsed.getDate(), 3);
  for (const value of [
    '',
    '2026-02-30T09:00',
    '2026-10-03T25:00',
    '2026-10-03T09:60',
  ])
    assert.throws(() => localDateTimeToUtc(value, 'event-start'), InputError);
});

void test('oversized structured payloads report a field in their own form', () => {
  for (const [build, field] of [
    [
      () =>
        emailPayload({
          address: 'a@example.com',
          subject: '',
          body: '😀'.repeat(1000),
        }),
      'email-body',
    ],
    [() => smsPayload('+12025550100', '😀'.repeat(1000)), 'sms-message'],
    [
      () => contactPayload({ ...contact, note: 'x'.repeat(2100) }),
      'contact-note',
    ],
    [
      () => eventPayload({ ...event, description: 'x'.repeat(2100) }, metadata),
      'event-description',
    ],
    [() => httpLink('https://example.com/' + 'x'.repeat(2100)), 'file-url'],
  ] as const)
    assert.throws(
      build,
      (error) =>
        error instanceof InputError &&
        error.field === field &&
        error.message.includes('too long'),
    );
});
