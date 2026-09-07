import React, { useState } from 'react';
import {
  Box, Typography, Collapse, IconButton, Tooltip, Divider, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
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
  // colorPrimary, not colorSecondary: the latter is grey[100], all but
  // invisible against the panel background.
  const dividerColor = palette.cosmetics.colorPrimary;
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
    // The same DashboardBox the widgets use, rather than a hand-rolled copy of
    // its border and radius: one definition means the banner cannot drift out
    // of step with the panels below it. Only the text alignment is overridden,
    // since the box centres by default and these are label/value pairs.
    <DashboardBox sx={{ mb: 1.5, textAlign: 'left' }}>
      {/* The widgets carry a centred h3 with the actions at the right edge; the
          banner follows suit so the two read as the same kind of panel. */}
      <WidgetHeader
        title="Net Worth Today"
        action={
          <>
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
          </>
        }
      />

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3, flexWrap: 'wrap', px: 1 }}>
        <Typography variant="h2" className={blur} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(total)}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {TYPE_ORDER.filter((type) => grouped[type]?.length).map((type) => (
          <Box key={type} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              {type === 'Checking Account' ? 'Checking' : type === 'Savings Account' ? 'Savings' : 'Investments'}
            </Typography>
            <Typography variant="body1" className={blur} fontWeight="bold" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(typeTotal(type))}
            </Typography>
          </Box>
        ))}
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {/* borderColor, not the color prop: MUI's Divider draws its line as a
            border, so color leaves it invisible. */}
        <Divider sx={{ mt: 1, mb: 1, borderColor: dividerColor }} />
        {/* Wide enough that a long account name and its amount are not pushed
            against each other; the column gap keeps neighbouring pairs apart. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            columnGap: 4,
            rowGap: 0.5,
            px: 1,
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
    </DashboardBox>
  );
};

export default NetWorthBanner;
