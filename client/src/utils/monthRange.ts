/**
 * Month arithmetic for the dashboard's period selector.
 *
 * Kept as plain functions rather than inside the context so the edge cases can
 * be tested: month stepping used to mutate a Date with setMonth(), which turns
 * "one month before 31 March" into 3 March - skipping February entirely.
 */

/** 'YYYY-MM' for the month a date falls in. */
export const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * The anchor date for a month key, always the first of that month.
 *
 * Day 1 is what keeps the arithmetic honest: stepping from a 29th, 30th or 31st
 * overflows into the next month whenever the target month is shorter.
 * Falls back to the previous month when the key is missing or malformed - a
 * bank export of the month just closed is what there is to review.
 */
export const parseMonthKey = (value: string | null, now: Date = new Date()): Date => {
  if (value) {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }
  }

  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

/** The anchor `delta` months away, as a new Date. Never mutates its input. */
export const shiftMonth = (anchor: Date, delta: number): Date =>
  new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);

/** First and last day of the month the anchor falls in. */
export const monthBounds = (anchor: Date): { firstDay: Date; lastDay: Date } => ({
  firstDay: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  // Day 0 of the next month is the last day of this one, for any month length.
  lastDay: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
});

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
