import React, { useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, useTheme } from '@mui/material';
import MultiColorProgress from '@/components/MultiColorProgress';
import '@/styles.css';
import { CategorySums } from '@/scenes/dashboard/SpendingBreakdown';

interface SortableSpendingTableProps {
  title: string;
  items: CategorySums[];
  totalAmount: number;
  onRowClick: (category: string) => void;
  selectedCategory: string | null;
}

const SortableSpendingTable: React.FC<SortableSpendingTableProps> = ({ title, items, totalAmount, onRowClick, selectedCategory }) => {
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

  const handleRippleEffect = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(target.clientWidth, target.clientHeight);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    target.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (orderBy === 'amount') {
      return order === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
    } else {
      const aPercentage = (a.total_amount / totalAmount) * 100;
      const bPercentage = (b.total_amount / totalAmount) * 100;
      return order === 'asc' ? aPercentage - bPercentage : bPercentage - aPercentage;
    }
  });

  return (
    <TableContainer sx={{ mt: 1.5 }}>
      <Table size="small">
        <TableHead>
          <div>
            <TableRow>
              <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '23%', minWidth: 170, textAlign: 'left' }}>{title}</TableCell>
              <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '47%', minWidth: 100, textAlign: 'center' }} />
              <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '10%', minWidth: 110, textAlign: 'center' }}>
                <TableSortLabel
                  style={{ flexDirection: 'row-reverse' }}
                  active={orderBy === 'amount'}
                  direction={orderBy === 'amount' ? order : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  TOTAL
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '10%', minWidth: 80, textAlign: 'center' }}>
                <TableSortLabel
                  style={{ flexDirection: 'row-reverse' }}
                  active={orderBy === 'percentage'}
                  direction={orderBy === 'percentage' ? order : 'asc'}
                  onClick={() => handleSort('percentage')}
                >
                  % OF TOTAL
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </div>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => (
            <div className="ripple-container" onClick={handleRippleEffect} key={item.category}>
              <TableRow
                onClick={() => onRowClick(item.category)}
                sx={{
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease-in-out',
                  backgroundColor: selectedCategory === item.category ? palette.grey[100] : 'inherit',
                  '&:hover': {
                    backgroundColor: palette.action.hover,
                  },
                }}
              >
                <TableCell sx={{ ...typography.body2, width: '23%', minWidth: 170, textAlign: 'left', fontWeight: selectedCategory === item.category ? 'bold' : 'inherit' }}>{item.category}</TableCell>
                <TableCell sx={{ width: '47%', minWidth: 100, fontWeight: selectedCategory === item.category ? 'bold' : 'inherit' }}>
                  <MultiColorProgress
                    segments={[{ value: (item.total_amount / totalAmount) * 100, color: item.color, name: item.category }]}
                    height={8}
                  />
                </TableCell>
                <TableCell sx={{ ...typography.body2, width: '10%', minWidth: 110, textAlign: 'right', fontWeight: selectedCategory === item.category ? 'bold' : 'inherit' }}>{formatCurrency(item.total_amount)}</TableCell>
                <TableCell sx={{ ...typography.body2, width: '10%', minWidth: 80, textAlign: 'right', fontWeight: selectedCategory === item.category ? 'bold' : 'inherit' }}>{formatPercentage((item.total_amount / totalAmount) * 100)}</TableCell>
              </TableRow>
            </div>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SortableSpendingTable;
