import React, { useState } from 'react';
import { Typography } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import { AmountGroup, AmountGroups, TotalRow } from '@/components/AmountList';
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import { useGetIncomeExpensesSumQuery } from '@/api';

interface ExchangeType {
  name: string;
  amount: number;
}

interface IncomeExpenseItem {
  category_type: string;
  income: number;
  expenses: number;
}

interface Props {}

function splitIncomeExpense(items: unknown[]): { incomeItems: ExchangeType[] , expenseItems: ExchangeType[]} {
  const incomeExpenseItems: IncomeExpenseItem[] = items as IncomeExpenseItem[] || [];

  const incomeItems: ExchangeType[] = [];
  const expenseItems: ExchangeType[] = [];

  incomeExpenseItems.forEach(item => {
    if (item.income > 0) {
      incomeItems.push({ name: item.category_type, amount: item.income });
    }
    if (item.expenses > 0) {
      expenseItems.push({ name: item.category_type, amount: item.expenses });
    }
  });

  return { incomeItems, expenseItems };
}

const PeriodSummary: React.FC<Props> = () => {
  const [openIncome, setOpenIncome] = useState(true);
  const [openExpenses, setOpenExpenses] = useState(true);
  const { firstDay, lastDay } = useDateRange();
  
  const { data: results } = useGetIncomeExpensesSumQuery({
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  });

  const result = splitIncomeExpense(results) || {};

  const handleIncomeToggle = () => {
    setOpenIncome(!openIncome);
  };

  const handleExpensesToggle = () => {
    setOpenExpenses(!openExpenses);
  };

  const totalIncome = result.incomeItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpenses = result.expenseItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const netIncome = totalIncome - totalExpenses;
  const currentSavingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  return (
    <DashboardBox>
      <WidgetHeader title="Period summary" subtitle="Income and expenses this month" />
      <AmountGroups>
        <AmountGroup
          label="Income"
          amount={formatCurrency(totalIncome)}
          lines={result.incomeItems.map((item) => ({
            key: item.name,
            label: item.name,
            amount: formatCurrency(item.amount),
          }))}
          open={openIncome}
          onToggle={handleIncomeToggle}
        />
        <AmountGroup
          label="Expenses"
          amount={formatCurrency(totalExpenses)}
          lines={result.expenseItems.map((item) => ({
            key: item.name,
            label: item.name,
            amount: formatCurrency(item.amount),
          }))}
          open={openExpenses}
          onToggle={handleExpensesToggle}
        />
      </AmountGroups>
      <TotalRow label="Net income" first>
        <Typography variant={netIncome < 0 ? 'debit' : 'credit'}>
          {netIncome > 0 ? '+' : ''}{formatCurrency(netIncome)}
        </Typography>
      </TotalRow>
      <TotalRow label="Savings rate">
        <Typography variant={currentSavingsRate < 0 ? 'debit' : 'credit'}>
          {formatPercentage(currentSavingsRate)}
        </Typography>
      </TotalRow>
    </DashboardBox>
  );
};

export default PeriodSummary;
