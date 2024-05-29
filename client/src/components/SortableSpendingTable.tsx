import React, { useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, useTheme } from '@mui/material';
import MultiColorProgress from '@/components/MultiColorProgress';
import '@/styles.css' 

interface Item {
  name: string;
  amount: number;
  color: string;
}

interface SortableSpendingTableProps {
  title: string;
  items: Item[];
  totalAmount: number;
  onRowClick: (category: string) => void;
}

const SortableSpendingTable: React.FC<SortableSpendingTableProps> = ({ title, items, totalAmount, onRowClick }) => {
  const { palette, typography } = useTheme();
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<'amount' | 'percentage'>('amount');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

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

  const handleRowClick = (category: string) => {
    setSelectedRow(selectedRow === category ? null : category);
    onRowClick(category);
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
          <div>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '20%', minWidth: 120, textAlign: 'left' }}>{title}</TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '50%', minWidth: 100, textAlign: 'center' }} />
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '15%', minWidth: 110, textAlign: 'center' }}>
              <TableSortLabel
                style={{flexDirection: 'row-reverse'}}
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleSort('amount')}
                // hideSortIcon
              >
                TOTAL
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ ...typography.body1, fontWeight: 'bold', width: '15%', minWidth: 80, textAlign: 'center' }}>
              <TableSortLabel
                style={{flexDirection: 'row-reverse'}}
                active={orderBy === 'percentage'}
                direction={orderBy === 'percentage' ? order : 'asc'}
                onClick={() => handleSort('percentage')}
                // hideSortIcon
              >
                % OF TOTAL
              </TableSortLabel>
            </TableCell>
            </div>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => (
            <div className="ripple-container" onClick={handleRippleEffect}>
              <TableRow
                key={item.name}
                onClick={() => handleRowClick(item.name)}
                sx={{
                  cursor: 'pointer',
                  transition: 'background-color 0.1s ease-in-out',
                  backgroundColor: selectedRow === item.name ? palette.grey[100] : 'inherit',
                  '&:hover': {
                    backgroundColor: palette.action.hover,
                  },
                }}
              >
                <TableCell sx={{ ...typography.body2, width: '20%', minWidth: 120, textAlign: 'left', fontWeight: selectedRow === item.name ? "bold" : 'inherit', }}>{item.name}</TableCell>
                <TableCell sx={{ width: '50%', minWidth: 100, textAlign: 'center', fontWeight: selectedRow === item.name ? "bold" : 'inherit', }}>
                  <MultiColorProgress
                    segments={[{ value: (item.amount / totalAmount) * 100, color: item.color }]}
                    height={8}
                  />
                </TableCell>
                <TableCell sx={{ ...typography.body2, width: '15%', minWidth: 110, textAlign: 'right', fontWeight: selectedRow === item.name ? "bold" : 'inherit' }}>{formatCurrency(item.amount)}</TableCell>
                <TableCell sx={{ ...typography.body2, width: '15%', minWidth: 80, textAlign: 'right', fontWeight: selectedRow === item.name ? "bold" : 'inherit' }}>{formatPercentage((item.amount / totalAmount) * 100)}</TableCell>
              </TableRow>
            </div>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SortableSpendingTable;
