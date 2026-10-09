import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useDateRange } from '@/scenes/dateRange/DateRangeContext';

/** The dashboard's month, stepped one month at a time. */
const DateRange: React.FC = () => {
  const { firstDay, incrementMonth, decrementMonth } = useDateRange();
  const label = firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <Box
      role="group"
      aria-label="Month"
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Tooltip title="Previous month">
        <IconButton size="small" onClick={decrementMonth} aria-label="Previous month" sx={{ mx: 0.5 }}>
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <Typography
        aria-live="polite"
        sx={{ minWidth: 128, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'text.primary' }}
      >
        {label}
      </Typography>
      <Tooltip title="Next month">
        <IconButton size="small" onClick={incrementMonth} aria-label="Next month" sx={{ mx: 0.5 }}>
          <ChevronRightIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DateRange;
