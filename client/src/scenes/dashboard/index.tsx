import React, { useState } from "react";
import { Grid, Box, Typography, useTheme, Divider } from "@mui/material";
import DashboardBox from "@/components/DashboardBox";
import AccountsOverview from "@/components/AccountOverview";
import PeriodSummary from "@/components/PeriodSummary";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import TransactionDetails from "@/components/TransactionDetails";

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

const income = [
  { name: "Variable Income", amount: 100.00, color: "#0ebfa0" },
  { name: "Static Income", amount: 2000.00, color: "#13d1ae" }
];

const expenses = [
  { name: 'Home, Auto', amount: 1013.99, color: "#80deea" }, // Bright teal
  { name: 'Food', amount: 144.40, color: '#ffcc80' }, // Bright orange
  { name: 'Restaurants', amount: 87.21, color: '#4db6ac' }, // Bright cyan
  { name: 'Groceries', amount: 36.63, color: '#f06292' }, // Bright pink
  { name: 'Food Delivery', amount: 16.88, color: '#ba68c8' }, // Bright violet
  { name: 'Coffee Shops', amount: 3.68, color: '#ffd54f' }, // Bright amber
  { name: 'Shopping', amount: 138.36, color: '#ff8a80' }, // Bright red
  { name: 'Alcohol, Bars', amount: 11.64, color: '#ce93d8' }, // Bright purple
  { name: 'Ridesharing', amount: 6.51, color: '#ffab91' } // Bright peach
];

