// DateRangeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateRangeContextProps {
  firstDay: Date;
  lastDay: Date;
  incrementMonth: () => void;
  decrementMonth: () => void;
}

const DateRangeContext = createContext<DateRangeContextProps | undefined>(undefined);

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const incrementMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const decrementMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const getFirstAndLastDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  const { firstDay, lastDay } = getFirstAndLastDayOfMonth(currentDate);

  return (
    <DateRangeContext.Provider value={{ firstDay, lastDay, incrementMonth, decrementMonth }}>
      {children}
    </DateRangeContext.Provider>
  );
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
  
