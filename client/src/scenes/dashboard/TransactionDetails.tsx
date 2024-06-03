import React from 'react';
import { Typography, Divider, useTheme, Box } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import SortableTransactionTable from './SortableTransactionTable';
import '@/styles.css'; // Import your CSS styles for transitions
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import { useGetTransactionsQuery } from '@/api';

interface Transaction {
  date_str: string;
  name_description: string;
  account: string;
  counterparty: string;
  category: string;
  debit_credit: string;
  amount: number;
  transaction_type: string;
  notifications: string;
}

interface TransactionDetailsProps {
  selectedCategory: string | null;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({selectedCategory }) => {
  const { palette } = useTheme();
  const { firstDay, lastDay } = useDateRange();
  
  const { data: results, error, isLoading } = useGetTransactionsQuery({
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  });

  let transactions: Transaction[] = results as unknown as Transaction[];

  const filteredTransactions = selectedCategory && transactions
    ? transactions.filter(transaction => transaction.category === selectedCategory)
    : [];

  return (
    <DashboardBox sx={{ mb: 1.5 }} className="content-box">
      <Typography variant="h3">Transaction Details</Typography>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />

      <Box>
        {selectedCategory ? (
          <Box className={`fade show`}>
            <SortableTransactionTable items={filteredTransactions} />
          </Box>
        ) : (
          <Box className={`fade hide`} sx={{ p: 2 }}>
            <Typography variant="body1">
              Please select a category from the Spending Breakdown income or expenses table to view the transactions.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Blank Box Transition */}
      
    </DashboardBox>
  );
};

export default TransactionDetails;
