import React from 'react';
import { Button, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';


const ActionButtons: React.FC = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  // Navigating home is enough: the mutations on this screen invalidate the
  // dashboard's queries, so it renders with fresh figures on arrival.
  const handleDoneClick = () => {
    navigate('/');
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
