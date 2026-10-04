interface ContentFixture {
  kind: string;
  first: string;
  values: Record<string, string>;
  expected: string;
  more?: string;
}
export const contentFixtures: ContentFixture[] = [
  {
    kind: 'email',
    first: 'email-to',
    values: {
      'email-to': 'hello+qr@example.com',
      'email-subject': 'Tiếng Việt & Q?',
      'email-body': 'Line 1\nLine 2',
    },
    expected:
      'mailto:hello%2Bqr@example.com?subject=Ti%E1%BA%BFng%20Vi%E1%BB%87t%20%26%20Q%3F&body=Line%201%0D%0ALine%202',
  },
  {
    kind: 'phone',
    first: 'phone-number',
    values: { 'phone-number': '+1 (202) 555-0100', 'phone-extension': '123' },
    expected: 'tel:+12025550100;ext=123',
  },
  {
    kind: 'sms',
    first: 'sms-number',
    values: {
      'sms-number': '+1 202 555 0100',
      'sms-message': 'Xin chào &\n!()*',
    },
    expected: 'sms:+12025550100?body=Xin%20ch%C3%A0o%20%26%0A%21%28%29%2A',
  },
  {
    kind: 'contact',
    first: 'contact-name',
    more: 'More contact details',
    values: {
      'contact-name': 'Nguyễn; An, 😀',
      'contact-given': 'An',
      'contact-family': 'Nguyễn',
      'contact-phone': '+1 202 555 0100',
      'contact-email': 'a@example.com',
      'contact-organization': 'One;Two',
      'contact-website': 'https://example.com/path?x=1&y=2',
      'contact-note': 'Line 1\nLine 2',
    },
    expected:
      'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Nguyễn;An;;;\r\nFN:Nguyễn\\; An\\, 😀\r\nTEL;TYPE=CELL:+12025550100\r\nEMAIL;TYPE=INTERNET:a@example.com\r\nORG:One\\;Two\r\nURL:https://example.com/path?x=1&y=2\r\nNOTE:Line 1\\nLine 2\r\nEND:VCARD\r\n',
  },
  {
    kind: 'location',
    first: 'latitude',
    values: { latitude: '10,7769', longitude: '106.7009' },
    expected: 'geo:10.7769,106.7009',
  },
  {
    kind: 'event',
    first: 'event-title',
    more: 'More event details',
    values: {
      'event-title': 'Meet; greet, 😀',
      'event-start': '2026-10-03',
      'event-start-time': '09:00',
      'event-end': '2026-10-03',
      'event-end-time': '10:00',
      'event-location': 'Room 1',
      'event-description': 'Line 1\nLine 2',
    },
    expected:
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//QR Generator//Static Event//EN\r\nBEGIN:VEVENT\r\nUID:urn:uuid:IDENTIFIER\r\nDTSTAMP:TIMESTAMP\r\nSUMMARY:Meet\\; greet\\, 😀\r\nDTSTART:20261003T020000Z\r\nDTEND:20261003T030000Z\r\nLOCATION:Room 1\r\nDESCRIPTION:Line 1\\nLine 2\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n',
  },
  {
    kind: 'file',
    first: 'file-url',
    values: {
      'file-url': 'https://example.com/Case%2F/image.png?x=one&y=two#file',
    },
    expected: 'https://example.com/Case%2F/image.png?x=one&y=two#file',
  },
];
