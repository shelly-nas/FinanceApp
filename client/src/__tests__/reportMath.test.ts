import { test, describe, assert } from 'vitest';
import {
  movingAverage, trendSlope, summariseCategories, buildCashflow, buildCategoryRows,
} from '@/scenes/reports/reportMath';

const point = (month: string, category: string, total: number, color = '#000000') => ({
  month, category, color, income_outcome: 'Uitgaven', total: String(total),
});

describe('movingAverage', () => {
  test('averages the trailing window', () => {
    assert.deepEqual(movingAverage([3, 6, 9, 12], 3), [null, null, 6, 9]);
  });

  test('leaves the line out until a full window exists', () => {
    // A two-month "average" labelled as three months would be a different
    // statistic under the same name.
    assert.deepEqual(movingAverage([10, 20], 3), [null, null]);
  });
});

describe('trendSlope', () => {
  test('gives the change per month of the best-fit line', () => {
    assert.equal(trendSlope([100, 110, 120, 130]), 10);
  });

  test('is null with fewer than two points', () => {
    assert.equal(trendSlope([100]), null);
  });
});

describe('summariseCategories', () => {
  const points = [
    point('2026-06', 'Boodschappen', 400),
    point('2026-07', 'Boodschappen', 500),
    point('2026-08', 'Boodschappen', 600),
    point('2026-08', 'Vakanties', 900),
  ];

  test('ranks categories by total, largest first', () => {
    assert.deepEqual(summariseCategories(points).map((c) => c.category), ['Boodschappen', 'Vakanties']);
  });

  test('counts a month with data but no spending in the category as zero', () => {
    const vakanties = summariseCategories(points).find((c) => c.category === 'Vakanties')!;
    assert.deepEqual(vakanties.series.map((p) => p.value), [0, 0, 900]);
    assert.equal(vakanties.average, 300);
    assert.equal(vakanties.min, 0);
    assert.equal(vakanties.max, 900);
  });

  test('reports the trend per month', () => {
    const boodschappen = summariseCategories(points).find((c) => c.category === 'Boodschappen')!;
    assert.equal(boodschappen.slope, 100);
    assert.equal(boodschappen.total, 1500);
  });

  test('is empty without data', () => {
    assert.deepEqual(summariseCategories([]), []);
  });
});

describe('buildCategoryRows', () => {
  test('contains only months that have data - no zero-filled gaps', () => {
    const { rows } = buildCategoryRows([
      point('2026-01', 'Boodschappen', 100),
      point('2026-04', 'Boodschappen', 200),
    ]);
    assert.deepEqual(rows.map((r) => r.month), ['2026-01', '2026-04']);
  });

  test('folds categories beyond the cap into Other', () => {
    const many = Array.from({ length: 10 }, (_, i) => point('2026-08', `C${i}`, 100 - i));
    const { series, labels } = buildCategoryRows(many, 8);
    assert.equal(series.length, 9);
    assert.equal(labels[series[8]], 'Other');
  });

  test('adds a three-month trend of the monthly total', () => {
    const { rows } = buildCategoryRows([
      point('2026-06', 'A', 300),
      point('2026-07', 'A', 600),
      point('2026-08', 'A', 300),
      point('2026-08', 'B', 600),
    ]);
    assert.deepEqual(rows.map((r) => r.trend), [null, null, 600]);
  });
});

describe('buildCashflow', () => {
  test('derives net and savings rate per month', () => {
    const [month] = buildCashflow([{ month: '2026-08', income: '4000', expenses: '3000' }]);
    assert.equal(month.net, 1000);
    assert.equal(month.savingsRate, 25);
  });

  test('has no savings rate in a month without income', () => {
    const [month] = buildCashflow([{ month: '2026-08', income: '0', expenses: '300' }]);
    assert.equal(month.savingsRate, null);
  });
});
