/**
 * Chart palette and formatters.
 *
 * The three account-type colours were validated with the dataviz palette checker
 * against both the light and the dark chart surface: lightness band, chroma
 * floor, colour-blind separation of every adjacent pair, and 3:1 contrast against
 * the surface all pass in both modes. One set serves both, so a viewer switching
 * theme sees the same series in the same colour.
 *
 * Category colours are not chosen here - they come from the categories table, so
 * a category keeps the same colour in the breakdown, the trend chart and the
 * legend. That is the whole point of storing them.
 */
export const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  'Checking Account': '#0b8f78',
  'Savings Account': '#b8791f',
  Investments: '#4169c9',
};

/** Ordered most liquid first, which is also the stacking order. */
export const ACCOUNT_TYPE_ORDER = ['Checking Account', 'Savings Account', 'Investments'] as const;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  'Checking Account': 'Checking',
  'Savings Account': 'Savings',
  Investments: 'Investments',
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

/** Compact form for axis ticks, where the full figure would collide. */
export const formatCompact = (value: number) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

/** 'YYYY-MM' as 'Aug 2026'. */
export const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  return new Date(Number(year), Number(m) - 1, 1)
    .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

/** 'YYYY-MM' as 'Aug', for a dense axis where the year is in the title. */
export const formatMonthShort = (month: string) => {
  const [year, m] = month.split('-');
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
};

/** Every month from start to end inclusive, so gaps can be filled. */
export const monthsBetween = (start: string, end: string): string[] => {
  const months: string[] = [];
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);

  let cursor = new Date(startYear, startMonth - 1, 1);
  const last = new Date(endYear, endMonth - 1, 1);

  while (cursor <= last) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months;
};
