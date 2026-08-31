import React, { useState } from 'react';
import { Button, Typography, TextField, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent, IconButton, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardBox from './DashboardBox';
import { useGetInvestmentAccountsQuery, useUploadInvestmentsMutation } from '@/api';

export interface Investment {
  date_str: string;
  name_description: string;
  balance: number;
  account: string;
}

const UploadInvestButton: React.FC = () => {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [nameDescription, setNameDescription] = useState('');
  const [balance, setBalance] = useState<number | string>('');
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setPopupActiveDate] = useState<string | null>(null);

  const { data: results } = useGetInvestmentAccountsQuery();
  const accounts = results || [];
  const [postUploadInvestments] = useUploadInvestmentsMutation();

  const handleOpen = () => {
    setOpen(true);
    setPopupActiveDate(new Date().toISOString().split('T')[0]); // Store the current date when the popup is opened
  };

  const handleClose = () => {
    setOpen(false);
    setError(null); // Clear error when modal is closed
    setSuccess(null); // Clear success message when modal is closed
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
        setSuccess('Investments uploaded successfully');
        setInvestments([]); // Clear the list of investments
        setTimeout(() => {
          handleClose();
        }, 5000); // Close the popup after 5 seconds
      } else {
        setError('Error uploading investments');
      }
    } catch (error) {
      setError('Unexpected error occurred while uploading investments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        sx={{
          width: '100%',
          color: palette.secondary[500],
          '&:hover': {
            backgroundColor: palette.action.hover
          }
        }}
        onClick={handleOpen}
      >
        <LineAxisIcon sx={{ fontSize: 40, color: palette.secondary[400] }} />
      </Button>

      <Modal open={open} onClose={handleClose}>
        <DashboardBox sx={{ ...style, width: 300 }}>
          <Typography variant="h3">Add Investment</Typography>

          <TextField
            label="Date"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ pattern: "\\d{4}-\\d{2}-\\d{2}" }}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="account-select-label">Account</InputLabel>
            <Select
              labelId="account-select-label"
              value={account}
              onChange={(e: SelectChangeEvent) => setAccount(e.target.value as string)}
              label="Account"
              sx={{ textAlign: 'left' }}
            >
              {accounts.map((acc: any) => (
                <MenuItem key={acc.details} value={acc.details}>
                  {acc.account_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Name/Description"
            value={nameDescription}
            onChange={(e) => setNameDescription(e.target.value)}
            placeholder="<account> saldo eind januari"
            fullWidth
            sx={{ mt: 2 }}
          />

          <TextField
            label="Balance (€)"
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
            }}
          />

          <Button
            variant="contained"
            sx={{
              mt: 2,
              width: '100%',
              backgroundColor: palette.secondary.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: palette.secondary.dark
              }
            }}
            onClick={handleAddInvestmentToList}
            disabled={loading}
          >
            Add to List
          </Button>

          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircularProgress sx={{ color: palette.secondary[400] }} />
            </Box>
          )}

          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Name/Description</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investments.map((investment, index) => (
                  <TableRow key={index}>
                    <TableCell>{investment.date_str}</TableCell>
                    <TableCell>{investment.account}</TableCell>
                    <TableCell>{investment.name_description}</TableCell>
                    <TableCell>{investment.balance}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleRemoveInvestment(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            sx={{
              mt: 2,
              width: '100%',
              backgroundColor: palette.secondary.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: palette.secondary.dark
              }
            }}
            onClick={handleSubmitInvestments}
            disabled={loading || investments.length === 0}
          >
            Submit Investments
          </Button>

          {!loading && error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {!loading && success && (
            <Typography variant="body2" color="success" sx={{ mt: 2 }}>
              {success}
            </Typography>
          )}

        </DashboardBox>
      </Modal>
    </>
  );
};

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow: 24,
  p: 1.5
};

export default UploadInvestButton;
