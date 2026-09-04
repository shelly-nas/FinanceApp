import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import dbContext from '@/context/dbContext';
import { runMigrations } from '@/context/migrations';
import FinanceManager from '@/managers/financeManager';
import '@/__tests__/teardown';

// The debit/credit sign logic lives in SQL, in three queries that each restate
// it. A mistake there does not throw - it produces a total that is merely wrong,
// which is the failure mode these tests exist to catch.
//
// Requires a database. Set DB_HOST/DB_PORT/... to point at a throwaway one; CI
// provides a postgres service. Skipped rather than failed when absent, so the
// unit tests remain runnable on their own.
const hasDatabase = Boolean(process.env.DB_HOST && process.env.DB_NAME);

const CHECKING = 'NL00SUMM0000000001';
const SAVINGS = 'NL00SUMM0000000002';

const row = (overrides: Partial<any> = {}) => ({
  date_str: '2026-08-15',
  name_description: 'Test row',
  account: CHECKING,
  counterparty: null,
  category: 'Boodschappen',
  debit_credit: 'Debit',
  amount: 100,
  notifications: null,
  ...overrides,
});

describe('summary queries', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await runMigrations();
    const client = await dbContext.connect();
    try {
      // Only this file's own accounts: anything else - left by manual testing or
      // by an earlier run - would shift every balance assertion.
      await client.query('DELETE FROM public.investments');
      await client.query('DELETE FROM public.accounts WHERE details NOT LIKE $1', ['NL00SUMM%']);
      // Categories are a foreign key of transactions, so they have to exist.
      await client.query(`
        INSERT INTO categories (category_name, color, category_type, income_outcome) VALUES
          ('Boodschappen', '#8cc2b3', 'Vast', 'Uitgaven'),
          ('Vast Inkomen', '#8fc069', 'Vast', 'Inkomsten'),
          ('Sparen, Beleggen', '#88a2a6', 'Variabel', 'Uitgaven'),
          ('Variabel Inkomen', '#80bfb4', 'Variabel', 'Inkomsten')
        ON CONFLICT (category_name) DO NOTHING;
      `);
      await client.query(
        `INSERT INTO accounts (account_type, account_name, details, balance_when_created)
         VALUES ('Checking Account', 'Betaal', $1, 1000),
                ('Savings Account', 'Spaar', $2, 5000)
         ON CONFLICT (details) DO NOTHING;`,
        [CHECKING, SAVINGS],
      );
    } finally {
      client.release();
    }
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  describe('getCategorySums', () => {
    test('reports spending as negative and income as positive', async () => {
      await FinanceManager.addTransactions([
        row({ amount: 40 }),
        row({ category: 'Vast Inkomen', debit_credit: 'Credit', amount: 3000 }),
      ]);

      const sums = await FinanceManager.getCategorySums('2026-08-01', '2026-08-31');
      const byCategory = Object.fromEntries(sums.map((s: any) => [s.category, Number(s.total_amount)]));

      assert.equal(byCategory['Boodschappen'], -40);
      assert.equal(byCategory['Vast Inkomen'], 3000);
    });

    test('nets a refund against spending in the same category', async () => {
      await FinanceManager.addTransactions([
        row({ amount: 100 }),
        row({ name_description: 'Refund', debit_credit: 'Credit', amount: 30 }),
      ]);

      const sums = await FinanceManager.getCategorySums('2026-08-01', '2026-08-31');
      assert.equal(Number(sums[0].total_amount), -70);
    });

    test('honours the date range on both ends', async () => {
      await FinanceManager.addTransactions([
        row({ date_str: '2026-07-31', amount: 10 }),
        row({ date_str: '2026-08-01', amount: 20 }),
        row({ date_str: '2026-08-31', amount: 40 }),
        row({ date_str: '2026-09-01', amount: 80 }),
      ]);

      const sums = await FinanceManager.getCategorySums('2026-08-01', '2026-08-31');
      // Boundaries are inclusive: 20 + 40, with July and September excluded.
      assert.equal(Number(sums[0].total_amount), -60);
    });

    test('excludes a confirmed internal transfer', async () => {
      const { createdIds } = await FinanceManager.addTransactions([
        row({ category: 'Sparen, Beleggen', counterparty: SAVINGS, amount: 500 }),
        row({ category: 'Variabel Inkomen', account: SAVINGS, counterparty: CHECKING, debit_credit: 'Credit', amount: 500 }),
        row({ amount: 40 }),
      ]);

      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const sums = await FinanceManager.getCategorySums('2026-08-01', '2026-08-31');
      const categories = sums.map((s: any) => s.category);
      assert.ok(!categories.includes('Sparen, Beleggen'), 'the debit side should be gone');
      assert.ok(!categories.includes('Variabel Inkomen'), 'the credit side should be gone');
      assert.equal(Number(sums.find((s: any) => s.category === 'Boodschappen').total_amount), -40);
    });
  });

  describe('getIncomeExpensesSum', () => {
    test('separates income from expenses', async () => {
      await FinanceManager.addTransactions([
        row({ category: 'Vast Inkomen', debit_credit: 'Credit', amount: 3000 }),
        row({ amount: 400 }),
      ]);

      const rows = await FinanceManager.getIncomeExpensesSum('2026-08-01', '2026-08-31');
      const fixed = rows.find((r: any) => r.category_type === 'Vast');

      assert.equal(Number(fixed.income), 3000);
      assert.equal(Number(fixed.expenses), 400);
    });

    test('counts both sides of an internal transfer until it is confirmed', async () => {
      // This is the defect the transfer feature addresses: money moved between
      // the user's own accounts shows up as income on one side and expense on
      // the other, inflating both.
      const { createdIds } = await FinanceManager.addTransactions([
        row({ category: 'Sparen, Beleggen', counterparty: SAVINGS, amount: 800 }),
        row({ category: 'Variabel Inkomen', account: SAVINGS, counterparty: CHECKING, debit_credit: 'Credit', amount: 800 }),
      ]);

      const before = await FinanceManager.getIncomeExpensesSum('2026-08-01', '2026-08-31');
      const variableBefore = before.find((r: any) => r.category_type === 'Variabel');
      assert.equal(Number(variableBefore.income), 800);
      assert.equal(Number(variableBefore.expenses), 800);

      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const after = await FinanceManager.getIncomeExpensesSum('2026-08-01', '2026-08-31');
      assert.equal(after.length, 0, 'nothing should remain once the transfer is confirmed');
    });

    test('treats a net-positive expense category as variable', async () => {
      // A category marked as spending that nets positive over the period is a
      // refund, not income of a fixed kind.
      await FinanceManager.addTransactions([
        row({ amount: 20 }),
        row({ debit_credit: 'Credit', amount: 70 }),
      ]);

      const rows = await FinanceManager.getIncomeExpensesSum('2026-08-01', '2026-08-31');
      const variable = rows.find((r: any) => r.category_type === 'Variabel');
      assert.equal(Number(variable.income), 50);
    });
  });

  describe('date handling', () => {
    test('returns a DATE as a plain calendar date, not a shifted timestamp', async () => {
      // pg turns a DATE into a Date at local midnight by default, which JSON
      // serialises as UTC - so 2026-08-01 leaves the server as
      // "2026-07-31T22:00:00.000Z" east of Greenwich, and a transaction on the
      // first of the month is reported in the month before.
      await FinanceManager.addTransactions([row({ date_str: '2026-08-01', amount: 10 })]);

      const [stored] = await FinanceManager.getTransactions('2026-08-01', '2026-08-31');
      assert.equal((stored as any).date_str, '2026-08-01');
    });

    test('survives JSON serialisation unchanged', async () => {
      await FinanceManager.addTransactions([row({ date_str: '2026-08-31', amount: 10 })]);

      const [stored] = await FinanceManager.getTransactions('2026-08-01', '2026-08-31');
      const serialised = JSON.parse(JSON.stringify(stored));
      assert.equal(serialised.date_str, '2026-08-31');
    });
  });

  describe('getAccountOverview', () => {
    test('adds credits and subtracts debits from the opening balance', async () => {
      await FinanceManager.addTransactions([
        row({ amount: 250 }),
        row({ category: 'Vast Inkomen', debit_credit: 'Credit', amount: 1000 }),
      ]);

      const accounts = await FinanceManager.getAccountOverview();
      const checking = accounts.find((a: any) => a.account_name === 'Betaal');
      // 1000 opening - 250 + 1000
      assert.equal(Number(checking.current_balance), 1750);
    });

    test('still counts a confirmed transfer, unlike the summaries', async () => {
      // The money genuinely moved, so balances must reflect it even though it
      // is neither income nor spending.
      const { createdIds } = await FinanceManager.addTransactions([
        row({ category: 'Sparen, Beleggen', counterparty: SAVINGS, amount: 500 }),
        row({ category: 'Variabel Inkomen', account: SAVINGS, counterparty: CHECKING, debit_credit: 'Credit', amount: 500 }),
      ]);
      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const accounts = await FinanceManager.getAccountOverview();
      const checking = accounts.find((a: any) => a.account_name === 'Betaal');
      const savings = accounts.find((a: any) => a.account_name === 'Spaar');

      assert.equal(Number(checking.current_balance), 500, '1000 opening - 500 moved out');
      assert.equal(Number(savings.current_balance), 5500, '5000 opening + 500 moved in');
    });
  });
});

