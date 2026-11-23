import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';

/**
 * The Insights period, stepped back or forward by its own length: a month at
 * a time for one month, a year at a time for twelve.
 */
const PeriodStepper: React.FC<{ trend?: boolean }> = ({ trend = false }) => {
  const { step, period, trend: trendPeriod } = useInsightsFilter();
  const label = trend ? trendPeriod.label : period.label;

  return (
    <Box
      role="group"
      aria-label="Period"
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
      <Tooltip title="Previous period">
        <IconButton size="small" onClick={() => step(-1)} aria-label="Previous period" sx={{ mx: 0.5 }}>
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <Typography
        aria-live="polite"
        sx={{ minWidth: 168, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'text.primary' }}
      >
        {label}
      </Typography>
      <Tooltip title="Next period">
        <IconButton size="small" onClick={() => step(1)} aria-label="Next period" sx={{ mx: 0.5 }}>
          <ChevronRightIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default PeriodStepper;
