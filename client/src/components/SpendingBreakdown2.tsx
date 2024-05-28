import React, { useState } from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText, LinearProgress, Tooltip, useTheme, ListItemButton, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper } from '@mui/material';
import { ExpandLess, ExpandMore, Info } from '@mui/icons-material';
import DashboardBox from '@/components/DashboardBox';

interface IncomeItem {
  name: string;
  amount: number;
}

interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
}

interface SpendingBreakdownProps {
  income: IncomeItem[];
  expenses: ExpenseItem[];
}

const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ income, expenses }) => {
  const { palette } = useTheme();
  const [openExpenses, setOpenExpenses] = useState(true);
  const [openIncome, setOpenIncome] = useState(true);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<'amount' | 'percentage'>('amount');

  const handleExpensesToggle = () => {
    setOpenExpenses(!openExpenses);
  };

  const handleIncomeToggle = () => {
    setOpenIncome(!openIncome);
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const handleRequestSort = (property: 'amount' | 'percentage') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (orderBy === 'amount') {
      return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else {
      const aPercentage = (a.amount / totalExpenses) * 100;
      const bPercentage = (b.amount / totalExpenses) * 100;
      return order === 'asc' ? aPercentage - bPercentage : bPercentage - aPercentage;
    }
  });

  return (
    <DashboardBox>
      <Typography mb={palette.spacing(2)} variant="h3">Spending Breakdown</Typography>
      <Divider color={palette.divider} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          INCOME
        </Typography>
        <Typography variant="body2">
          {formatCurrency(totalIncome)}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={100} sx={{ height: 10, borderRadius: 5, backgroundColor: palette.grey[200], my: 1 }} />

      <List>
        <ListItemButton onClick={handleIncomeToggle} sx={{ pl: -3, py: 0.5 }}>
          {openIncome ? <ExpandLess /> : <ExpandMore />}
          <ListItemText primary="Total Income Earned" primaryTypographyProps={{ variant: 'body2' }} />
          <Typography variant="body2">
            {formatCurrency(totalIncome)}
          </Typography>
        </ListItemButton>
        <Collapse in={openIncome} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {income.map((item) => (
              <ListItem key={item.name} sx={{ pl: 3, py: 0 }}>
                <ListItemText 
                  primary={item.name} 
                  primaryTypographyProps={{ variant: 'body3' }}
                />
                <Typography variant="body3">{formatCurrency(item.amount)}</Typography>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          EXPENSES
        </Typography>
        <Typography variant="body2">
          {formatCurrency(totalExpenses)}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={(totalExpenses / totalIncome) * 100} sx={{ height: 10, borderRadius: 5, backgroundColor: palette.grey[200], my: 1 }} />
      
      <Divider color={palette.divider} sx={{ mt: 2 }} />
      
      <List>
        <ListItemButton onClick={handleExpensesToggle} sx={{ pl: -3, py: 0.5 }}>
          {openExpenses ? <ExpandLess /> : <ExpandMore />}
          <ListItemText primary="Total Expenses" primaryTypographyProps={{ variant: 'body2' }} />
          <Typography variant="body2">
            {formatCurrency(totalExpenses)}
          </Typography>
        </ListItemButton>
        <Collapse in={openExpenses} timeout="auto" unmountOnExit>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Expense</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'amount'}
                      direction={orderBy === 'amount' ? order : 'asc'}
                      onClick={() => handleRequestSort('amount')}
                    >
                      Total Spent
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={orderBy === 'percentage'}
                      direction={orderBy === 'percentage' ? order : 'asc'}
                      onClick={() => handleRequestSort('percentage')}
                    >
                      % of Total
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedExpenses.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right">{formatPercentage((item.amount / totalExpenses) * 100)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </List>
      
      <Divider color={palette.divider} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mr: 1, ml: 1, mt: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          Total Earned
        </Typography>
        <Typography variant="credit" fontWeight="bold">
          {formatCurrency(totalIncome)}
        </Typography>
      </Box>
    </DashboardBox>
  );
};

export default SpendingBreakdown;
