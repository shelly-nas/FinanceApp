import React, { useState } from 'react';
import {
  Typography, Divider, Box, List, ListItem, ListItemText, Collapse,
  useTheme, ListItemButton, Button, Tooltip,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardBox from '@/components/DashboardBox';
import { AccountBalance, useGetAccountOverviewQuery } from '@/api';
import { formatDate, useDateRange } from '@/scenes/dateRange/DateRangeContext';

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
 * Unlike the banner, this follows the month filter: with August selected it
 * answers "where did this stand at the end of August", so it lines up with the
 * income, expenses and breakdown beside it. The banner above stays on today, as
 * the fixed reference.
 */
const AccountsOverview: React.FC = () => {
  const { palette, typography } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState(false);
  const { lastDay } = useDateRange();

  const asOf = formatDate(lastDay);
  const { data: results } = useGetAccountOverviewQuery({ asOf });
  const categories = results ?? [];
  const groupedCategories = groupByAccountType(categories);

  const visibilityStyle = visible ? '' : 'blur-text';

  const handleToggle = (category: string) => {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const netWorth = categories.reduce((total, c) => total + parseFloat(c.current_balance), 0);

  // A month that has not finished yet has no meaningful "end of month" balance,
  // so say what the figure actually is.
  const isCurrentMonth = asOf >= formatDate(new Date());
  const asOfLabel = isCurrentMonth
    ? 'today'
    : lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h3">Account Overview</Typography>
          <Typography variant="body3" sx={{ opacity: 0.7 }}>
            as of {asOfLabel}
          </Typography>
        </Box>
        <Tooltip title={visible ? 'Hide amounts' : 'Show amounts'}>
          <Button
            sx={{
              m: 0.1,
              p: 0.1,
              minWidth: 0,
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              '&:hover': { backgroundColor: palette.action.hover },
            }}
            onClick={() => setVisible(!visible)}
          >
            {visible
              ? <VisibilityOffIcon sx={{ color: typography.h3.color, fontSize: 18 }} />
              : <VisibilityIcon sx={{ color: typography.h3.color, fontSize: 18 }} />}
          </Button>
        </Tooltip>
      </Box>

      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />
      <List sx={{ ml: -1.5 }}>
        {Object.keys(groupedCategories).map((categoryType) => (
          <div key={categoryType}>
            <ListItemButton onClick={() => handleToggle(categoryType)} sx={{ py: 0.5 }}>
              {open[categoryType] ? <ExpandLess /> : <ExpandMore />}
              <ListItemText
                primary={`${categoryType} (${groupedCategories[categoryType].length})`}
                primaryTypographyProps={{ variant: 'body2' }}
              />
              <Typography variant="body2" className={visibilityStyle}>
                {formatCurrency(
                  groupedCategories[categoryType].reduce((sum, item) => sum + parseFloat(item.current_balance), 0),
                )}
              </Typography>
            </ListItemButton>
            <Collapse in={open[categoryType]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {groupedCategories[categoryType].map((item) => (
                  <ListItem key={item.details ?? item.account_name} sx={{ pl: 3, py: 0 }}>
                    <ListItemText
                      primary={'└ ' + item.account_name}
                      primaryTypographyProps={{ variant: 'body3' }}
                    />
                    <Typography variant="body3" className={visibilityStyle}>
                      {formatCurrency(parseFloat(item.current_balance))}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr: 2, ml: 1, mt: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          Estd. Net Worth
        </Typography>
        <Typography variant="body1" className={visibilityStyle} fontWeight="bold">
          {formatCurrency(netWorth)}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default AccountsOverview;
