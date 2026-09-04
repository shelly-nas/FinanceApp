import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toMonthKey, parseMonthKey, shiftMonth, monthBounds, formatDate } from '@/utils/monthRange';

interface DateRangeContextProps {
  firstDay: Date;
  lastDay: Date;
  incrementMonth: () => void;
  decrementMonth: () => void;
}

const DateRangeContext = createContext<DateRangeContextProps | undefined>(undefined);

const MONTH_PARAM = 'month';

/**
 * The month every dashboard figure is scoped to.
 *
 * The month lives in the URL rather than in component state, so a reload keeps
 * the period and a link to a given month can be shared. The arithmetic itself
 * is in utils/monthRange, where it is covered by tests.
 */
export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const anchor = useMemo(
    () => parseMonthKey(searchParams.get(MONTH_PARAM)),
    [searchParams],
  );

  const value = useMemo(() => {
    const { firstDay, lastDay } = monthBounds(anchor);

    const step = (delta: number) => {
      const params = new URLSearchParams(searchParams);
      params.set(MONTH_PARAM, toMonthKey(shiftMonth(anchor, delta)));
      setSearchParams(params, { replace: true });
    };

    return {
      firstDay,
      lastDay,
      incrementMonth: () => step(1),
      decrementMonth: () => step(-1),
    };
  }, [anchor, searchParams, setSearchParams]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

// Re-exported so the many components importing it from here keep working.
export { formatDate };
