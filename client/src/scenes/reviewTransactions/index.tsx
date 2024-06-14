import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, TableSortLabel, IconButton, CircularProgress, Typography, Box, Select, MenuItem,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useLocation } from 'react-router-dom';
import { useGetTransactionsQuery, useGetEmptyCategoryTransactionsQuery, useUpdateTransactionMutation, useGetCategoryListQuery, useDeleteTransactionMutation } from '@/api';
import ActionButtons from '../subHeader';
import DashboardBox from '@/components/DashboardBox';
import DeletePopup from '@/components/DeletePopup';

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

const ReviewTransactions: React.FC = () => {
  const { palette, typography } = useTheme();
  const location = useLocation();
  const transactionIds = location.state?.transactionIds || null;

  const { data: uploadedResults, error: uploadError, isLoading: isLoadingUpload } = useGetTransactionsQuery({ ids: transactionIds }, {
    skip: !transactionIds
  });

  const { data: emptyCategoryResults, error: emptyCategoryError, isLoading: isLoadingEmptyCategory } = useGetEmptyCategoryTransactionsQuery(undefined, {
    skip: transactionIds !== null
  });

  const { data: categoryList, error: categoryError, isLoading: isLoadingCategory } = useGetCategoryListQuery();

  const [updateTransaction] = useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [reviewTransactions, setData] = useState<Transaction[]>([]);
  const [editIdx, setEditIdx] = useState<{ rowIdx: number, colKey: keyof Transaction } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (transactionIds && uploadedResults) {
      setData(uploadedResults.length > 0 ? uploadedResults : []);
    } else if (emptyCategoryResults) {
      setData(emptyCategoryResults.length > 0 ? emptyCategoryResults : []);
    }
  }, [uploadedResults, emptyCategoryResults]);

  const handleDoubleClick = (rowIdx: number, colKey: keyof Transaction) => {
    setEditIdx({ rowIdx, colKey });
    setEditValues({ [colKey]: reviewTransactions[rowIdx][colKey] });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>, colKey: keyof Transaction) => {
    setEditValues((prev) => ({
      ...prev,
      [colKey]: e.target.value as string,
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

  const handleDeleteConfirmation = (id: number) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteTransaction(deleteId).unwrap();
      setOpenDialog(false);
      setDeleteId(null);
      window.location.reload(); // Reload the page
    } catch (error) {
      console.error('Error deleting transaction:', error);
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

  if (isLoadingUpload || isLoadingEmptyCategory) {
    return <CircularProgress />;
  }

  if (uploadError || emptyCategoryError) {
    return <Typography variant="body2" color="error">Error loading transactions</Typography>;
  }

  return (
    <div>
      <ActionButtons />
      {reviewTransactions.length === 0 ? (
        <DashboardBox>
          <Box className={`fade hide`} sx={{ p: 2 }}>
            <Typography variant="body1">
              No transactions need to be reviewed, all transactions have a category assigned.
            </Typography>
          </Box>
        </DashboardBox>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['id', 'date_str', 'name_description', 'account', 'counterparty', 'category', 'debit_credit', 'amount', 'notifications'].map((key) => (
                  <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }} key={key}>
                    <TableSortLabel
                      active={sortConfig?.key === key}
                      direction={sortConfig?.key === key ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(key as keyof Transaction)}
                    >
                      {key.replace(/_/g, ' ')}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }} >edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewTransactions.map((row, rowIdx) => (
                <TableRow key={row.id}>
                  {Object.keys(row).map((key) => (
                    <TableCell
                      key={key}
                      onDoubleClick={() => handleDoubleClick(rowIdx, key as keyof Transaction)}
                      sx={{
                        position: 'relative',
                        '&:hover': {
                          backgroundColor: palette.secondary[100],
                          borderRadius: 2,
                        },
                        padding: 0,
                        paddingLeft: 1.5,
                      }}
                    >
                      {editIdx?.rowIdx === rowIdx && editIdx.colKey === key ? (
                        key === 'category' ? (
                          <Select
                            value={editValues[key as keyof Transaction] ?? row[key as keyof Transaction]}
                            onChange={(e) => handleChange(e, key as keyof Transaction)}
                            autoFocus
                            sx={{
                              width: '100%',
                              marginRight: 1.5, 
                              backgroundColor: '#fff', 
                              marginLeft: -0.75,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'initial',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.secondary.light,
                              },
                            }}
                          >
                            {categoryList.map(option => (
                              <MenuItem 
                                key={option.category_name} 
                                value={option.category_name}
                              >
                                {option.category_name}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <TextField
                            value={editValues[key as keyof Transaction] ?? row[key as keyof Transaction]}
                            onChange={(e) => handleChange(e, key as keyof Transaction)}
                            autoFocus
                            sx={{ 
                              width: '100%',
                              marginRight: 1.5, 
                              backgroundColor: '#fff', 
                              marginLeft: -0.75,
                              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.secondary.light,
                              },
                            }}
                          />
                        )
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
                      <IconButton onClick={() => handleDeleteConfirmation(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <DeletePopup
        open={openDialog}
        handleClose={() => setOpenDialog(false)}
        handleDelete={handleDelete}
        deleteId={deleteId}
      />
    </div>
  );
};

export default ReviewTransactions;
