import type { CashflowPoint, CategoryHistoryPoint } from '@/api';

/**
 * The arithmetic behind the report charts, kept out of the components so it can
 * be tested without rendering anything.
 *
 * One rule runs through all of it: a month without data is absent, not zero.
 * The server only returns months that had transactions, and nothing here
 * invents the others - a zero would read as "spent nothing", which is a claim
 * the data does not make.
 */

/** Trailing average over `window` points; null until a full window exists. */
export const movingAverage = (values: number[], window = 3): (number | null)[] =>
  values.map((_, index) => {
    if (index < window - 1) return null;
    const slice = values.slice(index - window + 1, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / window;
  });

/** Slope of the least-squares line through the values: change per step. */
export const trendSlope = (values: number[]): number | null => {
  const n = values.length;
  if (n < 2) return null;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, x) => {
    numerator += (x - meanX) * (value - meanY);
    denominator += (x - meanX) ** 2;
  });
  return numerator / denominator;
};

/** The months that have any data, in order. */
const monthsWithData = (points: CategoryHistoryPoint[]) =>
  [...new Set(points.map((p) => p.month))].sort();

export interface CategoryStats {
  category: string;
  color: string | null;
  total: number;
  average: number;
  min: number;
  max: number;
  /** Change per month of the best-fit line, or null with a single month. */
  slope: number | null;
  series: { month: string; value: number }[];
}

/**
 * Per-category figures over the months that have data. Within such a month, a
 * category without spending is a genuine zero - the month was imported, the
 * category just did not occur.
 */
export function summariseCategories(points: CategoryHistoryPoint[]): CategoryStats[] {
  const months = monthsWithData(points);
  const byCategory = new Map<string, { color: string | null; values: Map<string, number> }>();

  for (const point of points) {
    const entry = byCategory.get(point.category) ?? { color: point.color, values: new Map() };
    entry.values.set(point.month, (entry.values.get(point.month) ?? 0) + Number(point.total));
    byCategory.set(point.category, entry);
  }

  return [...byCategory.entries()]
    .map(([category, { color, values }]) => {
      const series = months.map((month) => ({ month, value: values.get(month) ?? 0 }));
      const numbers = series.map((p) => p.value);
      const total = numbers.reduce((sum, value) => sum + value, 0);
      return {
        category,
        color,
        total,
        average: total / months.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        slope: trendSlope(numbers),
        series,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export const OTHER = 'Other';
export const OTHER_COLOR = '#8f929b';

export interface CategoryRows {
  rows: Record<string, number | string | null>[];
  series: string[];
  colors: Record<string, string>;
  labels: Record<string, string>;
}

/**
 * Rows for the stacked bar chart: one per month with data, a key per series and
 * a `trend` holding the three-month average of the month's total.
 *
 * Past `maxSeries`, categories fold into "Other" rather than get a new colour.
 * Series keys are index-based because Recharts reads a dataKey as a path, and a
 * name like "Kleding, Shoppen, Elektronica" would resolve to nothing.
 */
export function buildCategoryRows(points: CategoryHistoryPoint[], maxSeries = 8): CategoryRows {
  const stats = summariseCategories(points);
  if (stats.length === 0) return { rows: [], series: [], colors: {}, labels: {} };

  const kept = stats.slice(0, maxSeries);
  const folded = stats.slice(maxSeries);
  const names = folded.length > 0 ? [...kept.map((s) => s.category), OTHER] : kept.map((s) => s.category);
  const keyByName = new Map(names.map((name, index) => [name, `s${index}`]));

  const labels: Record<string, string> = {};
  const colors: Record<string, string> = {};
  for (const name of names) {
    const key = keyByName.get(name)!;
    labels[key] = name;
    colors[key] = stats.find((s) => s.category === name)?.color ?? OTHER_COLOR;
  }

  const foldedNames = new Set(folded.map((s) => s.category));
  const months = monthsWithData(points);
  const rows = months.map((month) => {
    const row: Record<string, number | string | null> = { month };
    for (const key of keyByName.values()) row[key] = 0;
    for (const point of points) {
      if (point.month !== month) continue;
      const key = keyByName.get(foldedNames.has(point.category) ? OTHER : point.category)!;
      row[key] = Number(row[key]) + Number(point.total);
    }
    return row;
  });

  const totals = rows.map((row) => [...keyByName.values()].reduce((sum, key) => sum + Number(row[key]), 0));
  const trend = movingAverage(totals);
  rows.forEach((row, index) => { row.trend = trend[index]; });

  return { rows, series: [...keyByName.values()], colors, labels };
}

export interface CashflowRow {
  month: string;
  income: number;
  expenses: number;
  net: number;
  /** Share of income kept, in percent; null in a month without income. */
  savingsRate: number | null;
}

export const buildCashflow = (points: CashflowPoint[]): CashflowRow[] =>
  points.map((point) => {
    const income = Number(point.income);
    const expenses = Number(point.expenses);
    const net = income - expenses;
    return {
      month: point.month,
      income,
      expenses,
      net,
      savingsRate: income > 0 ? (net / income) * 100 : null,
    };
  });

export type Tone = 'positive' | 'negative';

/**
 * Green or red for a change. Where more is better (net worth, savings) a rise
 * is positive; for spending it is the other way round, so a growing expense is
 * not shown in the colour of good news. Zero and missing values stay neutral.
 */
export const toneFor = (
  value: number | null,
  { higherIsBetter = true }: { higherIsBetter?: boolean } = {},
): Tone | undefined => {
  if (value === null || value === 0 || Number.isNaN(value)) return undefined;
  return (value > 0) === higherIsBetter ? 'positive' : 'negative';
};

export type Side = 'expenses' | 'income';

/**
 * Which side the category chart starts on: income when every selected
 * category is an income category, spending otherwise. Nothing selected means
 * every category, and spending is what most questions are about.
 */
export const defaultSide = (
  selected: string[],
  categories: { category_name: string; income_outcome: string | null }[],
): Side => {
  if (selected.length === 0) return 'expenses';
  const isIncome = (name: string) =>
    categories.find((c) => c.category_name === name)?.income_outcome === 'Inkomsten';
  return selected.every(isIncome) ? 'income' : 'expenses';
};
