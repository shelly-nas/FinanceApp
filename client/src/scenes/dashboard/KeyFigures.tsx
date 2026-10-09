import React, { useState } from 'react';
import { Box, Button, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import StatTile from '@/components/StatTile';
import { useGetAccountOverviewQuery, useGetIncomeExpensesSumQuery } from '@/api';
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
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

/**
 * The month's headline figures in one row: net worth at the end of the month,
 * what came in, what went out and what was left. They used to be two cards in
 * a side column; as tiles they read first and give the tables below the full
 * width.
 */
const KeyFigures: React.FC = () => {
  const { firstDay, lastDay } = useDateRange();
  const [visible, setVisible] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  const asOf = formatDate(lastDay);
  const { data: accountData } = useGetAccountOverviewQuery({ asOf });
  const { data: periodData } = useGetIncomeExpensesSumQuery({
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
  });

  const accounts = accountData ?? [];
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
    <Box
      sx={{
        display: 'grid',
        // Four across on a wide screen, two on a tablet, one on a phone.
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        alignItems: 'stretch',
        gap: 6,
      }}
    >
      <StatTile
        label="Net worth"
        value={<span className={blur}>{formatCurrency(netWorth)}</span>}
        detail={`Balances as of ${asOfLabel}`}
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
      >
        <Button
          variant="text"
          size="small"
          onClick={() => setShowAccounts(!showAccounts)}
          aria-expanded={showAccounts}
          endIcon={
            <ExpandMoreIcon sx={{ transition: 'transform .15s ease', transform: showAccounts ? 'rotate(180deg)' : 'none' }} />
          }
          sx={{ alignSelf: 'flex-start', ml: -3 }}
        >
          Per account
        </Button>
        <Collapse in={showAccounts} unmountOnExit>
          <Box component="ul" sx={{ m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
      </StatTile>

      <StatTile
        label="Income"
        value={<Typography component="span" variant="credit" sx={{ fontSize: 'inherit' }}>+{formatCurrency(income)}</Typography>}
        detail={splitByType(items, 'income') || 'Nothing came in this month'}
      />

      <StatTile
        label="Expenses"
        value={<Typography component="span" variant="debit" sx={{ fontSize: 'inherit' }}>−{formatCurrency(expenses)}</Typography>}
        detail={splitByType(items, 'expenses') || 'Nothing went out this month'}
      />

      <StatTile
        label="Net income"
        value={
          <Typography component="span" variant={net < 0 ? 'debit' : 'credit'} sx={{ fontSize: 'inherit' }}>
            {net > 0 ? '+' : ''}{formatCurrency(net)}
          </Typography>
        }
        detail={income > 0 ? `${savingsRate.toFixed(1)}% of income saved` : 'No income this month'}
      />
    </Box>
  );
};

export default KeyFigures;
