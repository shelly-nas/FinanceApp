import { test, describe, assert } from 'vitest';
import {
  defaultFilter, periodMonths, monthCount, periodDates, trendMonths, stepPeriod, describePeriod,
  readFilter, writeFilter, hasFilterParams, filterKey, parseStoredAccounts, InsightsFilter,
} from '@/scenes/insights/filter';

const NOW = new Date(2026, 10, 23); // 23 November 2026
const f = (over: Partial<InsightsFilter>): InsightsFilter => ({ ...defaultFilter(NOW), ...over });

describe('defaultFilter', () => {
  test('starts at the current month, every account and category', () => {
    assert.deepEqual(defaultFilter(NOW), { preset: 'month', to: '2026-11', accounts: [], categories: [] });
  });
});

describe('periodMonths', () => {
  test('counts back from the last month for the presets', () => {
    assert.deepEqual(periodMonths(f({ preset: 'month', to: '2026-10' })), { from: '2026-10', to: '2026-10' });
    assert.deepEqual(periodMonths(f({ preset: '3m', to: '2026-10' })), { from: '2026-08', to: '2026-10' });
    assert.deepEqual(periodMonths(f({ preset: '12m', to: '2026-10' })), { from: '2025-11', to: '2026-10' });
  });

  test('runs a year from January', () => {
    assert.deepEqual(periodMonths(f({ preset: 'year', to: '2026-10' })), { from: '2026-01', to: '2026-10' });
  });

  test('reads a reversed custom range the right way round', () => {
    assert.deepEqual(periodMonths(f({ preset: 'custom', from: '2026-10', to: '2026-05' })), { from: '2026-05', to: '2026-10' });
  });
});

describe('periodDates', () => {
  test('runs from the first day of the first month to the last day of the last', () => {
    const { startDate, endDate } = periodDates({ from: '2026-01', to: '2026-02' });
    assert.deepEqual([startDate, endDate], ['2026-01-01', '2026-02-28']);
  });
});

describe('trendMonths', () => {
  test('widens a single month to the twelve months up to it', () => {
    assert.deepEqual(trendMonths(f({ preset: 'month', to: '2026-10' })), { from: '2025-11', to: '2026-10', widened: true });
  });

  test('keeps a longer period as it is', () => {
    assert.deepEqual(trendMonths(f({ preset: '6m', to: '2026-10' })), { from: '2026-05', to: '2026-10', widened: false });
  });
});

describe('stepPeriod', () => {
  test('steps by the length of the period, so months never overlap', () => {
    assert.equal(stepPeriod(f({ preset: 'month', to: '2026-03' }), -1, NOW).to, '2026-02');
    assert.equal(stepPeriod(f({ preset: '3m', to: '2026-10' }), -1, NOW).to, '2026-07');
    assert.equal(stepPeriod(f({ preset: '12m', to: '2026-10' }), 1, NOW).to, '2027-10');
  });

  test('moves both ends of a custom period', () => {
    const stepped = stepPeriod(f({ preset: 'custom', from: '2026-05', to: '2026-10' }), -1, NOW);
    assert.deepEqual([stepped.from, stepped.to], ['2025-11', '2026-04']);
  });

  test('steps a year to the whole previous year, and back to this one up to now', () => {
    const back = stepPeriod(f({ preset: 'year', to: '2026-11' }), -1, NOW);
    assert.equal(back.to, '2025-12');
    assert.equal(stepPeriod(back, 1, NOW).to, '2026-11');
  });

  test('crosses a year boundary', () => {
    assert.equal(stepPeriod(f({ preset: 'month', to: '2026-01' }), -1, NOW).to, '2025-12');
  });
});

describe('monthCount and describePeriod', () => {
  test('count both ends', () => {
    assert.equal(monthCount({ from: '2025-11', to: '2026-10' }), 12);
  });

  test('name the period the way the subtitle reads', () => {
    assert.equal(describePeriod({ from: '2026-10', to: '2026-10' }), 'October 2026');
    assert.equal(describePeriod({ from: '2026-08', to: '2026-10' }), 'Aug – Oct 2026');
    assert.equal(describePeriod({ from: '2025-11', to: '2026-10' }), 'Nov 2025 – Oct 2026');
  });
});

describe('URL round trip', () => {
  test('writes and reads back the same filter, with commas in category names', () => {
    const filter = f({
      preset: 'custom', from: '2026-05', to: '2026-10',
      accounts: ['NL01', 'NL02'], categories: ['Kleding, Shoppen, Elektronica', 'Boodschappen'],
    });
    const params = writeFilter(new URLSearchParams(), filter);
    assert.deepEqual(readFilter(params, defaultFilter(NOW)), filter);
  });

  test('leaves parameters it does not own alone', () => {
    const params = writeFilter(new URLSearchParams('import=transactions&month=2026-01'), f({}));
    assert.equal(params.get('import'), 'transactions');
    assert.isFalse(params.has('month'));
  });

  test('falls back to the default for what is missing or malformed', () => {
    const fallback = defaultFilter(NOW, ['NL01']);
    assert.deepEqual(readFilter(new URLSearchParams('period=bogus&to=2026-13'), fallback), fallback);
  });

  test('still opens a month from the old dashboard link', () => {
    const read = readFilter(new URLSearchParams('month=2026-03'), defaultFilter(NOW));
    assert.deepEqual([read.preset, read.to], ['month', '2026-03']);
    assert.isTrue(hasFilterParams(new URLSearchParams('month=2026-03')));
    assert.isFalse(hasFilterParams(new URLSearchParams('import=transactions')));
  });

  test('gives two equal filters the same key', () => {
    assert.equal(filterKey(f({ accounts: ['a'] })), filterKey(f({ accounts: ['a'] })));
    assert.notEqual(filterKey(f({ accounts: ['a'] })), filterKey(f({ accounts: ['b'] })));
  });
});

describe('parseStoredAccounts', () => {
  test('reads a stored list and rejects anything else', () => {
    assert.deepEqual(parseStoredAccounts('["NL01","NL02"]'), ['NL01', 'NL02']);
    assert.deepEqual(parseStoredAccounts('nope'), []);
    assert.deepEqual(parseStoredAccounts('[1]'), []);
    assert.deepEqual(parseStoredAccounts(null), []);
  });
});
