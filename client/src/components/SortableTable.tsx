import React, { useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, useTheme } from '@mui/material';
import MultiColorProgress from './MultiColorProgress';

interface Item {
  name: string;
  amount: number;
  color: string;
}

interface SortableTableProps {
  title: string;
  items: Item[];
  totalAmount: number;
}

const SortableTable: React.FC<SortableTableProps> = ({ title, items, totalAmount }) => {
  const { palette, typography } = useTheme();
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<'amount' | 'percentage'>('amount');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const handleSort = (property: 'amount' | 'percentage') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (orderBy === 'amount') {
      return order === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else {
      const aPercentage = (a.amount / totalAmount) * 100;
      const bPercentage = (b.amount / totalAmount) * 100;
      return order === 'asc' ? aPercentage - bPercentage : bPercentage - aPercentage;
    }
  });

  return (
    <TableContainer sx={{ mt: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>{title}</TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'center' }} />
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'right' }}>
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleSort('amount')}
              >
                TOTAL
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'right' }}>
              <TableSortLabel
                active={orderBy === 'percentage'}
                direction={orderBy === 'percentage' ? order : 'asc'}
                onClick={() => handleSort('percentage')}
              >
                % OF TOTAL
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow key={item.name}>
              <TableCell sx={{ ...typography.body2, width: '20%', minWidth: 120, textAlign: 'left' }}>{item.name}</TableCell>
              <TableCell sx={{ width: '50%', minWidth: 100, textAlign: 'center' }}>
                <MultiColorProgress
                  segments={[{ value: (item.amount / totalAmount) * 100, color: item.color }]}
                  height={8}
                />
              </TableCell>
              <TableCell sx={{ ...typography.body2, width: '15%', minWidth: 100, textAlign: 'right' }}>{formatCurrency(item.amount)}</TableCell>
              <TableCell sx={{ ...typography.body2, width: '15%', minWidth: 60, textAlign: 'right' }}>{formatPercentage((item.amount / totalAmount) * 100)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SortableTable;
