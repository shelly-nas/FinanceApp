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
