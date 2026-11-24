import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useGetAccountOverviewQuery } from '@/api';
import { effectiveSelection } from '@/scenes/dashboard/accountSelection';
import {
  ACCOUNTS_STORAGE_KEY, LEGACY_ACCOUNTS_STORAGE_KEY, InsightsFilter, Preset,
  defaultFilter, describePeriod, filterKey, hasFilterParams, parseStoredAccounts,
  periodDates, periodMonths, readFilter, stepPeriod, trendMonths, writeFilter,
} from '@/scenes/insights/filter';

/** The pages that show the filter and keep it in their URL. */
const INSIGHTS_PATHS = ['/', '/trends'];

const readStoredAccounts = () => {
  try {
    return parseStoredAccounts(
      localStorage.getItem(ACCOUNTS_STORAGE_KEY) ?? localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY),
    );
  } catch {
    return [];
  }
};

const storeAccounts = (accounts: string[]) => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Private mode or full storage: the selection just is not remembered.
  }
};

interface Value {
  filter: InsightsFilter;
  /** Replace part of the filter. */
  update: (patch: Partial<InsightsFilter>) => void;
  /** Step the period back or forward by its own length. */
  step: (direction: 1 | -1) => void;
  setPreset: (preset: Preset) => void;
  toggleAccount: (details: string) => void;
  toggleCategory: (name: string) => void;
  /** Back to the current month, every account and every category. */
  reset: () => void;
  /** The period Overview shows. */
  period: ReturnType<typeof periodDates> & { from: string; to: string; label: string };
  /** The months Trends shows: the period, or the 12 months up to a single month. */
  trend: ReturnType<typeof periodDates> & { from: string; to: string; label: string; widened: boolean };
  /** For the API: undefined when every account is selected. */
  accounts?: string[];
  /** For the API: undefined when every category is selected. */
  categories?: string[];
}

const InsightsFilterContext = createContext<Value | undefined>(undefined);

/**
 * Holds the one filter Overview and Trends share, and keeps it in the URL of
 * those pages: a reload, the back button and a shared link all keep it. On
 * other pages the URL is left alone, but the filter is kept in memory, so
 * coming back to Overview through the menu restores it.
 *
 * The selected accounts are also remembered between visits; the period starts
 * at the current month again and the categories at all.
 */
export const InsightsFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const onInsights = INSIGHTS_PATHS.includes(pathname);

  const [filter, setFilter] = useState<InsightsFilter>(() => {
    const base = defaultFilter(new Date(), readStoredAccounts());
    return onInsights && hasFilterParams(searchParams) ? readFilter(searchParams, base) : base;
  });
  // The filter as last written to or read from the URL, so a change the
  // filter made itself is not read back as a new one.
  const synced = useRef<string | null>(null);

  // URL -> filter: a shared link or the back button. A page opened without
  // filter parameters (the menu links have none) gets the current filter.
  useEffect(() => {
    if (!onInsights) return;
    if (!hasFilterParams(searchParams)) {
      synced.current = filterKey(filter);
      setSearchParams(writeFilter(searchParams, filter), { replace: true });
      return;
    }
    const fromUrl = readFilter(searchParams, filter);
    const key = filterKey(fromUrl);
    if (key !== synced.current && key !== filterKey(filter)) {
      synced.current = key;
      setFilter(fromUrl);
      storeAccounts(fromUrl.accounts);
    }
    // An old `?month=` link, or parameters in another order, are rewritten
    // to the canonical form, so the address bar shows what is applied.
    const canonical = writeFilter(searchParams, fromUrl);
    if (canonical.toString() !== searchParams.toString()) {
      synced.current = key;
      setSearchParams(canonical, { replace: true });
    }
    // Only a navigation should run this; the filter's own changes write the
    // URL in `apply` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onInsights, searchParams]);

  // Filter -> URL and storage, for every change made through the context.
  const apply = useCallback((next: InsightsFilter) => {
    setFilter(next);
    storeAccounts(next.accounts);
    if (onInsights) {
      synced.current = filterKey(next);
      setSearchParams((params) => writeFilter(params, next), { replace: true });
    }
  }, [onInsights, setSearchParams]);

  // Accounts that no longer exist would filter everything away; they are
  // ignored, and with none left the selection means every account again.
  const { data: knownAccounts } = useGetAccountOverviewQuery();
  const accounts = useMemo(
    () => (knownAccounts ? effectiveSelection(filter.accounts, knownAccounts) : filter.accounts),
    [filter.accounts, knownAccounts],
  );

  const value = useMemo<Value>(() => {
    const months = periodMonths(filter);
    const trend = trendMonths(filter);
    const toggle = (list: string[], item: string) =>
      (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
    return {
      filter: { ...filter, accounts },
      update: (patch) => apply({ ...filter, ...patch }),
      step: (direction) => apply(stepPeriod(filter, direction)),
      setPreset: (preset) => apply(
        preset === 'custom'
          ? { ...filter, preset, from: months.from, to: months.to }
          : { ...filter, preset, from: undefined },
      ),
      toggleAccount: (details) => apply({ ...filter, accounts: toggle(accounts, details) }),
      toggleCategory: (name) => apply({ ...filter, categories: toggle(filter.categories, name) }),
      reset: () => apply(defaultFilter()),
      period: { ...periodDates(months), ...months, label: describePeriod(months) },
      trend: { ...periodDates(trend), ...trend, label: describePeriod(trend) },
      accounts: accounts.length > 0 ? accounts : undefined,
      categories: filter.categories.length > 0 ? filter.categories : undefined,
    };
  }, [filter, accounts, apply]);

  return <InsightsFilterContext.Provider value={value}>{children}</InsightsFilterContext.Provider>;
};

export const useInsightsFilter = () => {
  const context = useContext(InsightsFilterContext);
  if (!context) throw new Error('useInsightsFilter must be used within an InsightsFilterProvider');
  return context;
};
