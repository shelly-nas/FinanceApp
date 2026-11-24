import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import MultiColorProgress from '@/components/MultiColorProgress';
import SortableSpendingTable from './SortableSpendingTable';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { useGetCategorySumsQuery } from '@/api';

export interface CategorySums {
  category: string;
  total_amount: number;
  color: string;
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

const SpendingBreakdown: React.FC = () => {
  const { period, accounts, categories, filter, toggleCategory } = useInsightsFilter();

  const { data: results } = useGetCategorySumsQuery({
    startDate: period.startDate,
    endDate: period.endDate,
    accounts,
    categories,
  });


  const result = categorizeItems(results) || {};

  const totalIncome = result.income.reduce((sum, item) => sum + item.total_amount, 0);
  const totalExpenses = result.expenses.reduce((sum, item) => sum + item.total_amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Both bars share one scale, so the longer side is visibly longer.
  const scale = Math.max(totalIncome, totalExpenses) || 1;


  return (
    <DashboardBox>
      <WidgetHeader
        title="Spending breakdown"
        subtitle="Click a category to filter everything on it"
      />

      <Stack spacing={4} useFlexGap sx={{ mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
            <Typography variant="overline">Income</Typography>
            <Typography variant="credit">+{formatCurrency(totalIncome)}</Typography>
          </Box>
          <MultiColorProgress
            segments={result.income.map(item => ({
              value: (item.total_amount / scale) * 100,
              color: item.color,
              name: item.category,
            }))}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
            <Typography variant="overline">Expenses</Typography>
            <Typography variant="debit">−{formatCurrency(totalExpenses)}</Typography>
          </Box>
          <MultiColorProgress
            segments={result.expenses.map(item => ({
              value: (item.total_amount / scale) * 100,
              color: item.color,
              name: item.category,
            }))}
          />
        </Box>
      </Stack>

      <Stack spacing={4} useFlexGap>
        <SortableSpendingTable
          title="Income"
          items={result.income}
          totalAmount={totalIncome}
          onRowClick={toggleCategory}
          selectedCategories={filter.categories}
        />
        <SortableSpendingTable
          title="Expenses"
          items={result.expenses}
          totalAmount={totalExpenses}
          onRowClick={toggleCategory}
          selectedCategories={filter.categories}
        />
      </Stack>
    </DashboardBox>
  );
};

export default SpendingBreakdown;
