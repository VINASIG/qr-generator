export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2)
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return year >= 1 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
    ? { year, month, day }
    : null;
}

export function dateValue(date: CalendarDate): string {
  return [
    date.year.toString().padStart(4, '0'),
    date.month.toString().padStart(2, '0'),
    date.day.toString().padStart(2, '0'),
  ].join('-');
}

export function utcDate(date: CalendarDate): Date {
  const result = new Date(0);
  result.setUTCFullYear(date.year, date.month - 1, date.day);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export function moveDays(
  date: CalendarDate,
  offset: number,
): CalendarDate | null {
  const result = utcDate(date);
  result.setUTCDate(result.getUTCDate() + offset);
  const year = result.getUTCFullYear();
  if (year < 1 || year > 9999) return null;
  return { year, month: result.getUTCMonth() + 1, day: result.getUTCDate() };
}

export function moveMonths(
  date: CalendarDate,
  offset: number,
): CalendarDate | null {
  const index = (date.year - 1) * 12 + date.month - 1 + offset;
  if (index < 0 || index >= 9999 * 12) return null;
  const year = Math.floor(index / 12) + 1;
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function monthGrid(date: CalendarDate): (CalendarDate | null)[] {
  const first = { ...date, day: 1 };
  const weekday = utcDate(first).getUTCDay();
  return Array.from({ length: 42 }, (_, index) =>
    moveDays(first, index - weekday),
  );
}
