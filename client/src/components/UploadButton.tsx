import React, { useState } from 'react';
import { Button, CircularProgress, Typography, Select, MenuItem, FormControl, InputLabel, Box, Modal } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useUploadTransactionsMutation } from '@/api';
import DashboardBox from '@/components/DashboardBox';
import { useNavigate } from 'react-router-dom';

interface UploadButtonProps {
  onUploadSuccess: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onUploadSuccess }) => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [postUploadTransactions] = useUploadTransactionsMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await postUploadTransactions({ formData, bankType: bank });

            if (response.data.message == "Entries imported successfully") {
                setLoading(false);
                onUploadSuccess();
                navigate('/review-transactions', { state: { transactionIds: JSON.stringify(response.data.createdIds) } });
            } else {
                setLoading(false);
                setError(response.error?.data || 'Error uploading file');
            }
        } catch (error) {
            setLoading(false);
            setError('Unexpected error occurred while uploading the file.');
        }
    } else {
        alert('Unexpected error occurred while processing file, please refresh and try again.');
    }
  };


  const handleBankChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setBank(event.target.value as string);
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null); // Reset error state
  };

  const handleClose = () => setOpen(false);

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
        <CloudUploadIcon sx={{ fontSize: 40, color: palette.secondary[400] }} />
      </Button>

      <Modal open={open} onClose={handleClose}>
        <DashboardBox sx={{ ...style, width: 300 }}>
          <Typography variant="h3">Upload Bank Transactions</Typography>
          <FormControl fullWidth sx={{ mt: 1.5 }}>
            <InputLabel id="bank-select-label">Bank</InputLabel>
            <Select
              labelId="bank-select-label"
              id="bank-select"
              value={bank}
              label="Bank"
              onChange={handleBankChange}
              sx={{ textAlign: 'left' }} // Ensures the text is left-aligned
            >
              <MenuItem value="ING_NL">ING (NL)</MenuItem>
              <MenuItem value="ING_SAVINGS_NL">ING Savings (NL)</MenuItem>
              <MenuItem value="Rabobank">Rabobank</MenuItem> 
              <MenuItem value="Rabobank_CC">Rabobank Credit Card</MenuItem>
            </Select>
          </FormControl>
          <div style={{ marginTop: 5, opacity: bank ? 1 : 0.5 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="upload-file"
              type="file"
              onChange={handleFileUpload}
              disabled={!bank}
            />
            <label htmlFor="upload-file">
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
                component="span" // Make the button act as a span for the file input
                disabled={!bank}
              >
                Select file & submit
              </Button>
              
            </label>
          </div>
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
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
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

export default UploadButton;
