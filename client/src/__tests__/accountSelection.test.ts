import { test, describe, assert } from 'vitest';
import { groupAccounts, effectiveSelection } from '@/scenes/dashboard/accountSelection';

const account = (details: string, account_type: string, account_name = details) => ({
  details, account_type, account_name, current_balance: '0',
});

describe('effectiveSelection', () => {
  test('drops accounts that no longer exist', () => {
    const known = [account('NL01', 'Checking Account')];
    assert.deepEqual(effectiveSelection(['NL01', 'NL99'], known), ['NL01']);
  });

  test('is empty - meaning all accounts - when nothing selected is left', () => {
    assert.deepEqual(effectiveSelection(['NL99'], [account('NL01', 'Checking Account')]), []);
  });
});

describe('groupAccounts', () => {
  test('orders by type, most liquid first, then by name', () => {
    const groups = groupAccounts([
      account('NL03', 'Savings Account', 'Spaar B'),
      account('NL09', 'Investments', 'DEGIRO'),
      account('NL01', 'Checking Account', 'Betaal'),
      account('NL02', 'Savings Account', 'Spaar A'),
    ]);
    assert.deepEqual(groups.map((g) => g.type), ['Checking Account', 'Savings Account', 'Investments']);
    assert.deepEqual(groups[1].accounts.map((a) => a.account_name), ['Spaar A', 'Spaar B']);
  });
});
