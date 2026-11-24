import React from 'react';
import { Typography, Button } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TransactionTable from '@/components/TransactionTable';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { useSelectionLabel } from '@/scenes/insights/useSelectionLabel';
import { useSearchTransactionsQuery } from '@/api';
import { useNavigate } from 'react-router-dom';

/** How many rows the panel shows; the rest is one click away in Transactions. */
const LIMIT = 25;

/**
 * The transactions behind the figures above: the same period, accounts and
 * categories, newest first. "Open in Transactions" carries the selection over
 * to Manage, where every row can be corrected.
 */
const TransactionDetails: React.FC = () => {
  const { period, accounts, categories } = useInsightsFilter();
  const label = useSelectionLabel('period');
  const navigate = useNavigate();

  // Filtered server-side, with the same rule for transfers as the figures, so
  // the list adds up to them.
  const { data: result } = useSearchTransactionsQuery({
    startDate: period.startDate,
    endDate: period.endDate,
    categories,
    accounts,
    limit: LIMIT,
  });

  const transactions = result?.rows ?? [];
  const total = result?.total ?? 0;

  const openInTransactions = () => {
    navigate('/transactions?tab=all', {
      state: {
        presetCategories: categories,
        presetStart: period.startDate,
        presetEnd: period.endDate,
        presetAccounts: accounts,
        presetLabel: label,
      },
    });
  };

  return (
    <DashboardBox>
      <WidgetHeader
        title="Transactions in this selection"
        subtitle={total > LIMIT ? `Newest ${LIMIT} of ${total}` : `${total} in ${period.label}`}
        action={
          <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} onClick={openInTransactions}>
            Open in Transactions
          </Button>
        }
      />

      {transactions.length > 0 ? (
        <TransactionTable rows={transactions} />
      ) : (
        <Typography variant="body2">No transactions in this selection.</Typography>
      )}
    </DashboardBox>
  );
};

export default TransactionDetails;
