import React from 'react';
import { Box, Snackbar, SnackbarContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { tokensFor } from '@/theme';

export interface ToastMessage {
  message: string;
  severity: 'success' | 'error';
}

interface Props {
  toast: ToastMessage | null;
  onClose: () => void;
}

/**
 * Confirmation at the bottom centre: dark, radius 12, an icon plus the
 * sentence. The toast is dark in both modes, so its icons take the dark-mode
 * accents, which hold their contrast on it.
 */
const Toast: React.FC<Props> = ({ toast, onClose }) => {
  const onDark = tokensFor('dark');

  return (
    <Snackbar
      open={toast !== null}
      autoHideDuration={2400}
      onClose={(_event, reason) => { if (reason !== 'clickaway') onClose(); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <SnackbarContent
        role={toast?.severity === 'error' ? 'alert' : 'status'}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 14, fontWeight: 500 }}>
            {toast?.severity === 'error'
              ? <ErrorIcon aria-hidden sx={{ fontSize: 20, color: onDark.error }} />
              : <CheckCircleIcon aria-hidden sx={{ fontSize: 20, color: onDark.success }} />}
            {toast?.message}
          </Box>
        }
      />
    </Snackbar>
  );
};

export default Toast;