describe('searchTransactions', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await runMigrations();
    await FinanceManager.addTransactions([
      row({ name_description: 'Albert Heijn Rotterdam', amount: 42.15, date_str: '2026-08-05', notifications: 'pinbetaling' }),
      row({ name_description: 'Jumbo', amount: 18.40, date_str: '2026-08-12', notifications: 'pin' }),
      row({ name_description: 'Salaris', category: 'Vast Inkomen', debit_credit: 'Credit', amount: 3000, date_str: '2026-08-25' }),
      row({ name_description: 'Onbekend', category: null, amount: 9.99, date_str: '2026-08-28' }),
      row({ name_description: 'Vorige maand', amount: 5, date_str: '2026-07-15' }),
    ]);
  });

  test('finds a merchant by free text', async () => {
    const { rows, total } = await FinanceManager.searchTransactions({ query: 'albert' });
    assert.equal(total, 1);
    assert.equal(rows[0].name_description, 'Albert Heijn Rotterdam');
  });

  test('searches the remittance text as well as the description', async () => {
    // The merchant is named in different columns depending on the bank.
    const { total } = await FinanceManager.searchTransactions({ query: 'pinbetaling' });
    assert.equal(total, 1);
  });

  test('filters by category', async () => {
    const { rows } = await FinanceManager.searchTransactions({ categories: ['Vast Inkomen'] });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name_description, 'Salaris');
  });

  test('filters by direction', async () => {
    const { total } = await FinanceManager.searchTransactions({ debitCredit: 'Credit' });
    assert.equal(total, 1);
  });

  test('filters by amount range', async () => {
    const { total } = await FinanceManager.searchTransactions({ minAmount: 10, maxAmount: 50 });
    assert.equal(total, 2, 'the 42.15 and the 18.40');
  });

  test('filters by date range', async () => {
    const { total } = await FinanceManager.searchTransactions({ startDate: '2026-08-01', endDate: '2026-08-31' });
    assert.equal(total, 4, 'July is excluded');
  });

  test('lists only uncategorised rows when asked', async () => {
    const { rows, total } = await FinanceManager.searchTransactions({ uncategorised: true });
    assert.equal(total, 1);
    assert.equal(rows[0].name_description, 'Onbekend');
  });

  test('reports the total independently of the page size', async () => {
    const { rows, total } = await FinanceManager.searchTransactions({ limit: 2 });
    assert.equal(rows.length, 2);
    assert.equal(total, 5, 'the count ignores paging');
  });

  test('pages without repeating a row', async () => {
    const first = await FinanceManager.searchTransactions({ limit: 2, offset: 0 });
    const second = await FinanceManager.searchTransactions({ limit: 2, offset: 2 });
    const overlap = first.rows.filter((a: any) => second.rows.some((b: any) => b.id === a.id));
    assert.equal(overlap.length, 0);
  });

  test('sorts by amount when asked', async () => {
    const { rows } = await FinanceManager.searchTransactions({ sortBy: 'amount', sortDir: 'desc' });
    assert.equal(Number(rows[0].amount), 3000);
  });

  test('ignores an unknown sort column instead of failing', async () => {
    // The column cannot be parameterised, so anything unrecognised falls back
    // to the default rather than reaching the query.
    const { rows } = await FinanceManager.searchTransactions({ sortBy: 'amount; DROP TABLE transactions' });
    assert.ok(rows.length > 0, 'still returns rows');
  });

  test('combines filters', async () => {
    const { total } = await FinanceManager.searchTransactions({
      query: 'jumbo',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      debitCredit: 'Debit',
    });
    assert.equal(total, 1);
  });

  test('returns each row with its tags attached', async () => {
    const { rows } = await FinanceManager.searchTransactions({ query: 'jumbo' });
    assert.ok(Array.isArray(rows[0].tags), 'tags should be an array, empty when none');
  });
});

