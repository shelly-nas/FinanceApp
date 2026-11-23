import { test, describe, assert } from 'vitest';
import { buildTransferReviewRows } from '@/scenes/transactions/transferReview';

const oneSided = (id: number, date: string, debitCredit = 'Debit') => ({
  id,
  date_str: date,
  name_description: `Storting ${id}`,
  account: 'NL01',
  account_name: 'Betaal',
  counterparty: 'NL09',
  counterparty_name: 'Beleggen',
  debit_credit: debitCredit,
  amount: '500.00',
});

const candidate = (fromId: number, date: string, basis: 'iban' | 'amount' = 'iban') => ({
  from_transaction_id: fromId,
  from_date: date,
  from_account: 'NL01',
  from_account_name: 'Betaal',
  from_description: 'Naar spaar',
  to_transaction_id: fromId + 1,
  to_date: date,
  to_account: 'NL02',
  to_account_name: 'Spaar',
  to_description: 'Van betaal',
  amount: '400.00',
  match_basis: basis,
});

describe('buildTransferReviewRows', () => {
  test('lists recognised movements and suggested pairs together, newest first', () => {
    const rows = buildTransferReviewRows(
      [oneSided(1, '2026-09-28'), oneSided(2, '2026-06-28')],
      [candidate(10, '2026-10-26')],
    );
    assert.deepEqual(rows.map((r) => r.date), ['2026-10-26', '2026-09-28', '2026-06-28']);
    assert.deepEqual(rows.map((r) => r.status), ['certain', 'recognised', 'recognised']);
  });

  test('shows a recognised movement in the direction the money went', () => {
    const [incoming] = buildTransferReviewRows([oneSided(1, '2026-09-28', 'Credit')], []);
    assert.equal(incoming.from, 'Beleggen');
    assert.equal(incoming.to, 'Betaal');
  });

  test('marks a pair matched on amount alone as likely', () => {
    const [row] = buildTransferReviewRows([], [candidate(10, '2026-10-26', 'amount')]);
    assert.equal(row.status, 'likely');
    assert.equal(row.description, 'Naar spaar → Van betaal');
  });

  test('is empty when there is nothing to review', () => {
    assert.deepEqual(buildTransferReviewRows([], []), []);
  });
});
