import React from 'react';
import { Typography, Divider, Box, List, ListItem, ListItemText, Collapse, useTheme, ListItemButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import DashboardBox from '@/components/DashboardBox';
import { useGetAccountOverviewQuery } from '@/api';

interface AccountCategory {
  account_type: string;
  account_name: string;
  current_balance: string;
}

const groupByAccountType = (accounts: AccountCategory[]) => {
  return accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, AccountCategory[]>);
};

const AccountsOverview: React.FC = () => {
  const { palette } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const { data: results, error, isLoading } = useGetAccountOverviewQuery();
  const categories = results as unknown[] as AccountCategory[] || [];
  const groupedCategories = groupByAccountType(categories);

  const handleToggle = (category: string) => {
    setOpen((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const calculateNetWorth = () => {
    return categories.reduce((total, category) => total + parseFloat(category.current_balance), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Typography mb={palette.cosmetics.spacing} variant="h3">Account Overview</Typography>
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
              <Typography variant="body2">
                {formatCurrency(groupedCategories[categoryType].reduce((sum, item) => sum + parseFloat(item.current_balance), 0))}
              </Typography>
            </ListItemButton>
            <Collapse in={open[categoryType]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {groupedCategories[categoryType].map((item) => (
                  <ListItem key={item.account_name} sx={{ pl: 3, py: 0 }}>
                    <ListItemText
                      primary={"└ " + item.account_name}
                      primaryTypographyProps={{ variant: 'body3' }}
                    />
                    <Typography variant="body3">{formatCurrency(parseFloat(item.current_balance))}</Typography>
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
        <Typography variant={calculateNetWorth() < 0 ? "debit" : "credit"} fontWeight="bold">
          {formatCurrency(calculateNetWorth())}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default AccountsOverview;
