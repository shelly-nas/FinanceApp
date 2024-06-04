import React, { useState } from "react";
import { Grid, Box, Typography, useTheme } from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import AccountsOverview from "@/scenes/dashboard/AccountOverview";
import PeriodSummary from "@/scenes/dashboard/PeriodSummary";
import SpendingBreakdown from "@/scenes/dashboard/SpendingBreakdown";
import TransactionDetails from "@/scenes/dashboard/TransactionDetails";
import UploadButton from "@/scenes/dashboard/UploadButton";
import DateRange from '@/scenes/dateRange';
import ReviewButton from "@/scenes/dashboard/ReviewTransaction";


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

const Dashboard: React.FC = () => {
  const { palette } = useTheme();
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
        <Grid item xs={12} md={4}>
          <AccountsOverview categories={sampleCategories} />
          <PeriodSummary />
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={6}>
          <SpendingBreakdown onCategorySelect={handleCategorySelect} />
          <TransactionDetails selectedCategory={selectedCategory}/>
        </Grid>

        {/* Review Section */}
        <Grid item xs={12} md={2}>
          <UploadButton />
          <ReviewButton />
          <DashboardBox sx={{ mb: spacing }}>
            <Typography variant="h3">Review Transactions</Typography>
            {/* Add content here */}
          </DashboardBox>
          <DashboardBox sx={{ mb: spacing }}>
            <Typography variant="h3">Review Recurring Items</Typography>
            {/* Add content here */}
          </DashboardBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
