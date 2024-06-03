// src/pages/ReviewTransactions.tsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, TableSortLabel, IconButton
} from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

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

const initialData: Transaction[] = [
  { id: 1, date_str: '2021-01-01', name_description: 'Sample', account: 'Account1', counterparty: 'Counterparty1', category: 'Category1', debit_credit: 'Debit', amount: 100, transaction_type: 'Type1', notifications: 'None' },
  // Add more rows as needed
];

const ReviewTransactions: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);

  const handleEditClick = (idx: number) => {
    setEditIdx(idx);
  };

  const handleSaveClick = () => {
    setEditIdx(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Transaction, idx: number) => {
    const newData = [...data];
    newData[idx][key] = e.target.value;
    setData(newData);
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    const sortedData = [...data].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setData(sortedData);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {['id', 'date_str', 'name_description', 'account', 'counterparty', 'category', 'debit_credit', 'amount', 'transaction_type', 'notifications'].map((key) => (
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
          {data.map((row, idx) => (
            <TableRow key={row.id}>
              {Object.keys(row).map((key) => (
                <TableCell key={key}>
                  {editIdx === idx ? (
                    <TextField
                      value={row[key as keyof Transaction]}
                      onChange={(e) => handleChange(e, key as keyof Transaction, idx)}
                    />
                  ) : (
                    row[key as keyof Transaction]
                  )}
                </TableCell>
              ))}
              <TableCell>
                {editIdx === idx ? (
                  <IconButton onClick={handleSaveClick}>
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => handleEditClick(idx)}>
                    <EditIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReviewTransactions;
