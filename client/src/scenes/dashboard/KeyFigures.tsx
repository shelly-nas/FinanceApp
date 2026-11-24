import React, { useState } from 'react';
import { Box, Button, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import DashboardBox from '@/components/DashboardBox';
import { useGetAccountOverviewQuery, useGetIncomeExpensesSumQuery } from '@/api';
import { formatDate } from '@/utils/monthRange';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import '@/styles.css';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

interface IncomeExpenseItem {
  category_type: string;
  income: number;
  expenses: number;
}

// Category types are stored in Dutch; the interface is English.
const TYPE_LABELS: Record<string, string> = { Vast: 'fixed', Variabel: 'variable' };

/** "€ 1.991,35 fixed · € 262,25 variable", largest first, zero parts left out. */
const splitByType = (items: IncomeExpenseItem[], key: 'income' | 'expenses') =>
  items
    .map((item) => ({ type: TYPE_LABELS[item.category_type] ?? item.category_type.toLowerCase(), amount: Number(item[key]) }))
    .filter((part) => part.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((part) => `${formatCurrency(part.amount)} ${part.type}`)
    .join(' · ');

/** One figure in the strip: label, value, one muted line of context. */
const Figure: React.FC<{ label: string; value: React.ReactNode; detail: React.ReactNode; action?: React.ReactNode }> = ({
  label, value, detail, action,
}) => (
  <Box sx={{ px: 4, py: 3, minWidth: 0 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 22 }}>
      <Typography variant="overline" component="h2">{label}</Typography>
      {action}
    </Box>
    <Box
      sx={{
        fontSize: 18,
        lineHeight: 1.35,
        color: 'text.primary',
        fontVariantNumeric: 'tabular-nums',
        '& .MuiTypography-root': { fontWeight: 'inherit' },
      }}
    >
      {value}
    </Box>
    <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>{detail}</Typography>
  </Box>
);

/**
 * The period's key figures as one compact strip: net worth at the end of the
 * period, what came in, what went out and what was left. One card instead of
 * four tiles, so the breakdown below starts higher. Four across on a wide
 * screen, two by two on a phone.
 */
const KeyFigures: React.FC = () => {
  const { period, accounts: selection, categories } = useInsightsFilter();
  const { lastDay } = period;
  const [visible, setVisible] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const asOf = period.endDate;
  const { data: accountData } = useGetAccountOverviewQuery({ asOf });
  const { data: periodData } = useGetIncomeExpensesSumQuery({
    startDate: period.startDate,
    endDate: period.endDate,
    accounts: selection,
    categories,
  });

  // Net worth and the per-account list cover the selected accounts only.
  const accounts = (accountData ?? []).filter((a) => !selection || selection.includes(a.details));
  const items = (periodData ?? []) as IncomeExpenseItem[];

  const netWorth = accounts.reduce((total, a) => total + parseFloat(a.current_balance), 0);
  const income = items.reduce((sum, item) => sum + Number(item.income), 0);
  const expenses = items.reduce((sum, item) => sum + Number(item.expenses), 0);
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  // A month that has not finished yet has no "end of month" balance yet, so
  // say what the figure actually is.
  const isCurrentMonth = asOf >= formatDate(new Date());
  const asOfLabel = isCurrentMonth
    ? 'today'
    : lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const blur = visible ? undefined : 'blur-text';

  return (
    <DashboardBox sx={{ p: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          // Hairlines between the figures; the strip reads as one card.
          '& > *': { borderColor: 'divider' },
          '& > *:not(:first-of-type)': { borderLeft: { md: 1 } },
          '& > *:nth-of-type(even)': { borderLeft: { xs: 1 } },
          '& > *:nth-of-type(n+3)': { borderTop: { xs: 1, md: 0 } },
        }}
      >
        <Figure
          label="Net worth"
          value={<span className={blur}>{formatCurrency(netWorth)}</span>}
          detail={
            <>
              As of {asOfLabel} ·{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAccounts(!showAccounts)}
                aria-expanded={showAccounts}
                endIcon={<ExpandMoreIcon sx={{ transition: 'transform .15s ease', transform: showAccounts ? 'rotate(180deg)' : 'none' }} />}
                sx={{ height: 20, px: 0.5, minWidth: 0, fontSize: 12, verticalAlign: 'baseline', '& .MuiButton-endIcon': { ml: 0 } }}
              >
                per account
              </Button>
            </>
          }
          action={
            <Tooltip title={visible ? 'Hide amounts' : 'Show amounts'}>
              <IconButton
                size="small"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Hide amounts' : 'Show amounts'}
                aria-pressed={visible}
                sx={{ m: -1 }}
              >
                {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          }
        />
        <Figure
          label="Income"
          value={<Typography component="span" variant="credit" sx={{ fontSize: 'inherit' }}>+{formatCurrency(income)}</Typography>}
          detail={splitByType(items, 'income') || 'Nothing came in this period'}
        />
        <Figure
          label="Expenses"
          value={<Typography component="span" variant="debit" sx={{ fontSize: 'inherit' }}>−{formatCurrency(expenses)}</Typography>}
          detail={splitByType(items, 'expenses') || 'Nothing went out this period'}
        />
        <Figure
          label="Net income"
          value={
            <Typography component="span" variant={net < 0 ? 'debit' : 'credit'} sx={{ fontSize: 'inherit' }}>
              {net > 0 ? '+' : ''}{formatCurrency(net)}
            </Typography>
          }
          detail={income > 0 ? `${savingsRate.toFixed(1)}% of income saved` : 'No income this period'}
        />
      </Box>

      <Collapse in={showAccounts} unmountOnExit>
        <Box
          component="ul"
          sx={{
            m: 0, px: 4, py: 3, borderTop: 1, borderColor: 'divider',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px 32px',
          }}
        >
          {accounts.map((account) => (
            <Box
              component="li"
              key={account.details ?? account.account_name}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 4, listStyle: 'none' }}
            >
              <Typography variant="body2" sx={{ minWidth: 0 }}>{account.account_name}</Typography>
              <Typography
                variant="body2"
                component="span"
                className={blur}
                sx={{ color: 'text.primary', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
              >
                {formatCurrency(parseFloat(account.current_balance))}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </DashboardBox>
  );
};

export default KeyFigures;
