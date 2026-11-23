import React, { useState } from 'react';
import {
  Button, CircularProgress, Typography, Select, MenuItem, FormControl, InputLabel,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useUploadTransactionsMutation, useImportBackupMutation } from '@/api';
import { useNavigate } from 'react-router-dom';
import { combineImports, isCsv, uploadErrorMessage } from '@/utils/importBatch';
import type { ImportSummary } from '@/api';

// Sentinel in the same dropdown as the banks: the file to pick is chosen the
// same way whether it is a bank export or a backup, so it belongs in one list.
const BACKUP = '__BACKUP__';

const SOURCE_LABELS: Record<string, string> = {
  ING_NL: 'ING (NL)',
  ING_SAVINGS_NL: 'ING Savings (NL)',
  ASN: 'ASN Bank',
  [BACKUP]: 'Complete backup (JSON)',
};

interface UploadButtonProps {
  onUploadSuccess: () => void;
  /** Opened by the page headers' import action. */
  open: boolean;
  onClose: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onUploadSuccess, open, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bank, setBank] = useState('');
  const [error, setError] = useState<string | null>(null);
  // "2 of 3" while several files are imported one after another.
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  // Held between picking a backup file and confirming what to do with it.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [postUploadTransactions] = useUploadTransactionsMutation();
  const [postImportBackup] = useImportBackupMutation();

  const isBackup = bank === BACKUP;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset the input, so picking the same files again after an error still
    // fires a change event.
    event.target.value = '';
    if (files.length === 0) return;

    if (isBackup) {
        // A restore replaces everything, so it is confirmed before it runs
        // rather than after - by then there is nothing to go back to.
        setPendingFile(files[0]);
        return;
    }

    const notCsv = files.filter((file) => !isCsv(file));
    if (notCsv.length > 0) {
        setError(`Not a CSV file: ${notCsv.map((f) => f.name).join(', ')}. Pick the exports your bank produced.`);
        return;
    }

    setLoading(true);
    setError(null);

    // One file at a time, in order: each import has to be stored before the
    // next one runs, so rows that overlapping exports share are recognised as
    // already stored instead of imported twice.
    const succeeded: ImportSummary[] = [];
    const failed: string[] = [];
    for (const [index, file] of files.entries()) {
        setProgress({ current: index + 1, total: files.length });
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await postUploadTransactions({ formData, bankType: bank });
            if ('data' in response && response.data?.message === 'Entries imported successfully') {
                succeeded.push(response.data);
            } else {
                failed.push(`${file.name}: ${uploadErrorMessage('error' in response ? response.error : undefined)}`);
            }
        } catch {
            failed.push(`${file.name}: unexpected error while uploading`);
        }
    }
    setProgress(null);
    setLoading(false);

    if (failed.length > 0) {
        // Stay in the dialog so the failures can be read - onUploadSuccess
        // would navigate away and close it. What did import is stored, and
        // every upload already refreshed the data on screen.
        const done = combineImports(succeeded);
        setError(
            (succeeded.length > 0
                ? `${succeeded.length} of ${files.length} files imported (${done.imported} transactions). `
                : '') + `Failed: ${failed.join('; ')}`,
        );
        return;
    }

    // Rows already stored are skipped, so overlapping export periods are
    // harmless - but say so, otherwise a partial import looks like the file
    // was wrong.
    const total = combineImports(succeeded);
    onUploadSuccess();
    navigate('/transactions', {
        state: {
            transactionIds: JSON.stringify(total.createdIds),
            imported: total.imported,
            skipped: total.skipped,
            markedInternal: total.markedInternal,
        },
    });
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

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={loading ? undefined : handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Import data</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Pick the bank the exports came from, then choose one or more files.
            Rows already stored are recognised and skipped.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="bank-select-label">Source</InputLabel>
            <Select
              labelId="bank-select-label"
              id="bank-select"
              value={bank}
              onChange={handleBankChange}
              displayEmpty
              renderValue={(value) =>
                value === ''
                  ? <Typography component="span" color="text.disabled">Choose a source</Typography>
                  : SOURCE_LABELS[value]
              }
            >
              <MenuItem value="ING_NL">{SOURCE_LABELS.ING_NL}</MenuItem>
              <MenuItem value="ING_SAVINGS_NL">{SOURCE_LABELS.ING_SAVINGS_NL}</MenuItem>
              <MenuItem value="ASN">{SOURCE_LABELS.ASN}</MenuItem>
              <Divider />
              <MenuItem value={BACKUP}>{SOURCE_LABELS[BACKUP]}</MenuItem>
            </Select>
          </FormControl>

          {isBackup && (
            <Alert severity="warning">
              Restoring replaces everything currently stored. Use "Export
              everything" in the sidebar first if you want to keep it.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={handleClose} disabled={loading}>Cancel</Button>
          <input
            accept={isBackup ? '.json,application/json' : '.csv'}
            style={{ display: 'none' }}
            id="upload-file"
            type="file"
            multiple={!isBackup}
            onChange={handleFileUpload}
            disabled={!bank || loading}
          />
          <label htmlFor="upload-file">
            <Button
              variant="contained"
              component="span" // Make the button act as a span for the file input
              disabled={!bank || loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading
                ? progress && progress.total > 1
                  ? `Importing ${progress.current} of ${progress.total}…`
                  : 'Importing…'
                : isBackup ? 'Choose backup…' : 'Choose files…'}
            </Button>
          </label>
        </DialogActions>
      </Dialog>

      {/* Confirmed before the request, not after: a replace cannot be undone,
          and "merge" is offered here because it is the only other sensible
          thing to do with a backup file and is easy to miss otherwise. */}
      <Dialog open={pendingFile !== null} onClose={() => setPendingFile(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Restore this backup?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {pendingFile?.name}
          </Typography>
          <Alert severity="warning">
            <strong>Replace</strong> deletes everything currently stored first,
            leaving exactly what is in the backup.
          </Alert>
          <Typography variant="body2">
            <strong>Merge</strong> keeps what is there and adds what is missing.
            Transactions already stored are recognised and skipped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setPendingFile(null)}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={() => handleRestore('replace')}>
            Replace everything
          </Button>
          <Button variant="contained" onClick={() => handleRestore('merge')}>Merge</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadButton;