export const transactions = [
  // Variable Income
  {
    date_str: '2023-01-01',
    name_description: 'Freelance Work',
    account: 'Checking Account',
    counterparty: 'Client A',
    category: 'Variable Income',
    debit_credit: 'credit',
    amount: 100.00,
    transaction_type: 'income',
    notifications: 'None'
  },
  {
    date_str: '2023-01-10',
    name_description: 'Consulting Fee',
    account: 'Checking Account',
    counterparty: 'Client B',
    category: 'Variable Income',
    debit_credit: 'credit',
    amount: 200.00,
    transaction_type: 'income',
    notifications: 'None'
  },
  // Static Income
  {
    date_str: '2023-01-02',
    name_description: 'Salary',
    account: 'Checking Account',
    counterparty: 'Employer Inc.',
    category: 'Static Income',
    debit_credit: 'credit',
    amount: 2000.00,
    transaction_type: 'income',
    notifications: 'Received'
  },
  {
    date_str: '2023-01-15',
    name_description: 'Bonus',
    account: 'Checking Account',
    counterparty: 'Employer Inc.',
    category: 'Static Income',
    debit_credit: 'credit',
    amount: 500.00,
    transaction_type: 'income',
    notifications: 'Received'
  },
  // Home, Auto
  {
    date_str: '2023-01-03',
    name_description: 'Mortgage Payment',
    account: 'Checking Account',
    counterparty: 'Bank',
    category: 'Home, Auto',
    debit_credit: 'debit',
    amount: 1013.99,
    transaction_type: 'bill payment',
    notifications: 'Due next month'
  },
  {
    date_str: '2023-01-18',
    name_description: 'Car Insurance',
    account: 'Checking Account',
    counterparty: 'AutoInsure',
    category: 'Home, Auto',
    debit_credit: 'debit',
    amount: 200.00,
    transaction_type: 'insurance',
    notifications: 'Due next month'
  },
  // Groceries
  {
    date_str: '2023-01-04',
    name_description: 'Grocery Store',
    account: 'Checking Account',
    counterparty: 'SuperMart',
    category: 'Groceries',
    debit_credit: 'debit',
    amount: 36.63,
    transaction_type: 'purchase',
    notifications: 'None'
  },
  {
    date_str: '2023-01-12',
    name_description: 'Supermarket',
    account: 'Checking Account',
    counterparty: 'MegaMart',
    category: 'Groceries',
    debit_credit: 'debit',
    amount: 45.00,
    transaction_type: 'purchase',
    notifications: 'None'
  },
  // Restaurants
  {
    date_str: '2023-01-05',
    name_description: 'Restaurant',
    account: 'Credit Card',
    counterparty: 'DineWell',
    category: 'Restaurants',
    debit_credit: 'debit',
    amount: 87.21,
    transaction_type: 'dining',
    notifications: 'None'
  },
  {
    date_str: '2023-01-20',
    name_description: 'Dinner',
    account: 'Credit Card',
    counterparty: 'FineDine',
    category: 'Restaurants',
    debit_credit: 'debit',
    amount: 60.00,
    transaction_type: 'dining',
    notifications: 'None'
  },
  // Food Delivery
  {
    date_str: '2023-01-06',
    name_description: 'Food Delivery',
    account: 'Credit Card',
    counterparty: 'FoodExpress',
    category: 'Food Delivery',
    debit_credit: 'debit',
    amount: 16.88,
    transaction_type: 'purchase',
    notifications: 'Delivered'
  },
  {
    date_str: '2023-01-22',
    name_description: 'Takeout',
    account: 'Credit Card',
    counterparty: 'QuickBites',
    category: 'Food Delivery',
    debit_credit: 'debit',
    amount: 25.00,
    transaction_type: 'purchase',
    notifications: 'Delivered'
  },
  // Coffee Shops
  {
    date_str: '2023-01-07',
    name_description: 'Coffee Shop',
    account: 'Credit Card',
    counterparty: 'CoffeeHouse',
    category: 'Coffee Shops',
    debit_credit: 'debit',
    amount: 3.68,
    transaction_type: 'purchase',
    notifications: 'None'
  },
  {
    date_str: '2023-01-25',
    name_description: 'Cafe',
    account: 'Credit Card',
    counterparty: 'CafeBrew',
    category: 'Coffee Shops',
    debit_credit: 'debit',
    amount: 5.00,
    transaction_type: 'purchase',
    notifications: 'None'
  },
  // Shopping
  {
    date_str: '2023-01-08',
    name_description: 'Online Shopping',
    account: 'Credit Card',
    counterparty: 'ShopNow',
    category: 'Shopping',
    debit_credit: 'debit',
    amount: 138.36,
    transaction_type: 'purchase',
    notifications: 'Shipped'
  },
  {
    date_str: '2023-01-26',
    name_description: 'Retail Store',
    account: 'Credit Card',
    counterparty: 'BuyMore',
    category: 'Shopping',
    debit_credit: 'debit',
    amount: 75.00,
    transaction_type: 'purchase',
    notifications: 'Shipped'
  },
  // Alcohol, Bars
  {
    date_str: '2023-01-09',
    name_description: 'Bar Visit',
    account: 'Credit Card',
    counterparty: 'The Pub',
    category: 'Alcohol, Bars',
    debit_credit: 'debit',
    amount: 11.64,
    transaction_type: 'dining',
    notifications: 'None'
  },
  {
    date_str: '2023-01-27',
    name_description: 'Night Out',
    account: 'Credit Card',
    counterparty: 'Bar & Grill',
    category: 'Alcohol, Bars',
    debit_credit: 'debit',
    amount: 30.00,
    transaction_type: 'dining',
    notifications: 'None'
  },
  // Ridesharing
  {
    date_str: '2023-01-10',
    name_description: 'Uber Ride',
    account: 'Credit Card',
    counterparty: 'Uber',
    category: 'Ridesharing',
    debit_credit: 'debit',
    amount: 6.51,
    transaction_type: 'transport',
    notifications: 'Completed'
  },
  {
    date_str: '2023-01-28',
    name_description: 'Lyft Ride',
    account: 'Credit Card',
    counterparty: 'Lyft',
    category: 'Ridesharing',
    debit_credit: 'debit',
    amount: 8.00,
    transaction_type: 'transport',
    notifications: 'Completed'
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
      <Grid container justifyContent="space-between" columnSpacing={spacing}>
        {/* Left Grid */}
        <Grid item xs={12} md={4}>
          <AccountsOverview categories={sampleCategories} />
          <PeriodSummary incomeItems={incomeItems} expenseItems={expenseItems} />
        </Grid>

        {/* Spending Breakdown */}
        <Grid item xs={12} md={6}>
          <SpendingBreakdown income={income} expenses={expenses} onCategorySelect={handleCategorySelect} />
          <TransactionDetails transactions={transactions} selectedCategory={selectedCategory}/>
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
