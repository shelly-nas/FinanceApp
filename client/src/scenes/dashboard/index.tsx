import React, { useState } from "react";
import { Grid, Box } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import AccountsOverview from "@/scenes/dashboard/AccountOverview";
import PeriodSummary from "@/scenes/dashboard/PeriodSummary";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import DateRange from '@/scenes/dateRange';
import ImportDialogs from "@/scenes/dashboard/ImportDialogs";

const Dashboard: React.FC = () => {
  const spacing: number = 1.5;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // The action menu in the header opens these by navigating with ?import=...,
  // which keeps the dialogs here, where their data lives, without a third
  // column of buttons dressed up as dashboard panels.
  const [searchParams, setSearchParams] = useSearchParams();
  const importing = searchParams.get('import');

  const closeImport = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('import');
    setSearchParams(params, { replace: true });
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <Box>
      <DateRange />
      <Grid container justifyContent="space-between" columnSpacing={spacing}>
        {/* Left Grid */}
        <Grid item xs={12} md={3.5}>
          <AccountsOverview />
          <PeriodSummary />
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={8.5}>
          <SpendingBreakdown onCategorySelect={handleCategorySelect} />
          <TransactionDetails selectedCategory={selectedCategory}/>
        </Grid>
      </Grid>

      <ImportDialogs opened={importing} onClose={closeImport} />
    </Box>
  );
};

export default Dashboard;
