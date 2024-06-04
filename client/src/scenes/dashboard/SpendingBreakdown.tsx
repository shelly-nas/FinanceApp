import React from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import MultiColorProgress from '@/components/MultiColorProgress';
import SortableSpendingTable from './SortableSpendingTable';
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import { useGetCategorySumsQuery } from '@/api';

export interface CategorySums {
  category: string;
  total_amount: number;
  color: string;
}

interface SpendingBreakdownProps {
  onCategorySelect: (category: string) => void;
}

function categorizeItems(items: unknown[]): { income: CategorySums[], expenses: CategorySums[] } {
  let categorySums: CategorySums[] = (items as unknown as CategorySums[]) || [];

  let income: CategorySums[] = [];
  let expenses: CategorySums[] = [];

  categorySums.forEach(c => {
    if (c.total_amount > 0) {
      income.push({ ...c, total_amount: Math.abs(c.total_amount) });
    } else {
      expenses.push({ ...c, total_amount: Math.abs(c.total_amount) });
    }
  });

  return { income, expenses };
}

const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ onCategorySelect }) => {
  const { palette } = useTheme();
  const { firstDay, lastDay } = useDateRange();

  const { data: results, error, isLoading } = useGetCategorySumsQuery({
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  });
  
  const result = categorizeItems(results) || {};

  const totalIncome = result.income.reduce((sum, item) => sum + item.total_amount, 0);
  const totalExpenses = result.expenses.reduce((sum, item) => sum + item.total_amount, 0);

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
        segments={result.income.map(item => ({
          value: (item.total_amount / (totalIncome > totalExpenses ? totalIncome : totalExpenses)) * 100,
          color: item.color,
          name: item.category,
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
        segments={result.expenses.map(item => ({
          value: (item.total_amount / (totalIncome > totalExpenses ? totalIncome : totalExpenses)) * 100,
          color: item.color,
          name: item.category,
        }))}
        height={18}
      />

      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 2, mb: 1 }} />

      {/* INCOME TABLE */}
      <SortableSpendingTable title="INCOME" items={result.income} totalAmount={totalIncome} onRowClick={onCategorySelect} />

      {/* EXPENSES TABLE */}
      <SortableSpendingTable title="EXPENSES" items={result.expenses} totalAmount={totalExpenses} onRowClick={onCategorySelect} />
    </DashboardBox>
  );
};

export default SpendingBreakdown;
