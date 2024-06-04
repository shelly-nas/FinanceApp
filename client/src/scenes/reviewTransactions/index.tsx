// src/pages/ReviewTransactions.tsx
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, TableSortLabel, IconButton, CircularProgress, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useGetEmptyCategoryTransactionsQuery, useUpdateTransactionMutation } from '@/api';
import ActionButtons from '../subHeader';

interface Transaction {
  id: number;
  date_str: string;
  name_description: string;
  account: string;
  counterparty: string;
  category: string;
  debit_credit: string;
  amount: number;
  transaction_type: string;
  notifications: string;
}

const emptyRow: Transaction = {
  id: 0,
  date_str: '',
  name_description: '',
  account: '',
  counterparty: '',
  category: '',
  debit_credit: '',
  amount: 0,
  transaction_type: '',
  notifications: '',
};

const ReviewTransactions: React.FC = () => {
  const { data: results, error, isLoading } = useGetEmptyCategoryTransactionsQuery();
  const [updateTransaction] = useUpdateTransactionMutation();
  const [reviewTransactions, setData] = useState<Transaction[]>([]);
  const [editIdx, setEditIdx] = useState<{ rowIdx: number, colKey: keyof Transaction } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});

  useEffect(() => {
    if (results) {
      setData(results.length > 0 ? results : [emptyRow]);
    }
  }, [results]);

  const handleDoubleClick = (rowIdx: number, colKey: keyof Transaction) => {
    setEditIdx({ rowIdx, colKey });
    setEditValues({ [colKey]: reviewTransactions[rowIdx][colKey] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, colKey: keyof Transaction) => {
    setEditValues((prev) => ({
      ...prev,
      [colKey]: e.target.value,
    }));
  };

  const handleSave = async (rowIdx: number) => {
    if (!editIdx) return;

    const updatedData = [...reviewTransactions];
    const updatedRow = {
      ...updatedData[rowIdx],
      ...editValues,
    };
    updatedData[rowIdx] = updatedRow;
    setData(updatedData);
    setEditIdx(null);

    try {
      await updateTransaction({ id: updatedRow.id, ...editValues });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    const sortedData = [...reviewTransactions].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setData(sortedData);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography variant="body2" color="error">Error loading transactions</Typography>;
  }

  return (
    <div>
      <ActionButtons />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {['id', 'date_str', 'name_description', 'account', 'counterparty', 'category', 'debit_credit', 'amount', 'notifications'].map((key) => (
                <TableCell key={key}>
                  <TableSortLabel
                    active={sortConfig?.key === key}
                    direction={sortConfig?.key === key ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort(key as keyof Transaction)}
                  >
                    {key.replace(/_/g, ' ')}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviewTransactions.map((row, rowIdx) => (
              <TableRow key={row.id}>
                {Object.keys(row).map((key) => (
                  <TableCell
                    key={key}
                    onDoubleClick={() => handleDoubleClick(rowIdx, key as keyof Transaction)}
                  >
                    {editIdx?.rowIdx === rowIdx && editIdx.colKey === key ? (
                      <TextField
                        value={editValues[key as keyof Transaction] ?? row[key as keyof Transaction]}
                        onChange={(e) => handleChange(e, key as keyof Transaction)}
                        autoFocus
                      />
                    ) : (
                      row[key as keyof Transaction]
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {editIdx?.rowIdx === rowIdx ? (
                    <IconButton onClick={() => handleSave(rowIdx)}>
                      <SaveIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => handleDoubleClick(rowIdx, 'id')}>
                      <EditIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ReviewTransactions;
