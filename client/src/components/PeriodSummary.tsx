import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const PeriodSummary: React.FC = () => {
  const spending = useSelector((state: RootState) => state.spending);

  const totalExpenses = spending.expenses.homeAuto + spending.expenses.food + spending.expenses.shopping + spending.expenses.alcohol + spending.expenses.ridesharing;
  const netIncome = spending.income - totalExpenses;
  const savingsRate = (netIncome / spending.income) * 100;

  return (
    <div>
      <h2>Period Summary</h2>
      <div>Total Income Earned: ${spending.income.toFixed(2)}</div>
      <div>Total Expenses: ${totalExpenses.toFixed(2)}</div>
      <div>Net Income: ${netIncome.toFixed(2)}</div>
      <div>Current Savings Rate: {savingsRate.toFixed(2)}%</div>
    </div>
  );
};

export default PeriodSummary;
