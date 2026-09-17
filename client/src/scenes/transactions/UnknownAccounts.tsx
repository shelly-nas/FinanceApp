import React from 'react';
import { Box, Typography, Chip, Button, useTheme } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Link } from 'react-router-dom';
import DashboardBox from '@/components/DashboardBox';
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
  const { palette } = useTheme();
  const { data: unknown } = useGetUnknownAccountsQuery();

  if (!unknown || unknown.length === 0) return null;

  return (
    <DashboardBox sx={{ mb: 1.5, p: 1.5, textAlign: 'left' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <AccountBalanceIcon sx={{ color: palette.secondary[400] }} />
        <Typography variant="h3" sx={{ flexGrow: 1 }}>
          New accounts in this import
        </Typography>
        <Chip size="small" label={`${unknown.length} found`} />
      </Box>

      <Typography variant="body3" sx={{ display: 'block', mb: 1 }}>
        Give these a name and an opening balance so they show up in your balances
        and can be matched as transfers.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
        {unknown.map((account) => (
          <Chip
            key={account.details}
            size="small"
            variant="outlined"
            label={`${account.details} · ${account.transaction_count}×`}
            sx={{ fontFamily: 'monospace' }}
          />
        ))}
      </Box>

      <Button size="small" component={Link} to="/accounts">
        Set up accounts
      </Button>
    </DashboardBox>
  );
};

export default UnknownAccounts;
