import React from 'react';
import {
  Modal, Typography, Button, Box, useTheme
} from '@mui/material';
import DashboardBox from '@/components/DashboardBox';

interface DeletePopupProps {
  open: boolean;
  handleClose: () => void;
  handleDelete: () => void;
  deleteId: number | null;
}

const DeletePopup: React.FC<DeletePopupProps> = ({
  open,
  handleClose,
  handleDelete,
  deleteId
}) => {
  const { palette } = useTheme();

  return (
    <Modal open={open} onClose={handleClose}>
      <DashboardBox sx={{ ...style, width: 300 }}>
        <Typography variant="h3" gutterBottom>
          Confirm Delete
        </Typography>
        <Typography variant="body1">
          Are you sure you want to delete transaction with ID: {deleteId}?
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: palette.error.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: palette.error.dark,
              },
            }}
            onClick={handleDelete}
          >
            Delete
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: palette.secondary.main,
              color: '#fff',
              '&:hover': {
                backgroundColor: palette.secondary.dark,
              },
            }}
            onClick={handleClose}
          >
            Cancel
          </Button>
        </Box>
      </DashboardBox>
    </Modal>
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

export default DeletePopup;
