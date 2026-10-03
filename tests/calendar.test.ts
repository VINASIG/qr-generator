import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  dateValue,
  daysInMonth,
  monthGrid,
  moveDays,
  moveMonths,
  parseDate,
  utcDate,
} from '../src/lib/calendar.ts';

await test('calendar accepts real ISO dates, including leap years and early years', () => {
  for (const value of [
    '0001-01-01',
    '1900-02-28',
    '2000-02-29',
    '2024-02-29',
    '9999-12-31',
  ]) {
    const date = parseDate(value);
    assert(date);
    assert.equal(dateValue(date), value);
    assert.equal(utcDate(date).toISOString().slice(0, 10), value);
  }
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2000, 2), 29);
});
await test('calendar rejects impossible or non-ISO manual dates', () => {
  for (const value of [
    '',
    '0000-01-01',
    '10000-01-01',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-01-32',
    '2026-04-31',
    '1900-02-29',
    '2026-02-29',
    '2026-1-1',
    '03/10/2026',
    '2026-10-03 ',
  ])
    assert.equal(parseDate(value), null, value);
});
await test('calendar day navigation crosses months and years without timezone shifts', () => {
  assert.deepEqual(moveDays({ year: 2024, month: 2, day: 28 }, 1), {
    year: 2024,
    month: 2,
    day: 29,
  });
  assert.deepEqual(moveDays({ year: 2026, month: 12, day: 31 }, 1), {
    year: 2027,
    month: 1,
    day: 1,
  });
  assert.deepEqual(moveDays({ year: 2026, month: 3, day: 1 }, -1), {
    year: 2026,
    month: 2,
    day: 28,
  });
  assert.equal(moveDays({ year: 1, month: 1, day: 1 }, -1), null);
  assert.equal(moveDays({ year: 9999, month: 12, day: 31 }, 1), null);
});
await test('calendar month navigation clamps month ends and preserves supported years', () => {
  assert.deepEqual(moveMonths({ year: 2024, month: 1, day: 31 }, 1), {
    year: 2024,
    month: 2,
    day: 29,
  });
  assert.deepEqual(moveMonths({ year: 2026, month: 1, day: 31 }, 1), {
    year: 2026,
    month: 2,
    day: 28,
  });
  assert.deepEqual(moveMonths({ year: 2026, month: 12, day: 31 }, 1), {
    year: 2027,
    month: 1,
    day: 31,
  });
  assert.equal(moveMonths({ year: 1, month: 1, day: 1 }, -1), null);
  assert.equal(moveMonths({ year: 9999, month: 12, day: 31 }, 1), null);
});
await test('calendar grids have six Sunday-first weeks and handle extreme supported years', () => {
  const grid = monthGrid({ year: 2026, month: 10, day: 3 });
  assert.equal(grid.length, 42);
  assert.deepEqual(grid[0], { year: 2026, month: 9, day: 27 });
  assert.deepEqual(grid[41], { year: 2026, month: 11, day: 7 });
  assert(grid[0]);
  assert.equal(utcDate(grid[0]).getUTCDay(), 0);
  assert.equal(monthGrid({ year: 1, month: 1, day: 1 })[0], null);
  assert(
    monthGrid({ year: 9999, month: 12, day: 31 }).some((date) => date === null),
  );
});
