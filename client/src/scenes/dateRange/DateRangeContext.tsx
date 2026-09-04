import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

interface DateRangeContextProps {
  firstDay: Date;
  lastDay: Date;
  incrementMonth: () => void;
  decrementMonth: () => void;
}

const DateRangeContext = createContext<DateRangeContextProps | undefined>(undefined);

const MONTH_PARAM = 'month';

/** 'YYYY-MM' for the month a date falls in. */
const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Anchor for a month key, always on the first of the month.
 *
 * Day 1 is what keeps month arithmetic honest: stepping back from the 31st with
 * setMonth() lands on the 3rd of the following month rather than in the previous
 * one, silently skipping a month with fewer days.
 */
const parseMonthKey = (value: string | null): Date => {
  if (value) {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }
  }

  // Default to the previous month: a bank export of the month just closed is
  // what there is to review, the running month is still incomplete.
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

/**
 * The month every dashboard figure is scoped to.
 *
 * The month lives in the URL rather than in component state, so a reload keeps
 * the period, and a link to "August 2026" can be shared or bookmarked.
 */
export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const anchor = useMemo(
    () => parseMonthKey(searchParams.get(MONTH_PARAM)),
    [searchParams],
  );

  const shiftMonth = (delta: number) => {
    // A fresh Date from year/month, never a mutation of the current anchor:
    // setMonth() writes through to the existing object, which React cannot see
    // as a change.
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    const params = new URLSearchParams(searchParams);
    params.set(MONTH_PARAM, toMonthKey(next));
    setSearchParams(params, { replace: true });
  };

  const value = useMemo(() => {
    const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    // Day 0 of the next month is the last day of this one, for any month length.
    const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

    return {
      firstDay,
      lastDay,
      incrementMonth: () => shiftMonth(1),
      decrementMonth: () => shiftMonth(-1),
    };
    // shiftMonth closes over searchParams, so the handlers are rebuilt with it.
  }, [anchor, searchParams]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
