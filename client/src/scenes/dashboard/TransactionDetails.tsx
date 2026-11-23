import React from 'react';
import { Typography, Button } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TransactionTable from '@/components/TransactionTable';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { useSearchTransactionsQuery } from '@/api';
import { useNavigate } from 'react-router-dom';

interface TransactionDetailsProps {
  selectedCategory: string | null;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ selectedCategory }) => {
  const { period, accounts } = useInsightsFilter();
  const navigate = useNavigate();

  // Filtered server-side rather than fetching the month and narrowing it here,
  // so the same query backs this panel and the transactions screen.
  const { data: result } = useSearchTransactionsQuery(
    {
      startDate: period.startDate,
      endDate: period.endDate,
      categories: selectedCategory ? [selectedCategory] : undefined,
      accounts,
      limit: 500,
    },
    { skip: !selectedCategory },
  );

  const transactions = result?.rows ?? [];

  // Hands the drill-down to the transactions screen with the same filters, so
  // editing continues where the user was rather than starting from scratch.
  const handleEditTransactions = () => {
    navigate('/transactions', {
      state: {
        presetCategory: selectedCategory,
        presetStart: period.startDate,
        presetEnd: period.endDate,
        presetAccounts: accounts,
      },
    });
  };

  return (
    <DashboardBox>
      <WidgetHeader
        title={selectedCategory ? `Transactions in ${selectedCategory}` : 'Transactions'}
        subtitle={
          selectedCategory
            ? `${transactions.length} in ${period.label}`
            : undefined
        }
        action={
          selectedCategory ? (
            <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={handleEditTransactions}>
              Edit in Transactions
            </Button>
          ) : undefined
        }
      />

      {selectedCategory ? (
        <TransactionTable rows={transactions} />
      ) : (
        <Typography variant="body2">
          Select a category in the spending breakdown to list its transactions here.
        </Typography>
      )}
    </DashboardBox>
  );
};

export default TransactionDetails;
