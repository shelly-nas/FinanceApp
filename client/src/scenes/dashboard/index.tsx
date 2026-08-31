import React, { useState } from "react";
import { Grid, Box } from "@mui/material";
import AccountsOverview from "@/scenes/dashboard/AccountOverview";
import PeriodSummary from "@/scenes/dashboard/PeriodSummary";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import DateRange from '@/scenes/dateRange';
import ReviewButton from "@/scenes/dashboard/ReviewTransaction";
import AddTransactionsButton from "@/scenes/dashboard/AddTransactions";
import AddInvestmentsButton from "@/scenes/dashboard/AddInvestments";

const Dashboard: React.FC = () => {
  const spacing: number = 1.5;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <Box>
      <DateRange />
      <Grid container justifyContent="space-between" columnSpacing={spacing}>
        {/* Left Grid */}
        <Grid item xs={12} md={3}>
          <AccountsOverview />
          <PeriodSummary />
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={7.5}>
          <SpendingBreakdown onCategorySelect={handleCategorySelect} />
          <TransactionDetails selectedCategory={selectedCategory}/>
        </Grid>

        {/* Review Section */}
        <Grid item xs={12} md={1.5}>
          <AddTransactionsButton />
          <ReviewButton />
          <AddInvestmentsButton />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
