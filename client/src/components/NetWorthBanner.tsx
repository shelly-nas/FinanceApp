import React, { useState } from 'react';
import {
  Box, Typography, Collapse, IconButton, Tooltip, Divider, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AccountBalance, useGetAccountOverviewQuery } from '@/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

const TYPE_ORDER = ['Checking Account', 'Savings Account', 'Investments'];

const groupByType = (accounts: AccountBalance[]) =>
  accounts.reduce((acc, account) => {
    (acc[account.account_type] ||= []).push(account);
    return acc;
  }, {} as Record<string, AccountBalance[]>);

/**
 * Net worth as it stands right now.
 *
 * Deliberately outside the month filter: this is the fixed reference point the
 * rest of the page is read against. The panel below it answers "what did this
 * month do", and the widget there follows the filter - two different questions
 * that used to sit side by side looking like one, which is why moving a month
 * back appeared to leave the balances broken.
 */
const NetWorthBanner: React.FC = () => {
  const { palette } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  // No asOf: always today, whichever month the dashboard is filtered to.
  const { data: accounts } = useGetAccountOverviewQuery();
  const rows = accounts ?? [];

  const grouped = groupByType(rows);
  const total = rows.reduce((sum, a) => sum + Number(a.current_balance), 0);
  const typeTotal = (type: string) =>
    (grouped[type] ?? []).reduce((sum, a) => sum + Number(a.current_balance), 0);

  const blur = visible ? undefined : 'blur-text';

  return (
    <Box
      sx={{
        border: `${palette.cosmetics.width} ${palette.cosmetics.borderStyle} ${palette.cosmetics.colorPrimary}`,
        borderRadius: palette.cosmetics.radius,
        backgroundColor: palette.background.light,
        px: 2,
        py: 1.25,
        mb: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography
            variant="body3"
            sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}
          >
            Net worth today
          </Typography>
          <Typography variant="h2" className={blur} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </Typography>
        </Box>

        {TYPE_ORDER.filter((type) => grouped[type]?.length).map((type) => (
          <Box key={type}>
            <Typography variant="body3" sx={{ display: 'block', opacity: 0.7 }}>
              {type === 'Checking Account' ? 'Checking' : type === 'Savings Account' ? 'Savings' : 'Investments'}
            </Typography>
            <Typography variant="body1" className={blur} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(typeTotal(type))}
            </Typography>
          </Box>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={visible ? 'Hide amounts' : 'Show amounts'}>
          <IconButton size="small" onClick={() => setVisible((v) => !v)}>
            {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={expanded ? 'Hide accounts' : 'Show accounts'}>
          <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider sx={{ my: 1 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 0.5,
          }}
        >
          {TYPE_ORDER.filter((type) => grouped[type]?.length).flatMap((type) =>
            grouped[type].map((account) => (
              <Box
                key={account.details}
                sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
              >
                <Typography variant="body3">{account.account_name}</Typography>
                <Typography
                  variant="body3"
                  className={blur}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatCurrency(Number(account.current_balance))}
                </Typography>
              </Box>
            )),
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default NetWorthBanner;
