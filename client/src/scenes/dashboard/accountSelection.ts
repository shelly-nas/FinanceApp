import type { AccountBalance } from '@/api';

/** Where the dashboard remembers which accounts were selected. */
export const STORAGE_KEY = 'dashboard.accounts';

/** The stored selection, or none when the value is missing or not a list of identifiers. */
export const parseStoredSelection = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((v) => typeof v === 'string') ? parsed : [];
  } catch {
    return [];
  }
};

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
