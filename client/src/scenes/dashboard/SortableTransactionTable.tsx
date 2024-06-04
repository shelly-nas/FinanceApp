import React, { useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, useTheme } from '@mui/material';

interface Transaction {
  date_str: string,
  name_description: string,
  account: string,
  counterparty: string,
  category: string,
  debit_credit: string,
  amount: number,
  transaction_type: string,
  notifications: string
}

interface SortableTransactionTableProps {
  items: Transaction[];
}

const SortableTransactionTable: React.FC<SortableTransactionTableProps> = ({ items }) => {
  const { palette, typography } = useTheme();
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof Transaction>('date_str');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleSort = (property: keyof Transaction) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedTransactions = [...items].sort((a, b) => {
    if (orderBy === 'amount') {
      return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (orderBy === 'date_str') {
      return order === 'asc' ? new Date(a.date_str).getTime() - new Date(b.date_str).getTime() : new Date(b.date_str).getTime() - new Date(a.date_str).getTime();
    } else {
      return order === 'asc' ? (a[orderBy] < b[orderBy] ? -1 : 1) : (a[orderBy] > b[orderBy] ? -1 : 1);
    }
  });

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              <TableSortLabel
                active={orderBy === 'date_str'}
                direction={orderBy === 'date_str' ? order : 'asc'}
                onClick={() => handleSort('date_str')}
              >
                Date
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              Description
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              Account
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              Counterparty
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              Category
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              <TableSortLabel
                active={orderBy === 'debit_credit'}
                direction={orderBy === 'debit_credit' ? order : 'asc'}
                onClick={() => handleSort('debit_credit')}
              >
                Type
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'right' }}>
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleSort('amount')}
              >
                Amount
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>
              Notifications
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTransactions.map((transaction) => (
            <TableRow key={transaction.date_str + transaction.name_description}>
              <TableCell sx={{ ...typography.body2, textAlign: 'left' }}>{transaction.date_str}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left', minWidth: 180 }}>{transaction.name_description}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left' }}>{transaction.account}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left' }}>{transaction.counterparty}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left' }}>{transaction.category}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left' }}>{transaction.debit_credit}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'right' }}>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell sx={{ ...typography.body2, textAlign: 'left', minWidth: 500 }}>{transaction.notifications}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SortableTransactionTable;