describe('bulk edits', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  test('applies one category to many rows at once', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'A', category: null, amount: 1 }),
      row({ name_description: 'B', category: null, amount: 2 }),
      row({ name_description: 'C', category: null, amount: 3 }),
    ]);

    const updated = await FinanceManager.bulkUpdateTransactions(createdIds, { category: 'Boodschappen' });
    assert.equal(updated, 3);

    const { total } = await FinanceManager.searchTransactions({ uncategorised: true });
    assert.equal(total, 0);
  });

  test('leaves rows outside the selection alone', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Selected', category: null, amount: 1 }),
      row({ name_description: 'Untouched', category: null, amount: 2 }),
    ]);

    await FinanceManager.bulkUpdateTransactions([createdIds[0]], { category: 'Boodschappen' });

    const { rows } = await FinanceManager.searchTransactions({ uncategorised: true });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name_description, 'Untouched');
  });

  test('rejects a column that is not editable in bulk', async () => {
    const { createdIds } = await FinanceManager.addTransactions([row({ amount: 1 })]);
    await assert.rejects(
      () => FinanceManager.bulkUpdateTransactions(createdIds, { amount: 999 }),
      /No updatable columns supplied/,
    );
  });

  test('does nothing for an empty selection', async () => {
    assert.equal(await FinanceManager.bulkUpdateTransactions([], { category: 'Boodschappen' }), 0);
  });
});

