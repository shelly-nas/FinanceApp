import { test, describe, assert } from 'vitest';
import { toMonthKey, parseMonthKey, shiftMonth, monthBounds, formatDate } from '@/utils/monthRange';

describe('shiftMonth', () => {
  test('steps back a month', () => {
    assert.equal(toMonthKey(shiftMonth(new Date(2026, 7, 1), -1)), '2026-07');
  });

  test('steps forward a month', () => {
    assert.equal(toMonthKey(shiftMonth(new Date(2026, 7, 1), 1)), '2026-09');
  });

  test('crosses a year boundary in both directions', () => {
    assert.equal(toMonthKey(shiftMonth(new Date(2026, 0, 1), -1)), '2025-12');
    assert.equal(toMonthKey(shiftMonth(new Date(2026, 11, 1), 1)), '2027-01');
  });

  test('does not skip February when stepping back from a 31-day month', () => {
    // The bug this replaces: setMonth() on 31 March gives 3 March, because
    // 31 February does not exist and rolls forward. February disappeared from
    // the navigation entirely.
    const march = new Date(2026, 2, 31);
    assert.equal(toMonthKey(shiftMonth(march, -1)), '2026-02');
  });

  test('handles a leap February', () => {
    const { lastDay } = monthBounds(shiftMonth(new Date(2024, 2, 1), -1));
    assert.equal(formatDate(lastDay), '2024-02-29');
  });

  test('never mutates the anchor it is given', () => {
    const anchor = new Date(2026, 7, 1);
    const before = anchor.getTime();
    shiftMonth(anchor, -6);
    assert.equal(anchor.getTime(), before);
  });
});

describe('monthBounds', () => {
  test('spans the whole month', () => {
    const { firstDay, lastDay } = monthBounds(new Date(2026, 7, 15));
    assert.equal(formatDate(firstDay), '2026-08-01');
    assert.equal(formatDate(lastDay), '2026-08-31');
  });

  test('ends on the 30th for a 30-day month', () => {
    assert.equal(formatDate(monthBounds(new Date(2026, 3, 1)).lastDay), '2026-04-30');
  });

  test('ends on the 28th for a non-leap February', () => {
    assert.equal(formatDate(monthBounds(new Date(2026, 1, 1)).lastDay), '2026-02-28');
  });

  test('covers December without spilling into the next year', () => {
    const { firstDay, lastDay } = monthBounds(new Date(2026, 11, 9));
    assert.equal(formatDate(firstDay), '2026-12-01');
    assert.equal(formatDate(lastDay), '2026-12-31');
  });
});

describe('parseMonthKey', () => {
  test('reads a valid key as the first of that month', () => {
    assert.equal(formatDate(parseMonthKey('2026-08')), '2026-08-01');
  });

  test('defaults to the previous month when absent', () => {
    const now = new Date(2026, 7, 15);
    assert.equal(toMonthKey(parseMonthKey(null, now)), '2026-07');
  });

  test('defaults across a year boundary', () => {
    const now = new Date(2026, 0, 9);
    assert.equal(toMonthKey(parseMonthKey(null, now)), '2025-12');
  });

  test('rejects a malformed or out-of-range key instead of producing a stray date', () => {
    const now = new Date(2026, 7, 15);
    for (const bad of ['2026-13', '2026-00', 'August', '2026-8', '', 'x']) {
      assert.equal(toMonthKey(parseMonthKey(bad, now)), '2026-07', `should reject ${JSON.stringify(bad)}`);
    }
  });
});

describe('formatDate', () => {
  test('pads month and day to two digits', () => {
    assert.equal(formatDate(new Date(2026, 0, 5)), '2026-01-05');
  });

  test('uses local date parts, so a late-evening date keeps its day', () => {
    // Formatting via toISOString() would shift this to the next day in any
    // timezone east of UTC, filing the transaction in the wrong month at a
    // month boundary.
    assert.equal(formatDate(new Date(2026, 7, 31, 23, 30)), '2026-08-31');
  });
});
