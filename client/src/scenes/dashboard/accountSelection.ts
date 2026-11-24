import type { AccountBalance } from '@/api';

/**
 * The selection limited to accounts that still exist. An account that was
 * renamed or removed would otherwise filter everything away; with nothing
 * left, the result is empty, which means all accounts.
 */
export const effectiveSelection = (selected: string[], known: Pick<AccountBalance, 'details'>[]): string[] =>
  selected.filter((details) => known.some((a) => a.details === details));

const TYPE_ORDER = ['Checking Account', 'Savings Account', 'Investments'];

/** Accounts grouped by type, most liquid first, alphabetical within a group. */
export const groupAccounts = <T extends Pick<AccountBalance, 'account_type' | 'account_name'>>(accounts: T[]) => {
  const rank = (type: string) => {
    const index = TYPE_ORDER.indexOf(type);
    return index === -1 ? TYPE_ORDER.length : index;
  };
  const types = [...new Set(accounts.map((a) => a.account_type))].sort((a, b) => rank(a) - rank(b));
  return types.map((type) => ({
    type,
    accounts: accounts
      .filter((a) => a.account_type === type)
      .sort((a, b) => a.account_name.localeCompare(b.account_name)),
  }));
};
