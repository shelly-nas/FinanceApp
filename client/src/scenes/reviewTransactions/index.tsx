import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, TableSortLabel, IconButton, CircularProgress, Typography, Box, Select, MenuItem,
  Tooltip, Snackbar, Alert, useTheme
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLocation } from 'react-router-dom';
import { useGetTransactionsQuery, useGetEmptyCategoryTransactionsQuery, useUpdateTransactionMutation, useGetCategoryListQuery, useDeleteTransactionMutation } from '@/api';
import ActionButtons from '../subHeader';
import DashboardBox from '@/components/DashboardBox';
import DeletePopup from '@/components/DeletePopup';
import TagPicker from '@/components/TagPicker';
import TransferSuggestions from '@/scenes/reviewTransactions/TransferSuggestions';
import UnknownAccounts from '@/scenes/reviewTransactions/UnknownAccounts';

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

// The columns the table renders, in order. Header and body both read this one
// list: deriving the body from Object.keys(row) instead made the layout depend
// on the column order Postgres happens to return, so adding a column shifted
// every value one cell to the left of its heading.
const COLUMNS: (keyof Transaction)[] = [
  'id',
  'date_str',
  'name_description',
  'account',
  'counterparty',
  'category',
  'debit_credit',
  'amount',
  'notifications',
];

