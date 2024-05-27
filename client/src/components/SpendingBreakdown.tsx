import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const SpendingBreakdown: React.FC = () => {
  const spending = useSelector((state: RootState) => state.spending);

  return (
    <div>
      <h2>Spending Breakdown</h2>
      <div>Income: ${spending.income.toFixed(2)}</div>
      <div>Expenses: ${spending.expenses.homeAuto + spending.expenses.food + spending.expenses.shopping + spending.expenses.alcohol + spending.expenses.ridesharing}</div>
    </div>
  );
};

export default SpendingBreakdown;
