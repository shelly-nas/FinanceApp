import React, { useState } from 'react';
import { Box, Typography, Divider, LinearProgress, useTheme, TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import MultiColorProgress from '@/components/MultiColorProgress';
import SortableSpendingTable from './SortableSpendingTable';

interface IncomeItem {
  name: string;
  amount: number;
  color: string;
}

interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
}

interface SpendingBreakdownProps {
  income: IncomeItem[];
  expenses: ExpenseItem[];
  onCategorySelect: (category: string) => void;
}

const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ income, expenses, onCategorySelect }) => {
  const { palette } = useTheme();
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Typography variant="h3">Spending Breakdown</Typography>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />

      {/* INCOME PROGRESSBAR */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', ml: 1, mt: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          INCOME
        </Typography>
        <Typography variant="credit" fontWeight="bold" sx={{ mr: 1 }}>
          {formatCurrency(totalIncome)}
        </Typography>
      </Box>
      <MultiColorProgress
        segments={income.map(item => ({
          value: (item.amount / totalIncome) * 100,
          color: item.color,
          name: item.name,
        }))}
        height={18}
      />

      {/* EXPENSES PROGRESSBAR */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', ml: 1, mt: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          EXPENSES
        </Typography>
        <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
          {formatCurrency(totalExpenses)}
        </Typography>
      </Box>
      <MultiColorProgress
        segments={expenses.map(item => ({
          value: (item.amount / totalIncome) * 100,
          color: item.color,
          name: item.name,
        }))}
        height={18}
      />

      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 2, mb: 1 }} />

      {/* INCOME TABLE */}
      <SortableSpendingTable title="INCOME" items={income} totalAmount={totalIncome} onRowClick={onCategorySelect} />

      {/* EXPENSES TABLE */}
      <SortableSpendingTable title="EXPENSES" items={expenses} totalAmount={totalExpenses} onRowClick={onCategorySelect} />
    </DashboardBox>
  );
};

export default SpendingBreakdown;
