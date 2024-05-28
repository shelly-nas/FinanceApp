import React from 'react';
import { Typography, Divider, Box, List, ListItem, ListItemText, Collapse, useTheme, ListItemButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import DashboardBox from '@/components/DashboardBox';

interface IncomeItem {
  name: string;
  amount: number;
  info?: string;
}

interface ExpenseItem {
  name: string;
  amount: number;
  info?: string;
}

interface PeriodSummaryProps {
  incomeItems: IncomeItem[];
  expenseItems: ExpenseItem[];
}

const PeriodSummary: React.FC<PeriodSummaryProps> = ({ incomeItems, expenseItems }) => {
  const { palette } = useTheme();
  const [openIncome, setOpenIncome] = useState(true);
  const [openExpenses, setOpenExpenses] = useState(true);

  const handleIncomeToggle = () => {
    setOpenIncome(!openIncome);
  };

  const handleExpensesToggle = () => {
    setOpenExpenses(!openExpenses);
  };

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const currentSavingsRate = (netIncome / totalIncome) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  return (
    <DashboardBox sx={{ mb: 1.5 }}>
      <Typography mb={palette.cosmetics.spacing} variant="h3">Period Summary</Typography>
      <Divider color={palette.cosmetics.colorSecondary} sx={{mt: 1, mb:1 }} />
      <List sx={{ml: -1.5}}>
        <ListItemButton onClick={handleIncomeToggle} sx={{py: 0.5 }}>
          {openIncome ? <ExpandLess /> : <ExpandMore />}
          <ListItemText 
            primary="Total Income Earned" 
            primaryTypographyProps={{ variant: 'body2' }}
          />
          <Typography variant="body2">
            {formatCurrency(totalIncome)}
          </Typography>
        </ListItemButton>
        <Collapse in={openIncome} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {incomeItems.map((item) => (
              <ListItem key={item.name} sx={{ pl: 3, py: 0 }}>
                <ListItemText 
                  primary={"└ "+item.name} 
                  primaryTypographyProps={{ variant: 'body3' }}
                />
                {/* {item.info && (
                  <Tooltip title={item.info}>
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )} */}
                <Typography variant="body3">{formatCurrency(item.amount)}</Typography>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <ListItemButton onClick={handleExpensesToggle} sx={{py: 0.5 }}>
          {openExpenses ? <ExpandLess /> : <ExpandMore />}
          <ListItemText 
            primary="Total Expenses" 
            primaryTypographyProps={{ variant: 'body2' }}
          />
          <Typography variant="body2">
            {formatCurrency(totalExpenses)}
          </Typography>
        </ListItemButton>
        <Collapse in={openExpenses} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {expenseItems.map((item) => (
              <ListItem key={item.name} sx={{ pl: 3, py: 0 }}>
                <ListItemText 
                  primary={"└ "+item.name} 
                  primaryTypographyProps={{ variant: 'body3' }}
                />
                {/* {item.info && (
                  <Tooltip title={item.info}>
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )} */}
                <Typography variant="body3">{formatCurrency(item.amount)}</Typography>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
      <Divider color={palette.cosmetics.colorSecondary} sx={{mt: 1, mb:1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr:2, ml:1, mt:1 }}>
        <Typography variant="body1" fontWeight="bold">
          Net Income
        </Typography>
        <Typography variant="credit" fontWeight="bold">
          {formatCurrency(netIncome)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr:2, ml:1, mt:1 }}>
        <Typography variant="body1" fontWeight="bold">
          Current Savings Rate
        </Typography>
        <Typography variant="credit" fontWeight="bold">
          {formatPercentage(currentSavingsRate)}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default PeriodSummary;
