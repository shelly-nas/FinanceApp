import React from 'react';
import { Typography, Divider, useTheme, Box, Button } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import EditIcon from '@mui/icons-material/Edit';
import SortableTransactionTable from './SortableTransactionTable';
import '@/styles.css'; // Import your CSS styles for transitions
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import { useGetTransactionsQuery } from '@/api';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: number
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

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ selectedCategory }) => {
  const { palette, typography } = useTheme();
  const { firstDay, lastDay } = useDateRange();
  const navigate = useNavigate();
  
  const { data: results } = useGetTransactionsQuery({
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  });

  let transactions: Transaction[] = results as unknown as Transaction[];

  const filteredTransactions = selectedCategory && transactions
    ? transactions.filter(transaction => transaction.category === selectedCategory)
    : [];

  const handleEditTransactions = async () => {
    const ids: number[] = filteredTransactions.map(item => item.id);;
    navigate('/review-transactions', { state: { transactionIds: JSON.stringify(ids) } });
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }} className="content-box">
      <Box sx={{         
        display: 'flex',
        alignItems: 'center',
        position: 'relative',             
      }}>
        <Box sx={{
          textAlign: 'center',
          width: '100%',
        }}>
          <Typography variant="h3">
          Transaction Details
          </Typography>
        </Box>
        <Button sx={{ 
          m: 0.1, 
          p: 0.1, 
          minWidth: 0, 
          position: 'absolute', 
          right: 0, // Align to the right inside the relative parent
          top: '50%', // Center vertically with respect to the parent box
          transform: 'translateY(-50%)', // Adjust the button's center to the middle
          '&:hover': {
            backgroundColor: palette.action.hover, // Hover background color, change as needed
          },
        }} 
        onClick={handleEditTransactions}
        >
          {selectedCategory ? (
            <EditIcon sx={{ color: typography.h3.color, fontSize: 18 }} />
          ) : (
            <div/>
          )}
        </Button>
      </Box>
      {/* <Typography variant="h3">Transaction Details</Typography> */}
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
