import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import dbContext from '@/context/dbContext';
import { ensureSchema } from '@/__tests__/schema';
import FinanceManager from '@/managers/financeManager';
import '@/__tests__/teardown';

// Duplicate protection and transfer detection: both decide what ends up in the
// totals, and both fail quietly - a duplicated row doubles a figure, an
// undetected transfer inflates income and expenses alike.
const hasDatabase = Boolean(process.env.DB_HOST && process.env.DB_NAME);

const CHECKING = 'NL00TEST0000000001';
const SAVINGS = 'NL00TEST0000000002';

const row = (overrides: Partial<any> = {}) => ({
  date_str: '2026-08-15',
  name_description: 'Albert Heijn',
  account: CHECKING,
  counterparty: null,
  category: 'Boodschappen',
  debit_credit: 'Debit',
  amount: 42.15,
  notifications: 'pin',
  ...overrides,
});

describe('imports and transfers', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await ensureSchema();
    const client = await dbContext.connect();
    try {
      // Anything left behind by an earlier run - including a failed one - would
      // shift the balances these tests assert on. Only this file's own accounts
      // survive.
      await client.query('DELETE FROM public.investments');
      await client.query('DELETE FROM public.accounts WHERE details NOT LIKE $1', ['NL00TEST%']);
      await client.query(`
        INSERT INTO categories (category_name, color, category_type, income_outcome) VALUES
          ('Boodschappen', '#8cc2b3', 'Vast', 'Uitgaven'),
          ('Overboekingen', '#c2b2d1', 'Variabel', 'Uitgaven')
        ON CONFLICT (category_name) DO NOTHING;
      `);
      await client.query(
        `INSERT INTO accounts (account_type, account_name, details, balance_when_created)
         VALUES ('Checking Account', 'Import Betaal', $1, 0),
                ('Savings Account', 'Import Spaar', $2, 0)
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

  describe('duplicate protection', () => {
    test('imports a batch once', async () => {
      const result = await FinanceManager.addTransactions([row(), row({ amount: 10 })]);
      assert.equal(result.imported, 2);
      assert.equal(result.skipped, 0);
    });

    test('skips the whole batch on a second identical import', async () => {
      // Export periods overlap: asking a bank for "the last three months" twice
      // delivers the same rows again, and they must not be stored twice.
      const batch = [row(), row({ amount: 10 })];
      await FinanceManager.addTransactions(batch.map((r) => ({ ...r })));
      const second = await FinanceManager.addTransactions(batch.map((r) => ({ ...r })));

      assert.equal(second.imported, 0);
      assert.equal(second.skipped, 2);
    });

    test('imports only the new rows from an overlapping export', async () => {
      await FinanceManager.addTransactions([row({ date_str: '2026-08-01' })]);

      const overlapping = await FinanceManager.addTransactions([
        row({ date_str: '2026-08-01' }), // already stored
        row({ date_str: '2026-08-02' }), // new
      ]);

      assert.equal(overlapping.imported, 1);
      assert.equal(overlapping.skipped, 1);
    });

    test('keeps two genuinely identical payments on the same day', async () => {
      // Two coffees at the same place on one day are both real. Deduplicating
      // on the fields alone would silently drop the second.
      const result = await FinanceManager.addTransactions([
        row({ name_description: 'Bakkerij', amount: 5 }),
        row({ name_description: 'Bakkerij', amount: 5 }),
      ]);

      assert.equal(result.imported, 2);
    });

    test('recognises both halves of that pair as duplicates on re-import', async () => {
      const batch = [
        row({ name_description: 'Bakkerij', amount: 5 }),
        row({ name_description: 'Bakkerij', amount: 5 }),
      ];
      await FinanceManager.addTransactions(batch.map((r) => ({ ...r })));
      const second = await FinanceManager.addTransactions(batch.map((r) => ({ ...r })));

      assert.equal(second.skipped, 2);
    });

    test('treats a differing amount as a different transaction', async () => {
      await FinanceManager.addTransactions([row({ amount: 42.15 })]);
      const second = await FinanceManager.addTransactions([row({ amount: 42.16 })]);
      assert.equal(second.imported, 1);
    });
  });

  describe('transfer detection', () => {
    const transferPair = () => [
      row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 500, date_str: '2026-08-05' }),
      row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 500, date_str: '2026-08-06' }),
    ];

    test('proposes a debit and credit of the same amount across accounts', async () => {
      await FinanceManager.addTransactions(transferPair());
      const candidates = await FinanceManager.getTransferCandidates();

      assert.equal(candidates.length, 1);
      assert.equal(Number(candidates[0].amount), 500);
    });

    test("marks mutually referencing counterparties as 'iban', not merely likely", async () => {
      await FinanceManager.addTransactions(transferPair());
      const [candidate] = await FinanceManager.getTransferCandidates();
      assert.equal(candidate.match_basis, 'iban');
    });

    test("marks a coincidental same-amount pair as 'amount'", async () => {
      // A gift out of one account and a repayment into another, same day, same
      // figure. Indistinguishable from a transfer on the numbers, so it is
      // offered as a suggestion rather than applied.
      await FinanceManager.addTransactions([
        row({ name_description: 'Cadeau', category: null, amount: 75, date_str: '2026-08-10' }),
        row({ name_description: 'Van Piet', account: SAVINGS, category: null, debit_credit: 'Credit', amount: 75, date_str: '2026-08-10' }),
      ]);

      const [candidate] = await FinanceManager.getTransferCandidates();
      assert.equal(candidate.match_basis, 'amount');
    });

    test('does not pair two debits, however alike', async () => {
      await FinanceManager.addTransactions([
        row({ category: null, amount: 60, date_str: '2026-08-11' }),
        row({ category: null, account: SAVINGS, amount: 60, date_str: '2026-08-11' }),
      ]);

      assert.equal((await FinanceManager.getTransferCandidates()).length, 0);
    });

    test('does not pair rows on the same account', async () => {
      await FinanceManager.addTransactions([
        row({ category: null, amount: 60, date_str: '2026-08-11' }),
        row({ category: null, debit_credit: 'Credit', amount: 60, date_str: '2026-08-11' }),
      ]);

      assert.equal((await FinanceManager.getTransferCandidates()).length, 0);
    });

    test('does not pair rows too far apart in time', async () => {
      await FinanceManager.addTransactions([
        row({ category: null, counterparty: SAVINGS, amount: 500, date_str: '2026-08-01' }),
        row({ category: null, account: SAVINGS, counterparty: CHECKING, debit_credit: 'Credit', amount: 500, date_str: '2026-08-20' }),
      ]);

      assert.equal((await FinanceManager.getTransferCandidates()).length, 0);
    });

    test('stops proposing a pair once confirmed', async () => {
      const { createdIds } = await FinanceManager.addTransactions(transferPair());
      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      assert.equal((await FinanceManager.getTransferCandidates()).length, 0);
    });

    test('files a confirmed pair under the transfer category', async () => {
      // Which is also what clears it from the review screen's list of rows
      // still needing one.
      const { createdIds } = await FinanceManager.addTransactions(transferPair());
      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const [stored] = await FinanceManager.getTransactions(undefined, undefined, [createdIds[0]]);
      assert.equal((stored as any).category, 'Overboekingen');
      assert.equal((stored as any).is_internal, true);
    });

    test('leaves a category the classifier already set', async () => {
      const { createdIds } = await FinanceManager.addTransactions([
        row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: 'Boodschappen', amount: 500, date_str: '2026-08-05' }),
        row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 500, date_str: '2026-08-06' }),
      ]);
      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const [stored] = await FinanceManager.getTransactions(undefined, undefined, [createdIds[0]]);
      assert.equal((stored as any).category, 'Boodschappen');
      assert.equal((stored as any).is_internal, true, 'still excluded from the summaries');
    });

    test('refuses to confirm a transaction that is already part of a transfer', async () => {
      const { createdIds } = await FinanceManager.addTransactions(transferPair());
      await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

      const again = await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');
      assert.equal(again, null);
    });

    test('stops proposing a rejected pair', async () => {
      const { createdIds } = await FinanceManager.addTransactions(transferPair());
      await FinanceManager.rejectTransfer(createdIds[0], createdIds[1]);

      assert.equal((await FinanceManager.getTransferCandidates()).length, 0);
    });

    test('offers the pair again after unlinking', async () => {
      const { createdIds } = await FinanceManager.addTransactions(transferPair());
      const transfer = await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');
      await FinanceManager.unlinkTransfer(String(transfer.id));

      assert.equal((await FinanceManager.getTransferCandidates()).length, 1);
    });
  });
});

describe('account discovery', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
      await client.query('DELETE FROM investments WHERE account LIKE $1', ['NL00DISC%']);
      await client.query('DELETE FROM accounts WHERE details LIKE $1', ['NL00DISC%']);
    } finally {
      client.release();
    }
  });

  test('reports an account seen in transactions but not in the accounts table', async () => {
    await FinanceManager.addTransactions([
      row({ account: 'NL00DISC0000000001', amount: 10 }),
      row({ account: 'NL00DISC0000000001', amount: 20, date_str: '2026-08-16' }),
    ]);

    const unknown = await FinanceManager.getUnknownAccounts();
    const discovered = unknown.find((a: any) => a.details === 'NL00DISC0000000001');

    assert.ok(discovered, 'the account should be reported');
    assert.equal(discovered.transaction_count, 2);
  });

  test('stops reporting it once it has been added', async () => {
    await FinanceManager.addTransactions([row({ account: 'NL00DISC0000000002', amount: 10 })]);

    await FinanceManager.createAccount({
      account_type: 'Checking Account',
      account_name: 'Discovered',
      details: 'NL00DISC0000000002',
      balance_when_created: 100,
    });

    const unknown = await FinanceManager.getUnknownAccounts();
    assert.ok(!unknown.some((a: any) => a.details === 'NL00DISC0000000002'));
  });

  test('carries transactions along when an account identifier is corrected', async () => {
    // transactions.account references details by value, so renaming without
    // rewriting them would orphan every row and reset the balance to its
    // opening figure.
    const account = await FinanceManager.createAccount({
      account_type: 'Checking Account',
      account_name: 'Typo',
      details: 'NL00DISC0000000003',
      balance_when_created: 100,
    });
    await FinanceManager.addTransactions([
      row({ account: 'NL00DISC0000000003', debit_credit: 'Credit', amount: 50 }),
    ]);

    await FinanceManager.updateAccount(String(account.id), { details: 'NL00DISC0000000004' });

    const accounts = await FinanceManager.getAccounts();
    const renamed = accounts.find((a: any) => a.id === account.id);
    assert.equal(renamed.details, 'NL00DISC0000000004');
    assert.equal(renamed.transaction_count, 1, 'the transaction should have followed');

    const unknown = await FinanceManager.getUnknownAccounts();
    assert.ok(!unknown.some((a: any) => a.details === 'NL00DISC0000000003'), 'no orphans left behind');
  });

  test('carries investments along when an account identifier is corrected', async () => {
    // investments.account references details by value and, unlike transactions,
    // is a real foreign key - so the rename is rejected outright unless both
    // tables are updated together.
    const account = await FinanceManager.createAccount({
      account_type: 'Investments',
      account_name: 'Broker',
      details: 'NL00DISC0000000007',
      balance_when_created: 0,
    });

    const client = await dbContext.connect();
    try {
      await client.query(
        `INSERT INTO investments (date_str, name_description, account, balance)
         VALUES ('2026-08-01', 'saldo augustus', $1, 2500)`,
        ['NL00DISC0000000007'],
      );
    } finally {
      client.release();
    }

    await FinanceManager.updateAccount(String(account.id), { details: 'NL00DISC0000000008' });

    try {
      // The balance still resolves, which it would not if the investment had
      // been left pointing at the old identifier.
      const overview = await FinanceManager.getAccountOverview();
      const renamed = overview.find((a: any) => a.details === 'NL00DISC0000000008');
      assert.equal(Number(renamed.current_balance), 2500);
    } finally {
      // Cleaned up here rather than in beforeEach: this account carries a
      // balance, and leaving it behind shifts the net worth every other test
      // asserts on.
      const cleanup = await dbContext.connect();
      try {
        await cleanup.query('DELETE FROM investments WHERE account = $1', ['NL00DISC0000000008']);
        await cleanup.query('DELETE FROM accounts WHERE details = $1', ['NL00DISC0000000008']);
      } finally {
        cleanup.release();
      }
    }
  });

  test('refuses to delete an account that still has transactions', async () => {
    const account = await FinanceManager.createAccount({
      account_type: 'Checking Account',
      account_name: 'In use',
      details: 'NL00DISC0000000005',
      balance_when_created: 0,
    });
    await FinanceManager.addTransactions([row({ account: 'NL00DISC0000000005', amount: 10 })]);

    const result = await FinanceManager.deleteAccount(String(account.id));
    assert.equal(result.deleted, null);
    assert.equal(result.blockedBy, 1);
  });

  test('deletes an account with nothing pointing at it', async () => {
    const account = await FinanceManager.createAccount({
      account_type: 'Investments',
      account_name: 'Empty',
      details: 'NL00DISC0000000006',
      balance_when_created: 0,
    });

    const result = await FinanceManager.deleteAccount(String(account.id));
    assert.ok(result.deleted, 'should have been removed');
    assert.equal(result.blockedBy, undefined);
  });
});

describe('category management', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
      await client.query('DELETE FROM categories WHERE category_name LIKE $1', ['ZZTest%']);
    } finally {
      client.release();
    }
  });

  test('creates a category with its colour and classification', async () => {
    const created = await FinanceManager.createCategory({
      category_name: 'ZZTest Abonnementen',
      color: '#123456',
      category_type: 'Vast',
      income_outcome: 'Uitgaven',
    });

    assert.equal(created.color, '#123456');
    assert.equal(created.category_type, 'Vast');
  });

  test('carries transactions along when a category is renamed', async () => {
    // transactions.category is a foreign key on the name, so a rename that does
    // not rewrite them is rejected by the database - or worse, orphans history.
    const created = await FinanceManager.createCategory({
      category_name: 'ZZTest Oud',
      color: '#111111',
    });
    await FinanceManager.addTransactions([
      row({ category: 'ZZTest Oud', amount: 25 }),
    ]);

    await FinanceManager.updateCategory(String(created.id), { category_name: 'ZZTest Nieuw' });

    const categories = await FinanceManager.getCategories();
    const renamed = categories.find((c: any) => c.id === created.id);
    assert.equal(renamed.category_name, 'ZZTest Nieuw');
    assert.equal(renamed.transaction_count, 1, 'the transaction should have followed');
  });

  test('refuses to delete a category still in use', async () => {
    const created = await FinanceManager.createCategory({ category_name: 'ZZTest InGebruik' });
    await FinanceManager.addTransactions([row({ category: 'ZZTest InGebruik', amount: 10 })]);

    const result = await FinanceManager.deleteCategory(String(created.id));
    assert.equal(result.deleted, null);
    assert.equal(result.blockedBy, 1);
  });

  test('deletes an unused category', async () => {
    const created = await FinanceManager.createCategory({ category_name: 'ZZTest Ongebruikt' });
    const result = await FinanceManager.deleteCategory(String(created.id));
    assert.ok(result.deleted);
  });

  test('reports how many transactions each category carries', async () => {
    const created = await FinanceManager.createCategory({ category_name: 'ZZTest Geteld' });
    await FinanceManager.addTransactions([
      row({ category: 'ZZTest Geteld', amount: 1 }),
      row({ category: 'ZZTest Geteld', amount: 2 }),
    ]);

    const categories = await FinanceManager.getCategories();
    const counted = categories.find((c: any) => c.id === created.id);
    assert.equal(counted.transaction_count, 2);
  });
});

describe('one-sided transfers', { skip: !hasDatabase && 'no database configured' }, () => {
  const BROKER = 'NL00TEST0000000003';

  before(async () => {
    await ensureSchema();
    const client = await dbContext.connect();
    try {
      await client.query(
        `INSERT INTO accounts (account_type, account_name, details, balance_when_created)
         VALUES ('Investments', 'Import Broker', $1, 0)
         ON CONFLICT (details) DO NOTHING;`,
        [BROKER],
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

  test('marks a payment into an account the user owns, with no counterpart', async () => {
    // An investment account ships no export of its own, so this movement can
    // never have a matching row - yet counted naively the monthly deposit
    // becomes the largest expense of the month.
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Naar broker', counterparty: BROKER, category: null, amount: 1000 }),
    ]);

    const marked = await FinanceManager.markCounterpartyTransfers(createdIds);
    assert.equal(marked.length, 1);

    const [stored] = await FinanceManager.getTransactions(undefined, undefined, createdIds);
    assert.equal((stored as any).is_internal, true);
    assert.equal((stored as any).category, 'Overboekingen');
  });

  test('leaves an ordinary payment alone', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Albert Heijn', counterparty: 'NL91ABNA0417164300', amount: 40 }),
    ]);

    assert.equal((await FinanceManager.markCounterpartyTransfers(createdIds)).length, 0);
  });

  test('leaves a row without a counterparty alone', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Pin', counterparty: null, amount: 20 }),
    ]);

    assert.equal((await FinanceManager.markCounterpartyTransfers(createdIds)).length, 0);
  });

  test('does not re-mark a row the user rejected', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Naar broker', counterparty: BROKER, category: null, amount: 500 }),
    ]);
    await FinanceManager.markCounterpartyTransfers(createdIds);
    await FinanceManager.unmarkInternal(String(createdIds[0]));

    // A second import must not undo that decision.
    assert.equal((await FinanceManager.markCounterpartyTransfers(createdIds)).length, 0);

    const [stored] = await FinanceManager.getTransactions(undefined, undefined, createdIds);
    assert.equal((stored as any).is_internal, false);
  });

  test('lists what it marked, so the change is visible rather than silent', async () => {
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Naar broker', counterparty: BROKER, category: null, amount: 750 }),
    ]);
    await FinanceManager.markCounterpartyTransfers(createdIds);

    const listed = await FinanceManager.getOneSidedTransfers(createdIds);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].counterparty_name, 'Import Broker');
  });

  test('refuses to unmark a row that is half of a confirmed pair', async () => {
    // Unmarking one side would leave the pair inconsistent: the transfer record
    // says they belong together while one of them counts as spending again.
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 300, date_str: '2026-08-05' }),
      row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 300, date_str: '2026-08-05' }),
    ]);
    await FinanceManager.confirmTransfer(createdIds[0], createdIds[1], 'iban');

    assert.equal(await FinanceManager.unmarkInternal(String(createdIds[0])), null);
  });

  test('keeps the deposit in the account balance', async () => {
    // It is excluded from income and expenses because nothing was spent, but
    // the money did leave the account.
    const { createdIds } = await FinanceManager.addTransactions([
      row({ name_description: 'Naar broker', counterparty: BROKER, category: null, amount: 1000 }),
    ]);
    await FinanceManager.markCounterpartyTransfers(createdIds);

    const overview = await FinanceManager.getAccountOverview();
    const checking = overview.find((a: any) => a.details === CHECKING);
    assert.equal(Number(checking.current_balance), -1000, 'opening 0 minus the 1000 moved out');
  });
});

describe('transfer matching, one best pair per transaction', { skip: !hasDatabase && 'no database configured' }, () => {
  before(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    const client = await dbContext.connect();
    try {
      await client.query('TRUNCATE transfers, transaction_tags, transactions RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  // The counterparty marking would claim these rows before the matcher sees
  // them, so it is undone here to test the pairing itself.
  const clearMarking = async () => {
    const client = await dbContext.connect();
    try {
      await client.query('UPDATE transactions SET is_internal = NULL');
    } finally {
      client.release();
    }
  };

  test('pairs two same-amount transfers without crossing them', async () => {
    // Every debit matching every credit is a cross product: two 500-euro
    // transfers on consecutive days produced four suggestions, of which two
    // were wrong, and confirming a wrong one blocked the right pair.
    await FinanceManager.addTransactions([
      row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 500, date_str: '2026-08-01' }),
      row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 500, date_str: '2026-08-01' }),
      row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 500, date_str: '2026-08-02' }),
      row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 500, date_str: '2026-08-02' }),
    ]);
    await clearMarking();

    const candidates = await FinanceManager.getTransferCandidates();
    assert.equal(candidates.length, 2);

    // Each pair joins the two rows of the same day, not across days.
    for (const candidate of candidates) {
      assert.equal(candidate.from_date, candidate.to_date);
    }
  });

  test('never offers the same transaction in two suggestions', async () => {
    await FinanceManager.addTransactions([
      row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 250, date_str: '2026-08-01' }),
      row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 250, date_str: '2026-08-01' }),
      row({ name_description: 'Van betaal 2', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 250, date_str: '2026-08-02' }),
    ]);
    await clearMarking();

    const candidates = await FinanceManager.getTransferCandidates();
    const debitIds = candidates.map((c: any) => c.from_transaction_id);
    assert.equal(new Set(debitIds).size, debitIds.length, 'a debit appears at most once');
    assert.equal(candidates.length, 1, 'the closer credit wins, the other is left over');
  });

  test('still finds each month of a recurring transfer', async () => {
    for (const month of ['06', '07', '08']) {
      await FinanceManager.addTransactions([
        row({ name_description: 'Naar spaar', counterparty: SAVINGS, category: null, amount: 500, date_str: `2026-${month}-01` }),
        row({ name_description: 'Van betaal', account: SAVINGS, counterparty: CHECKING, category: null, debit_credit: 'Credit', amount: 500, date_str: `2026-${month}-01` }),
      ]);
    }
    await clearMarking();

    assert.equal((await FinanceManager.getTransferCandidates()).length, 3);
  });
});