describe('historical balances', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  test('as of a date, ignores everything after it', async () => {
    await FinanceManager.addTransactions([
      row({ date_str: '2026-06-10', debit_credit: 'Credit', amount: 500 }),
      row({ date_str: '2026-08-10', debit_credit: 'Credit', amount: 300 }),
    ]);

    const june = await FinanceManager.getAccountOverview('2026-06-30');
    const august = await FinanceManager.getAccountOverview('2026-08-31');
    const balance = (rows: any[]) =>
      Number(rows.find((a: any) => a.account_name === 'Betaal').current_balance);

    assert.equal(balance(june), 1500, '1000 opening + 500');
    assert.equal(balance(august), 1800, 'plus the later 300');
  });

  test('includes the boundary date itself', async () => {
    await FinanceManager.addTransactions([
      row({ date_str: '2026-06-30', debit_credit: 'Credit', amount: 100 }),
    ]);

    const rows = await FinanceManager.getAccountOverview('2026-06-30');
    const checking = rows.find((a: any) => a.account_name === 'Betaal');
    assert.equal(Number(checking.current_balance), 1100);
  });

  test('falls back to the opening balance before any transaction', async () => {
    await FinanceManager.addTransactions([
      row({ date_str: '2026-08-10', debit_credit: 'Credit', amount: 999 }),
    ]);

    const rows = await FinanceManager.getAccountOverview('2026-01-31');
    const checking = rows.find((a: any) => a.account_name === 'Betaal');
    assert.equal(Number(checking.current_balance), 1000);
  });

  test('without a date, answers for today', async () => {
    await FinanceManager.addTransactions([
      row({ date_str: '2026-06-10', debit_credit: 'Credit', amount: 500 }),
    ]);

    const now = await FinanceManager.getAccountOverview();
    const asOfToday = await FinanceManager.getAccountOverview('2099-12-31');
    const balance = (rows: any[]) =>
      Number(rows.find((a: any) => a.account_name === 'Betaal').current_balance);

    assert.equal(balance(now), balance(asOfToday));
  });

  test('counts a confirmed transfer, since the money did move', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ date_str: '2026-06-10', category: 'Sparen, Beleggen', counterparty: SAVINGS, amount: 400 }),
      row({ date_str: '2026-06-10', category: 'Variabel Inkomen', account: SAVINGS, counterparty: CHECKING, debit_credit: 'Credit', amount: 400 }),
    ]);
    await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

    const rows = await FinanceManager.getAccountOverview('2026-06-30');
    const checking = rows.find((a: any) => a.account_name === 'Betaal');
    const savings = rows.find((a: any) => a.account_name === 'Spaar');

    assert.equal(Number(checking.current_balance), 600, '1000 - 400');
    assert.equal(Number(savings.current_balance), 5400, '5000 + 400');
  });
});

describe('getNetWorthHistory', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  test('returns one row per month in the range', async () => {
    const history = await FinanceManager.getNetWorthHistory('2026-06-01', '2026-08-31');
    assert.deepEqual(history.map((h: any) => h.month), ['2026-06', '2026-07', '2026-08']);
  });

  test('carries a balance forward through a month with no activity', async () => {
    // The point of the running total: an account that saw nothing in July must
    // hold its June figure rather than drop out of the chart.
    await FinanceManager.addTransactions([
      row({ date_str: '2026-06-15', debit_credit: 'Credit', amount: 1000 }),
    ]);

    const history = await FinanceManager.getNetWorthHistory('2026-06-01', '2026-08-31');
    const [june, july, august] = history;

    assert.equal(Number(june.net_worth), Number(july.net_worth));
    assert.equal(Number(july.net_worth), Number(august.net_worth));
  });

  test('reflects a movement in the month it happened and every month after', async () => {
    await FinanceManager.addTransactions([
      row({ date_str: '2026-07-15', debit_credit: 'Credit', amount: 200 }),
    ]);

    const history = await FinanceManager.getNetWorthHistory('2026-06-01', '2026-08-31');
    const [june, july, august] = history;

    assert.equal(Number(july.net_worth) - Number(june.net_worth), 200);
    assert.equal(Number(august.net_worth), Number(july.net_worth));
  });

  test('splits the total by account type', async () => {
    const history = await FinanceManager.getNetWorthHistory('2026-08-01', '2026-08-31');
    const [august] = history;

    assert.equal(
      Number(august.checking) + Number(august.savings) + Number(august.investments ?? 0),
      Number(august.net_worth),
      'the parts should add up to the whole',
    );
  });
});
