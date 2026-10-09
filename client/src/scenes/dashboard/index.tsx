import React, { useState } from "react";
import { Grid, Stack } from "@mui/material";
import AccountsOverview from "@/scenes/dashboard/AccountOverview";
import PeriodSummary from "@/scenes/dashboard/PeriodSummary";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import DateRange from '@/scenes/dateRange';
import { useDateRange } from "@/scenes/dateRange/DateRangeContext";
import PageHeader from "@/components/PageHeader";
import ImportActions from "@/scenes/layout/ImportActions";

const Dashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { firstDay } = useDateRange();
  const month = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Balances, income and spending for ${month}`}
        actions={
          <>
            <DateRange />
            <ImportActions withInvestments />
          </>
        }
      />
      <Grid container spacing={6}>
        <Grid item xs={12} lg={4} xl={3.5}>
          <Stack spacing={6} useFlexGap>
            <AccountsOverview />
            <PeriodSummary />
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8} xl={8.5}>
          <Stack spacing={6} useFlexGap>
            <SpendingBreakdown onCategorySelect={handleCategorySelect} />
            <TransactionDetails selectedCategory={selectedCategory} />
          </Stack>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
