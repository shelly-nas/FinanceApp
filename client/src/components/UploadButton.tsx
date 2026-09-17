import React, { useState } from 'react';
import {
  Button, CircularProgress, Typography, Select, MenuItem, FormControl, InputLabel,
  Box, Modal, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { useUploadTransactionsMutation, useImportBackupMutation } from '@/api';
import DashboardBox from '@/components/DashboardBox';
import { useNavigate } from 'react-router-dom';

// Sentinel in the same dropdown as the banks: the file to pick is chosen the
// same way whether it is a bank export or a backup, so it belongs in one list.
const BACKUP = '__BACKUP__';

// Built the same way RTK Query builds its urls, so the download follows
// VITE_BASE_URL if one is ever set instead of silently hitting the page origin.
const exportHref = `${import.meta.env.VITE_BASE_URL ?? '/'}api/export`.replace(/([^:]\/)\/+/g, '$1');

interface UploadButtonProps {
  onUploadSuccess: () => void;
  /** Opened from the header's action menu rather than by its own button. */
  openExternally?: boolean;
  onCloseExternally?: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onUploadSuccess,
  openExternally,
  onCloseExternally,
}) => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);

  // Controlled from outside when the menu opened it, self-controlled otherwise.
  const isControlled = openExternally !== undefined;
  const open = isControlled ? Boolean(openExternally) : ownOpen;
  const [bank, setBank] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Held between picking a backup file and confirming what to do with it.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [postUploadTransactions] = useUploadTransactionsMutation();
  const [postImportBackup] = useImportBackupMutation();

  const isBackup = bank === BACKUP;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input, so picking the same file again after an error still
    // fires a change event.
    event.target.value = '';
    if (!file) return;

    if (isBackup) {
        // A restore replaces everything, so it is confirmed before it runs
        // rather than after - by then there is nothing to go back to.
        setPendingFile(file);
        return;
    }

    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await postUploadTransactions({ formData, bankType: bank });

            if ('data' in response && response.data?.message === "Entries imported successfully") {
                setLoading(false);
                onUploadSuccess();
                // Rows already stored are skipped, so overlapping export periods
                // are harmless - but say so, otherwise a partial import looks
                // like the file was wrong.
                navigate('/transactions', {
                    state: {
                        transactionIds: JSON.stringify(response.data.createdIds),
                        imported: response.data.imported,
                        skipped: response.data.skipped,
                        markedInternal: response.data.markedInternal,
                    },
                });
            } else {
                setLoading(false);
                const failure = 'error' in response ? response.error : undefined;
                const message =
                    failure && 'data' in failure && typeof failure.data === 'string'
                        ? failure.data
                        : 'Error uploading file';
                setError(message);
            }
        } catch (error) {
            setLoading(false);
            setError('Unexpected error occurred while uploading the file.');
        }
    } else {
        setError('That is not a CSV file. Pick the export your bank produced.');
    }
  };

  /** Run the restore the user has just confirmed. */
  const handleRestore = async (mode: 'replace' | 'merge') => {
    if (!pendingFile) return;
    setPendingFile(null);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', pendingFile);

    try {
      const response = await postImportBackup({ formData, mode });

      if ('data' in response && response.data) {
        const d = response.data;
        setLoading(false);
        onUploadSuccess();
        handleClose();
        navigate('/transactions', {
          state: {
            restored: true,
            mode: d.mode,
            imported: d.transactions,
            skipped: d.skipped_transactions,
            tags: d.tags,
            transfers: d.transfers,
          },
        });
      } else {
        setLoading(false);
        const failure = 'error' in response ? response.error : undefined;
        // The server explains a bad file in `error`; anything else is generic.
        const data = failure && 'data' in failure ? (failure.data as any) : undefined;
        setError(data?.error ?? 'Could not restore that backup.');
      }
    } catch {
      setLoading(false);
      setError('Unexpected error occurred while restoring the backup.');
    }
  };

  const handleBankChange = (event: SelectChangeEvent<string>) => {
    setBank(event.target.value);
    setError(null);
  };

  const handleOpen = () => {
    setOwnOpen(true);
    setError(null); // Reset error state
  };

  const handleClose = () => {
    setOwnOpen(false);
    onCloseExternally?.();
  };

  return (
    <>
      {!isControlled && (
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
      )}

      <Modal open={open} onClose={handleClose}>
        <DashboardBox sx={{ ...style, width: 340 }}>
          <Typography variant="h3">Import data</Typography>
          <FormControl fullWidth sx={{ mt: 1.5 }}>
            <InputLabel id="bank-select-label">Source</InputLabel>
            <Select
              labelId="bank-select-label"
              id="bank-select"
              value={bank}
              label="Source"
              onChange={handleBankChange}
              sx={{ textAlign: 'left' }} // Ensures the text is left-aligned
            >
              <MenuItem value="ING_NL">ING (NL)</MenuItem>
              <MenuItem value="ING_SAVINGS_NL">ING Savings (NL)</MenuItem>
              <MenuItem value="ASN">ASN Bank</MenuItem>
              <Divider />
              <MenuItem value={BACKUP}>Complete backup (JSON)</MenuItem>
            </Select>
          </FormControl>

          {isBackup && (
            <Alert severity="warning" sx={{ mt: 1.5, textAlign: 'left' }}>
              Restoring replaces everything currently stored. Export a backup
              first if you want to keep it.
            </Alert>
          )}

          <div style={{ marginTop: 5, opacity: bank ? 1 : 0.5 }}>
            <input
              accept={isBackup ? '.json,application/json' : '.csv'}
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
                {isBackup ? 'Select backup & restore' : 'Select file & submit'}
              </Button>

            </label>
          </div>

          <Divider sx={{ mt: 2, mb: 1.5 }} />

          {/* A plain link, not fetch-and-blob: the browser streams the file to
              disk and honours the Content-Disposition filename, and nothing has
              to hold the whole export in memory. */}
          <Button
            component="a"
            href={exportHref}
            startIcon={<DownloadIcon />}
            sx={{ width: '100%', textTransform: 'none' }}
          >
            Export everything (JSON)
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
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DashboardBox>
      </Modal>

      {/* Confirmed before the request, not after: a replace cannot be undone,
          and "merge" is offered here because it is the only other sensible
          thing to do with a backup file and is easy to miss otherwise. */}
      <Dialog open={pendingFile !== null} onClose={() => setPendingFile(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Restore this backup?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1.5 }}>
            {pendingFile?.name}
          </Typography>
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            <strong>Replace</strong> deletes everything currently stored first,
            leaving exactly what is in the backup.
          </Alert>
          <Typography variant="body3">
            <strong>Merge</strong> keeps what is there and adds what is missing.
            Transactions already stored are recognised and skipped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingFile(null)}>Cancel</Button>
          <Button onClick={() => handleRestore('merge')}>Merge</Button>
          <Button color="error" onClick={() => handleRestore('replace')}>
            Replace
          </Button>
        </DialogActions>
      </Dialog>
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
