import React, { useState } from 'react';
import { IconButton, Tooltip, Typography } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import { AmountGroup, AmountGroups, TotalRow } from '@/components/AmountList';
import { AccountBalance, useGetAccountOverviewQuery } from '@/api';
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';
import '@/styles.css';

const groupByAccountType = (accounts: AccountBalance[]) =>
  accounts.reduce((acc, account) => {
    (acc[account.account_type] ||= []).push(account);
    return acc;
  }, {} as Record<string, AccountBalance[]>);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

/**
 * Balances at the end of the selected month.
 *
 * This follows the month filter: with August selected it answers "where did
 * this stand at the end of August", so it lines up with the income, expenses
 * and breakdown beside it.
 */
const AccountsOverview: React.FC = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState(false);
  const { lastDay } = useDateRange();

  const asOf = formatDate(lastDay);
  const { data: results } = useGetAccountOverviewQuery({ asOf });
  const accounts = results ?? [];
  const grouped = groupByAccountType(accounts);

  const blur = visible ? undefined : 'blur-text';

  const netWorth = accounts.reduce((total, c) => total + parseFloat(c.current_balance), 0);

  // A month that has not finished yet has no meaningful "end of month" balance,
  // so say what the figure actually is.
  const isCurrentMonth = asOf >= formatDate(new Date());
  const asOfLabel = isCurrentMonth
    ? 'today'
    : lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <DashboardBox>
      <WidgetHeader
        title="Accounts"
        subtitle={`Balances as of ${asOfLabel}`}
        action={
          <Tooltip title={visible ? 'Hide amounts' : 'Show amounts'}>
            <IconButton
              size="small"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'Hide amounts' : 'Show amounts'}
              aria-pressed={visible}
            >
              {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        }
      />
      <AmountGroups>
        {Object.keys(grouped).map((type) => (
          <AmountGroup
            key={type}
            label={`${type} (${grouped[type].length})`}
            amount={formatCurrency(grouped[type].reduce((sum, item) => sum + parseFloat(item.current_balance), 0))}
            lines={grouped[type].map((item) => ({
              key: item.details ?? item.account_name,
              label: item.account_name,
              amount: formatCurrency(parseFloat(item.current_balance)),
            }))}
            open={Boolean(open[type])}
            onToggle={() => setOpen((prev) => ({ ...prev, [type]: !prev[type] }))}
            amountClassName={blur}
          />
        ))}
      </AmountGroups>
      <TotalRow label="Estimated net worth" first>
        <Typography
          component="span"
          className={blur}
          sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatCurrency(netWorth)}
        </Typography>
      </TotalRow>
    </DashboardBox>
  );
};

export default AccountsOverview;
