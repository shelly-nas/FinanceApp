import React, { useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody } from '@mui/material';
import MultiColorProgress from '@/components/MultiColorProgress';
import { CategorySums } from '@/scenes/dashboard/SpendingBreakdown';

interface SortableSpendingTableProps {
  title: string;
  items: CategorySums[];
  totalAmount: number;
  onRowClick: (category: string) => void;
  selectedCategory: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

const formatPercentage = (value: number) => value.toFixed(1) + '%';

/**
 * One side of the breakdown, a row per category. A row is a button: clicking
 * it, or Enter on it, shows that category's transactions below.
 */
const SortableSpendingTable: React.FC<SortableSpendingTableProps> = ({
  title, items, totalAmount, onRowClick, selectedCategory,
}) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<'amount' | 'percentage'>('amount');

  const handleSort = (property: 'amount' | 'percentage') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Amount and share sort identically; both keys are kept so the active
  // arrow sits on the column the user clicked.
  const sortedItems = [...items].sort((a, b) =>
    order === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount,
  );

  return (
    <TableContainer sx={{ overflowX: 'auto', mx: -6, width: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '28%', minWidth: 170, pl: 6 }}>{title}</TableCell>
            <TableCell sx={{ width: '42%', minWidth: 100 }}>
              <span className="visually-hidden">Share</span>
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 120 }}>
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'desc'}
                onClick={() => handleSort('amount')}
              >
                Total
              </TableSortLabel>
            </TableCell>
            <TableCell align="right" sx={{ minWidth: 96, pr: 6 }}>
              <TableSortLabel
                active={orderBy === 'percentage'}
                direction={orderBy === 'percentage' ? order : 'desc'}
                onClick={() => handleSort('percentage')}
              >
                Share
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedItems.map((item) => {
            const selected = selectedCategory === item.category;
            const share = totalAmount > 0 ? (item.total_amount / totalAmount) * 100 : 0;
            const cellSx = { fontWeight: selected ? 600 : undefined, color: selected ? 'text.primary' : undefined };

            return (
              <TableRow
                key={item.category}
                hover
                selected={selected}
                tabIndex={0}
                aria-selected={selected}
                onClick={() => onRowClick(item.category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(item.category);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  // Selected: tinted row plus a bar at the start - two signals.
                  '&.Mui-selected': { boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}` },
                  '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
                }}
              >
                <TableCell sx={{ ...cellSx, pl: 6 }}>{item.category}</TableCell>
                <TableCell>
                  <MultiColorProgress
                    segments={[{ value: share, color: item.color, name: item.category }]}
                    height={8}
                  />
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(item.total_amount)}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: 'tabular-nums', pr: 6 }}>
                  {formatPercentage(share)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SortableSpendingTable;
