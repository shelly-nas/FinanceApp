import React from 'react';
import { Grid, Box, Typography, useTheme, Divider } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import AccountsOverview from '@/components/AccountOverview';

const sampleCategories = [
  {
    name: 'Cash',
    items: [
      { name: "Penny's Checking", balance: 21371.92 }
    ]
  },
  {
    name: 'Investment',
    items: [
      { name: 'Fidelity Individual Brokerage', balance: 41211.80 }
    ]
  },
  {
    name: 'Credit',
    items: [
      { name: "Lenny's Amex Card", balance: 202.32 },
      { name: "Penny's Visa Card", balance: 450.84 }
    ]
  }
];

const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const spacing: number = palette.cosmetics.spacing;
  return (
    <Box>
      <Grid container justifyContent="space-between" columnSpacing={spacing}>
        {/* Left Grid */}
        <Grid item xs={12} md={4}>
          <AccountsOverview categories={sampleCategories} />
          {/* <DashboardBox sx={{ mt: spacing }}>
            <Typography mb={spacing} variant="h3">Account Overview</Typography>
            <Divider color={palette.cosmetics.color} orientation="horizontal" flexItem />  
            {/* Add content here */}
          {/* </DashboardBox> */}
          <DashboardBox sx={{ mt: spacing }}>
            <Typography mb={spacing} variant="h3">Period Summary</Typography>
            <Divider color={palette.cosmetics.color} orientation="horizontal" flexItem />
            {/* Add content here */}
          </DashboardBox>
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={6}>
          <DashboardBox sx={{ mt: spacing }}>
            <Typography mb={spacing} variant="h3">Spending Breakdown</Typography>
            <Divider color={palette.cosmetics.color} orientation="horizontal" flexItem />
            {/* Add content here */}
          </DashboardBox>
        </Grid>

        {/* Review Section */}
        <Grid item xs={12} md={2}>
          <DashboardBox sx={{ mt: spacing }}>
            <Typography variant="h3">Review Transactions</Typography>
            {/* Add content here */}
          </DashboardBox>
          <DashboardBox sx={{ mt: spacing }}>
            <Typography variant="h3">Review Recurring Items</Typography>
            {/* Add content here */}
          </DashboardBox>
          <DashboardBox sx={{ mt: spacing }}>
            <Typography variant="h3">Review Accounts</Typography>
            {/* Add content here */}
          </DashboardBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
