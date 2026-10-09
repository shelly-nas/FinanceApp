import React, { useState } from 'react';
import {
  Button, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Box, CircularProgress, MenuItem, FormControl, InputLabel, Select,
  SelectChangeEvent, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { useGetInvestmentAccountsQuery, useUploadInvestmentsMutation } from '@/api';

export interface Investment {
  date_str: string;
  name_description: string;
  balance: number;
  account: string;
}

interface UploadInvestButtonProps {
  /** Opened by the page headers' investments action. */
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);

const UploadInvestButton: React.FC<UploadInvestButtonProps> = ({ open, onClose }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [nameDescription, setNameDescription] = useState('');
  const [balance, setBalance] = useState<number | string>('');
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: results } = useGetInvestmentAccountsQuery();
  const accounts = results || [];
  const [postUploadInvestments] = useUploadInvestmentsMutation();

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleAddInvestmentToList = () => {
    const newInvestment = { date_str: dateStr, name_description: nameDescription, balance: Number(balance), account };
    setInvestments([...investments, newInvestment]);

    // Reset the input fields
    setDateStr('');
    setNameDescription('');
    setBalance('');
    setAccount('');
  };

  const handleRemoveInvestment = (index: number) => {
    const updatedInvestments = investments.filter((_, i) => i !== index);
    setInvestments(updatedInvestments);
  };

  const handleSubmitInvestments = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await postUploadInvestments(investments).unwrap();

      if (result) {
        setSuccess('Balances saved');
        setInvestments([]); // Clear the list of investments
        setTimeout(() => {
          handleClose();
        }, 2400);
      } else {
        setError('Error uploading investments');
      }
    } catch (error) {
      setError('Unexpected error occurred while uploading investments.');
    } finally {
      setLoading(false);
    }
  };

  const canAdd = Boolean(account && dateStr && balance !== '');

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Update investments</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Add the balance of each investment account on a date, then save them
          together.
        </Typography>

        {accounts.length === 0 ? (
          // Investment accounts appear in no bank export, so unlike checking
          // and savings accounts they cannot be discovered from an import -
          // there is nothing to pick until one is created by hand.
          <Alert
            severity="info"
            action={
              <Button size="small" variant="outlined" component={Link} to="/accounts" onClick={handleClose}>
                Add account
              </Button>
            }
          >
            No investment accounts yet. They never appear in a bank export, so
            they have to be created by hand.
          </Alert>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4 }}>
            <TextField
              label="Date"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              fullWidth
              inputProps={{ pattern: "\\d{4}-\\d{2}-\\d{2}" }}
            />

            <FormControl fullWidth>
              <InputLabel id="account-select-label">Account</InputLabel>
              <Select
                labelId="account-select-label"
                value={account}
                onChange={(e: SelectChangeEvent) => setAccount(e.target.value as string)}
              >
                {accounts.map((acc: any) => (
                  <MenuItem key={acc.details} value={acc.details}>
                    {acc.account_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description (optional)"
              value={nameDescription}
              onChange={(e) => setNameDescription(e.target.value)}
              placeholder="Saldo eind januari"
              fullWidth
            />

            <TextField
              label="Balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
            />
          </Box>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddInvestmentToList}
          disabled={loading || !canAdd}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add to list
        </Button>

        {investments.length > 0 && (
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell align="right"><span className="visually-hidden">Remove</span></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investments.map((investment, index) => (
                  <TableRow key={index}>
                    <TableCell>{investment.date_str}</TableCell>
                    <TableCell>{investment.account}</TableCell>
                    <TableCell>{investment.name_description || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(investment.balance)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove from list">
                        <IconButton size="small" aria-label="Remove from list" onClick={() => handleRemoveInvestment(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && success && <Alert severity="success">{success}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmitInvestments}
          disabled={loading || investments.length === 0}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading
            ? 'Saving…'
            : investments.length === 0
              ? 'Save balances'
              : `Save ${investments.length} balance${investments.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadInvestButton;
