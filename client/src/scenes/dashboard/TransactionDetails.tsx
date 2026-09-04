import React from 'react';
import { Typography, useTheme, Box, IconButton, Tooltip } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import EditIcon from '@mui/icons-material/Edit';
import TransactionTable from '@/components/TransactionTable';
import '@/styles.css'; // Import your CSS styles for transitions
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import { useSearchTransactionsQuery } from '@/api';
import { useNavigate } from 'react-router-dom';

interface TransactionDetailsProps {
  selectedCategory: string | null;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ selectedCategory }) => {
  const { typography } = useTheme();
  const { firstDay, lastDay } = useDateRange();
  const navigate = useNavigate();

  // Filtered server-side rather than fetching the month and narrowing it here,
  // so the same query backs this panel and the transactions screen.
  const { data: result } = useSearchTransactionsQuery(
    {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay),
      categories: selectedCategory ? [selectedCategory] : undefined,
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
        presetStart: formatDate(firstDay),
        presetEnd: formatDate(lastDay),
      },
    });
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }} className="content-box">
      <WidgetHeader
        title="Transaction Details"
        action={
          selectedCategory ? (
            <Tooltip title="Open these in the transactions screen">
              <IconButton size="small" onClick={handleEditTransactions}>
                <EditIcon sx={{ color: typography.h3.color, fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      />

      <Box>
        {selectedCategory ? (
          <Box className="fade show">
            <TransactionTable rows={transactions} />
          </Box>
        ) : (
          <Box className="fade hide" sx={{ p: 2 }}>
            <Typography variant="body1">
              Please select a category from the Spending Breakdown income or expenses table to view the transactions.
            </Typography>
          </Box>
        )}
      </Box>
    </DashboardBox>
  );
};

export default TransactionDetails;
