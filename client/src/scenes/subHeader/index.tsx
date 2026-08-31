import React from 'react';
import { Button, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useGetEmptyCategoryTransactionsQuery } from '@/api';
import { useTheme } from '@mui/material/styles';


const ActionButtons: React.FC = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { refetch } = useGetEmptyCategoryTransactionsQuery();

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
        endIcon={<CheckIcon />}
        sx={{
          backgroundColor: palette.secondary.main,
          color: '#fff',
          '&:hover': {
            backgroundColor: palette.secondary.dark
          }
        }}
        onClick={handleDoneClick}
      >
        Done
      </Button>
    </Box>
  );
};

export default ActionButtons;