const ReviewTransactions: React.FC = () => {
  const { palette, typography } = useTheme();
  const location = useLocation();
  const transactionIds = location.state?.transactionIds || null;
  // Set by UploadButton after an import, so the counts can be reported here.
  const importSummary: { imported?: number; skipped?: number } = location.state ?? {};

  const { data: uploadedResults, error: uploadError, isLoading: isLoadingUpload } = useGetTransactionsQuery({ ids: transactionIds }, {
    skip: !transactionIds
  });

  const { data: emptyCategoryResults, error: emptyCategoryError, isLoading: isLoadingEmptyCategory } = useGetEmptyCategoryTransactionsQuery(undefined, {
    skip: transactionIds !== null
  });

  const { data: categoryList } = useGetCategoryListQuery();

  const [updateTransaction] = useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [reviewTransactions, setData] = useState<Transaction[]>([]);
  const [editIdx, setEditIdx] = useState<{ rowIdx: number, colKey: keyof Transaction } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction, direction: 'asc' | 'desc' } | null>(null);
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, severity: 'success' | 'error' } | null>(null);

  // 'id' is the database key and must not be edited from the table.
  const READ_ONLY_COLUMNS: (keyof Transaction)[] = ['id'];

  useEffect(() => {
    if (transactionIds && uploadedResults) {
      setData(uploadedResults.length > 0 ? uploadedResults : []);
    } else if (emptyCategoryResults) {
      setData(emptyCategoryResults.length > 0 ? emptyCategoryResults : []);
    }
  }, [uploadedResults, emptyCategoryResults]);

  // Single click opens the cell for editing - double click made every correction
  // on this screen a two-step action, which is the bulk of the work here.
  const handleStartEdit = (rowIdx: number, colKey: keyof Transaction) => {
    if (READ_ONLY_COLUMNS.includes(colKey)) return;
    if (editIdx?.rowIdx === rowIdx && editIdx.colKey === colKey) return;
    setEditIdx({ rowIdx, colKey });
    setEditValues({ [colKey]: reviewTransactions[rowIdx][colKey] });
  };

  const handleCancelEdit = () => {
    setEditIdx(null);
    setEditValues({});
  };

  // Enter commits, Escape discards - so a correction never needs the mouse.
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(rowIdx);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | number>,
    colKey: keyof Transaction,
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [colKey]: e.target.value as string,
    }));
  };

  // Picking a category is the most common edit on this screen, so commit it on
  // selection rather than making the user confirm a second time.
  const handleSelectChange = (
    e: SelectChangeEvent<string | number>,
    colKey: keyof Transaction,
    rowIdx: number,
  ) => {
    const value = e.target.value as string;
    setEditValues({ [colKey]: value });
    saveValue(rowIdx, colKey, value);
  };

  const saveValue = async (
    rowIdx: number,
    colKey: keyof Transaction,
    newValue: Transaction[keyof Transaction],
  ) => {
    const originalRow = reviewTransactions[rowIdx];

    // Nothing typed, or unchanged - just close the editor without a round trip.
    if (newValue === undefined || newValue === originalRow[colKey]) {
      handleCancelEdit();
      return;
    }

    const patch = { [colKey]: newValue };
    const updatedRow = { ...originalRow, ...patch };
    const cellKey = `${originalRow.id}-${colKey}`;

    // Apply optimistically so the table stays responsive, but keep the original
    // row so a rejected save can be rolled back instead of showing a value that
    // was never persisted.
    setData((prev) => prev.map((r, i) => (i === rowIdx ? updatedRow : r)));
    setEditIdx(null);
    setEditValues({});
    setSavingKey(cellKey);

    try {
      await updateTransaction({ id: originalRow.id, ...patch }).unwrap();
      setToast({ message: 'Saved', severity: 'success' });
    } catch (error) {
      console.error('Error updating transaction:', error);
      setData((prev) => prev.map((r, i) => (i === rowIdx ? originalRow : r)));
      setToast({ message: 'Could not save change, please try again.', severity: 'error' });
    } finally {
      setSavingKey((k) => (k === cellKey ? null : k));
    }
  };

  const handleSave = (rowIdx: number) => {
    if (!editIdx) return;
    saveValue(rowIdx, editIdx.colKey, editValues[editIdx.colKey] as Transaction[keyof Transaction]);
  };

  const handleDeleteConfirmation = (id: number) => {
    setDeleteId(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteTransaction(deleteId).unwrap();
      // The row is gone from the server; drop it here too rather than reloading
      // the page, which would discard the sort order and scroll position.
      setData((prev) => prev.filter((r) => r.id !== deleteId));
      setOpenDialog(false);
      setDeleteId(null);
      setToast({ message: 'Transaction deleted', severity: 'success' });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setToast({ message: 'Could not delete the transaction, please try again.', severity: 'error' });
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
      {typeof importSummary.imported === 'number' && (
        <Alert
          severity={importSummary.skipped ? 'info' : 'success'}
          sx={{ mb: 1.5 }}
        >
          {importSummary.imported} transactions imported
          {importSummary.skipped
            ? `, ${importSummary.skipped} skipped because they were already stored.`
            : '.'}
        </Alert>
      )}
      <UnknownAccounts />
      <TransferSuggestions transactionIds={transactionIds} />
      {reviewTransactions.length > 0 && (
        <Typography variant="body2" sx={{ px: 1, py: 0.5, opacity: 0.7 }}>
          Click any cell to edit. Enter saves, Escape cancels, clicking away saves.
        </Typography>
      )}
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
                {COLUMNS.map((key) => (
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
                <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }}>tags</TableCell>
                <TableCell sx={{ ...typography.body1, fontWeight: 'bold', textAlign: 'left' }} >delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewTransactions.map((row, rowIdx) => (
                <TableRow key={row.id}>
                  {COLUMNS.map((key) => (
                    <TableCell
                      key={key}
                      onClick={() => handleStartEdit(rowIdx, key as keyof Transaction)}
                      sx={{
                        position: 'relative',
                        cursor: READ_ONLY_COLUMNS.includes(key as keyof Transaction) ? 'default' : 'pointer',
                        opacity: savingKey === `${row.id}-${key}` ? 0.5 : 1,
                        '&:hover': READ_ONLY_COLUMNS.includes(key as keyof Transaction) ? undefined : {
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
                            onChange={(e) => handleSelectChange(e, key as keyof Transaction, rowIdx)}
                            onClose={() => setTimeout(() => handleCancelEdit(), 0)}
                            open
                            autoFocus
                            sx={{
                              width: '100%',
                              marginRight: 1.5, 
                              backgroundColor: palette.background.light, 
                              marginLeft: -0.75,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'initial',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: palette.secondary.light,
                              },
                            }}
                          >
                            {(categoryList ?? []).map((option: { category_name: string }) => (
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
                            onKeyDown={(e) => handleKeyDown(e, rowIdx)}
                            onBlur={() => handleSave(rowIdx)}
                            size="small"
                            autoFocus
                            sx={{ 
                              width: '100%',
                              marginRight: 1.5, 
                              backgroundColor: palette.background.light, 
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
                  <TableCell sx={{ minWidth: 200 }}>
                    <TagPicker transactionId={row.id} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete transaction">
                      <IconButton onClick={() => handleDeleteConfirmation(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={toast !== null}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
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
