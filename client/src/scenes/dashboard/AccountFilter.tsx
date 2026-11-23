import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import type { AccountBalance } from '@/api';
import { groupAccounts } from '@/scenes/dashboard/accountSelection';
import { ACCOUNT_TYPE_LABELS } from '@/scenes/reports/chartTheme';

interface Props {
  accounts: AccountBalance[];
  /** Selected account identifiers; empty means all accounts. */
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Which accounts the dashboard covers: every account one click away, grouped
 * by type. Nothing selected means all of them.
 */
const AccountFilter: React.FC<Props> = ({ accounts, selected, onChange }) => {
  if (accounts.length < 2) return null;

  const toggle = (details: string) =>
    onChange(selected.includes(details) ? selected.filter((d) => d !== details) : [...selected, details]);

  return (
    <Box
      role="group"
      aria-label="Accounts"
      sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}
    >
      <Button
        size="small"
        variant={selected.length === 0 ? 'contained' : 'outlined'}
        onClick={() => onChange([])}
      >
        All accounts
      </Button>
      {groupAccounts(accounts).map((group) => (
        <Box key={group.type} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="overline" component="span">
            {ACCOUNT_TYPE_LABELS[group.type] ?? group.type}
          </Typography>
          {group.accounts.map((account) => {
            const on = selected.includes(account.details);
            return (
              <Chip
                key={account.details}
                size="small"
                label={account.account_name}
                icon={on ? <CheckIcon /> : undefined}
                color={on ? 'primary' : 'default'}
                variant={on ? 'filled' : 'outlined'}
                onClick={() => toggle(account.details)}
                aria-pressed={on}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default AccountFilter;
