import React, { useState } from "react";
import { Grid, Box, Typography, useTheme, Divider } from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import AccountsOverview from "@/components/AccountOverview";
import PeriodSummary from "@/components/PeriodSummary";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import TransactionDetails from "@/components/TransactionDetails";
import { useGetTransactionsQuery } from "@/api";
import { useDateRange, formatDate } from '@/components/DateRangeContext';

const sampleCategories = [
  {
    name: "Cash",
    items: [
      { name: "Penny's Checking", balance: 21371.92 }
    ]
  },
  {
    name: "Investment",
    items: [
      { name: "Fidelity Individual Brokerage", balance: 41211.80 }
    ]
  },
  {
    name: "Credit",
    items: [
      { name: "Lenny's Amex Card", balance: 202.32 },
      { name: "Penny's Visa Card", balance: 450.84 }
    ]
  }
];

const incomeItems = [
  { name: "Recurring Income", amount: 4000.00 },
  { name: "Other Income", amount: 0.00, info: "Includes freelance work and bonuses" }
];

const expenseItems = [
  { name: "Recurring Expenses", amount: 995.00 },
  { name: "Other Expenses", amount: 319.90, info: "Unexpected costs and miscellaneous" }
];

const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = 1.5;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prevCategory => prevCategory === category ? null : category);
  };

  return (
    <Box>
      <Grid container justifyContent="space-between" columnSpacing={spacing}>
        {/* Left Grid */}
        <Grid item xs={12} md={4}>
          <AccountsOverview categories={sampleCategories} />
          <PeriodSummary incomeItems={incomeItems} expenseItems={expenseItems} />
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={6}>
          <SpendingBreakdown onCategorySelect={handleCategorySelect} />
          <TransactionDetails selectedCategory={selectedCategory}/>
        </Grid>

        {/* Review Section */}
        <Grid item xs={12} md={2}>
          <DashboardBox sx={{ mb: spacing }}>
            <Typography variant="h3">Review Transactions</Typography>
            {/* Add content here */}
          </DashboardBox>
          <DashboardBox sx={{ mb: spacing }}>
            <Typography variant="h3">Review Recurring Items</Typography>
            {/* Add content here */}
          </DashboardBox>
          <DashboardBox sx={{ mb: spacing }}>
            <Typography variant="h3">Review Accounts</Typography>
            {/* Add content here */}
          </DashboardBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
