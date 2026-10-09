import React from 'react';
import { Box, Chip, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import { useGetUnknownAccountsQuery } from '@/api';

/**
 * Accounts an import mentioned that the app does not know yet.
 *
 * Their transactions import and count towards the summaries, but with no entry
 * in the accounts table they have no name, no opening balance, and cannot be
 * recognised as the other half of a transfer - so a balance sits at zero and
 * money moved between two of your own accounts keeps counting as income and
 * spending. This is a prompt, not a blocker: naming them happens on the
 * accounts screen.
 */
const UnknownAccounts: React.FC = () => {
  const { data: unknown } = useGetUnknownAccountsQuery();

  if (!unknown || unknown.length === 0) return null;

  return (
    <DashboardBox>
      <WidgetHeader
        title="New accounts in this import"
        subtitle="Give these a name and an opening balance so they show up in your balances and can be matched as transfers."
        action={
          <Button variant="outlined" component={Link} to="/accounts">
            Set up accounts
          </Button>
        }
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {unknown.map((account) => (
          <Chip
            key={account.details}
            size="small"
            variant="outlined"
            label={`${account.details} · ${account.transaction_count}×`}
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          />
        ))}
      </Box>
    </DashboardBox>
  );
};

export default UnknownAccounts;
