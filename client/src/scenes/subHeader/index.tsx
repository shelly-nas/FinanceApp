import React from 'react';
import { Button, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';


const ActionButtons: React.FC = () => {
  const navigate = useNavigate();
  const { data: results, error, isLoading, refetch } = useGetEmptyCategoryTransactionsQuery();

  const handleDoneClick = () => {
    refetch();
    navigate('/');
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
        width: '100%',
        mt: 1.5,
        mb: 1.5,
      }}
    >
      <Button
        variant="contained"
        color="secondary"
        endIcon={<CheckIcon />}
        sx={{
          textTransform: 'none',
        }}
        onClick={handleDoneClick}
      >
        Done
      </Button>
    </Box>
  );
};

export default ActionButtons;
