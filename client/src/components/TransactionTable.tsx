import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, TableSortLabel, IconButton, Tooltip, Select, MenuItem, Checkbox,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { TransactionRow } from '@/api';
import TagPicker from '@/components/TagPicker';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

/** Amounts are stored unsigned; the direction gives them their sign and colour. */
const SignedAmount: React.FC<{ row: TransactionRow }> = ({ row }) => {
  const isCredit = row.debit_credit === 'Credit';
  return (
    <Typography component="span" variant={isCredit ? 'credit' : 'debit'}>
      {isCredit ? '+' : '−'}{formatCurrency(Number(row.amount))}
    </Typography>
  );
};

// One list drives both the header and the body. Deriving the body from
// Object.keys(row) instead made the layout depend on the column order Postgres
// happened to return, so a new column shifted every value out from under its
// heading.
interface Column {
  key: keyof TransactionRow;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  editable?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'date_str', label: 'Date', sortable: true, editable: true },
  { key: 'name_description', label: 'Description', sortable: true, editable: true },
  // Right after the description, so the amount is on screen without scrolling.
  { key: 'amount', label: 'Amount', sortable: true, align: 'right', editable: true },
  { key: 'category', label: 'Category', sortable: true, editable: true },
  { key: 'debit_credit', label: 'Type', sortable: true, editable: true },
  { key: 'account', label: 'Account', sortable: true, editable: true },
  { key: 'counterparty', label: 'Counterparty', editable: true },
  { key: 'notifications', label: 'Description text', editable: true },
];

interface Props {
  rows: TransactionRow[];
  /** Cells become editable and the tag and delete columns appear. */
  editable?: boolean;
  categories?: string[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onEdit?: (row: TransactionRow, column: keyof TransactionRow, value: string) => void;
  onDelete?: (row: TransactionRow) => void;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  savingIds?: number[];
}

/**
 * The app's one transaction table.
 *
 * Read-only on the dashboard, editable on the transactions screen - previously
 * two separate components, which meant an improvement to one (single-click
 * editing, optimistic saves) never reached the other.
 */
const TransactionTable: React.FC<Props> = ({
  rows,
  editable = false,
  categories = [],
  sortBy,
  sortDir = 'desc',
  onSort,
  onEdit,
  onDelete,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  savingIds = [],
}) => {
  const [editing, setEditing] = useState<{ id: number; key: keyof TransactionRow } | null>(null);
  const [draft, setDraft] = useState<string>('');

  const selectable = Boolean(onToggleSelect);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const startEdit = (row: TransactionRow, column: Column) => {
    if (!editable || !column.editable) return;
    setEditing({ id: row.id, key: column.key });
    setDraft(row[column.key] === null ? '' : String(row[column.key]));
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft('');
  };

  const commit = (row: TransactionRow, key: keyof TransactionRow, value: string) => {
    const original = row[key] === null ? '' : String(row[key]);
    if (value !== original) onEdit?.(row, key, value);
    cancelEdit();
  };

  // Enter commits, Escape discards - so a correction never needs the mouse.
  const handleKeyDown = (e: React.KeyboardEvent, row: TransactionRow, key: keyof TransactionRow) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(row, key, draft);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const renderCell = (row: TransactionRow, column: Column) => {
    const isEditing = editing?.id === row.id && editing.key === column.key;

    if (isEditing && column.key === 'category') {
      return (
        <Select
          value={draft}
          open
          autoFocus
          size="small"
          onChange={(e: SelectChangeEvent) => commit(row, 'category', e.target.value)}
          onClose={() => setTimeout(cancelEdit, 0)}
          sx={{ width: '100%' }}
        >
          {categories.map((name) => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      );
    }

    if (isEditing && column.key === 'debit_credit') {
      return (
        <Select
          value={draft}
          open
          autoFocus
          size="small"
          onChange={(e: SelectChangeEvent) => commit(row, 'debit_credit', e.target.value)}
          onClose={() => setTimeout(cancelEdit, 0)}
          sx={{ width: '100%' }}
        >
          <MenuItem value="Debit">Debit</MenuItem>
          <MenuItem value="Credit">Credit</MenuItem>
        </Select>
      );
    }

    if (isEditing) {
      return (
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, row, column.key)}
          onBlur={() => commit(row, column.key, draft)}
          size="small"
          autoFocus
          type={column.key === 'amount' ? 'number' : column.key === 'date_str' ? 'date' : 'text'}
          sx={{ width: '100%' }}
        />
      );
    }

    if (column.key === 'amount') {
      return <SignedAmount row={row} />;
    }

    if (column.key === 'category' && row.category === null) {
      return (
        <Typography component="span" variant="body2" sx={{ fontStyle: 'italic' }}>
          Needs a category
        </Typography>
      );
    }

    return row[column.key] as React.ReactNode;
  };

  return (
    // Scrolls sideways inside its card rather than squeezing nine columns.
    <TableContainer
      sx={{
        overflowX: 'auto',
        mx: -6,
        width: 'auto',
        '& td:first-of-type, & th:first-of-type': { pl: 6 },
        '& td:last-of-type, & th:last-of-type': { pr: 6 },
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={selectedIds.length > 0 && !allSelected}
                  onChange={onToggleSelectAll}
                />
              </TableCell>
            )}
            {COLUMNS.map((column) => (
              <TableCell
                key={String(column.key)}
                align={column.align ?? 'left'}
              >
                {column.sortable && onSort ? (
                  <TableSortLabel
                    active={sortBy === column.key}
                    direction={sortBy === column.key ? sortDir : 'asc'}
                    onClick={() => onSort(String(column.key))}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
            <TableCell>Tags</TableCell>
            {editable && onDelete && (
              <TableCell align="right">
                <span className="visually-hidden">Delete</span>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ opacity: savingIds.includes(row.id) ? 0.5 : 1 }}
            >
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => onToggleSelect?.(row.id)}
                  />
                </TableCell>
              )}
              {COLUMNS.map((column) => (
                <TableCell
                  key={String(column.key)}
                  align={column.align ?? 'left'}
                  onClick={() => startEdit(row, column)}
                  sx={{
                    cursor: editable && column.editable ? 'pointer' : 'default',
                    minWidth: column.key === 'notifications' ? 240 : undefined,
                    fontVariantNumeric: column.key === 'amount' ? 'tabular-nums' : undefined,
                    // The cell under the pointer is the one a click edits.
                    '&:hover': editable && column.editable
                      ? { boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}`, borderRadius: 1 }
                      : undefined,
                  }}
                >
                  {column.key === 'date_str' && row.is_internal ? (
                    <Tooltip title="Transfer between your own accounts - excluded from income and expenses">
                      <SwapHorizIcon
                        aria-label="Transfer between own accounts"
                        sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom', color: 'text.secondary' }}
                      />
                    </Tooltip>
                  ) : null}
                  {renderCell(row, column)}
                </TableCell>
              ))}
              <TableCell sx={{ minWidth: 180 }}>
                {editable ? (
                  <TagPicker transactionId={row.id} />
                ) : (
                  row.tags?.map((tag) => tag.tag_name).join(', ')
                )}
              </TableCell>
              {editable && onDelete && (
                <TableCell align="right">
                  <Tooltip title="Delete transaction">
                    <IconButton size="small" aria-label="Delete transaction" onClick={() => onDelete(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionTable;
