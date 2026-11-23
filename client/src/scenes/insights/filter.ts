import { formatDate, monthBounds, parseMonthKey, shiftMonth, toMonthKey } from '@/utils/monthRange';

/**
 * The one filter behind Overview and Trends: a period, a set of accounts and
 * a set of categories. Plain functions, so the period arithmetic and the URL
 * round trip are tested without rendering anything.
 *
 * See docs/ontwerp/navigatie-en-filters.md.
 */

export const PRESETS = ['month', '3m', '6m', '12m', 'year', 'custom'] as const;
export type Preset = (typeof PRESETS)[number];

export interface InsightsFilter {
  preset: Preset;
  /** Last month of the period, 'YYYY-MM'. */
  to: string;
  /** First month, 'YYYY-MM'; only read for a custom period. */
  from?: string;
  /** Account identifiers; empty means every account. */
  accounts: string[];
  /** Category names; empty means every category. */
  categories: string[];
}

const PRESET_MONTHS: Partial<Record<Preset, number>> = { month: 1, '3m': 3, '6m': 6, '12m': 12 };

export const defaultFilter = (now: Date = new Date(), accounts: string[] = []): InsightsFilter => ({
  preset: 'month',
  to: toMonthKey(now),
  accounts,
  categories: [],
});

/** First and last month of the period, as 'YYYY-MM'. */
export const periodMonths = (filter: InsightsFilter): { from: string; to: string } => {
  const to = parseMonthKey(filter.to);
  if (filter.preset === 'custom') {
    const from = parseMonthKey(filter.from ?? filter.to);
    // A reversed custom range is read the right way round rather than empty.
    return from <= to
      ? { from: toMonthKey(from), to: toMonthKey(to) }
      : { from: toMonthKey(to), to: toMonthKey(from) };
  }
  if (filter.preset === 'year') {
    return { from: `${to.getFullYear()}-01`, to: toMonthKey(to) };
  }
  return { from: toMonthKey(shiftMonth(to, -((PRESET_MONTHS[filter.preset] ?? 1) - 1))), to: toMonthKey(to) };
};

/** Number of months a 'YYYY-MM' range spans, both ends included. */
export const monthCount = ({ from, to }: { from: string; to: string }) => {
  const a = parseMonthKey(from);
  const b = parseMonthKey(to);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
};

/** The period as dates, for the API: first day of the first month to last day of the last. */
export const periodDates = (range: { from: string; to: string }) => {
  const { firstDay } = monthBounds(parseMonthKey(range.from));
  const { lastDay } = monthBounds(parseMonthKey(range.to));
  return { firstDay, lastDay, startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
};

/**
 * The months Trends shows. A single month has nothing to show per month, so
 * Trends takes the twelve months up to and including it instead - switching
 * from Overview never lands on an empty page.
 */
export const trendMonths = (filter: InsightsFilter): { from: string; to: string; widened: boolean } => {
  const range = periodMonths(filter);
  if (monthCount(range) > 1) return { ...range, widened: false };
  return { from: toMonthKey(shiftMonth(parseMonthKey(range.to), -11)), to: range.to, widened: true };
};

/**
 * The period one step back (-1) or forward (+1): by its own length, so the
 * months shown never overlap. A calendar year steps to the previous or next
 * calendar year.
 */
export const stepPeriod = (filter: InsightsFilter, direction: 1 | -1, now: Date = new Date()): InsightsFilter => {
  if (filter.preset === 'year') {
    const year = parseMonthKey(filter.to).getFullYear() + direction;
    const to = year === now.getFullYear() ? toMonthKey(now) : `${year}-12`;
    return { ...filter, to };
  }
  const range = periodMonths(filter);
  const length = monthCount(range);
  const shift = (key: string) => toMonthKey(shiftMonth(parseMonthKey(key), length * direction));
  return filter.preset === 'custom'
    ? { ...filter, from: shift(range.from), to: shift(range.to) }
    : { ...filter, to: shift(range.to) };
};

/** "October 2026", "Aug – Oct 2026", "Nov 2025 – Oct 2026". */
export const describePeriod = (range: { from: string; to: string }) => {
  const a = parseMonthKey(range.from);
  const b = parseMonthKey(range.to);
  if (range.from === range.to) {
    return b.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });
  return a.getFullYear() === b.getFullYear()
    ? `${month(a)} – ${month(b)} ${b.getFullYear()}`
    : `${month(a)} ${a.getFullYear()} – ${month(b)} ${b.getFullYear()}`;
};

// --- URL --------------------------------------------------------------------

/** The query parameters the filter owns; every other parameter is left alone. */
export const FILTER_PARAMS = ['period', 'to', 'from', 'account', 'category'] as const;

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Whether a query string carries a filter at all, as opposed to none yet. */
export const hasFilterParams = (params: URLSearchParams) =>
  FILTER_PARAMS.some((key) => params.has(key)) || params.has('month');

/**
 * The filter a query string describes. Repeated parameters carry the lists
 * (`account=…&account=…`): category names contain commas. Anything missing or
 * malformed falls back to the default. `?month=YYYY-MM`, the dashboard's old
 * parameter, still opens that month.
 */
export const readFilter = (params: URLSearchParams, fallback: InsightsFilter): InsightsFilter => {
  const preset = PRESETS.find((p) => p === params.get('period'));
  const legacyMonth = params.get('month');
  const to = params.get('to') ?? legacyMonth;
  const from = params.get('from');
  return {
    preset: preset ?? (legacyMonth ? 'month' : fallback.preset),
    to: to && MONTH_KEY.test(to) ? to : fallback.to,
    ...(preset === 'custom' && from && MONTH_KEY.test(from) ? { from } : {}),
    accounts: params.has('account') ? params.getAll('account') : fallback.accounts,
    categories: params.has('category') ? params.getAll('category') : fallback.categories,
  };
};

/** A copy of `params` with the filter written into it. */
export const writeFilter = (params: URLSearchParams, filter: InsightsFilter): URLSearchParams => {
  const next = new URLSearchParams(params);
  [...FILTER_PARAMS, 'month'].forEach((key) => next.delete(key));
  next.set('period', filter.preset);
  next.set('to', filter.to);
  if (filter.preset === 'custom' && filter.from) next.set('from', filter.from);
  filter.accounts.forEach((a) => next.append('account', a));
  filter.categories.forEach((c) => next.append('category', c));
  return next;
};

/** The filter part of a query string, normalised, for comparing two filters. */
export const filterKey = (filter: InsightsFilter) => writeFilter(new URLSearchParams(), filter).toString();

// --- Remembered accounts -------------------------------------------------------

/** Where the selected accounts are remembered between visits. */
export const ACCOUNTS_STORAGE_KEY = 'insights.accounts';
/** The dashboard's key before 2.0, read once so a selection survives the upgrade. */
export const LEGACY_ACCOUNTS_STORAGE_KEY = 'dashboard.accounts';

/** A stored list of account identifiers, or none when the value is anything else. */
export const parseStoredAccounts = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((v) => typeof v === 'string') ? parsed : [];
  } catch {
    return [];
  }
};
