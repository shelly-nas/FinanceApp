import React, { useState } from 'react';
import { Box, Button, Drawer, useMediaQuery, useTheme } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import FilterPanel from '@/scenes/insights/FilterPanel';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { activeFilterCount } from '@/scenes/insights/filter';

/**
 * On a phone the filter is not in the sidebar but behind this button, which
 * opens it as a sheet from the bottom. The count says how much is narrowed.
 * Renders nothing on a desktop.
 */
const MobileFilters: React.FC = () => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { filter } = useInsightsFilter();
  const [open, setOpen] = useState(false);
  if (desktop) return null;

  const count = activeFilterCount(filter);
  return (
    <>
      <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setOpen(true)}>
        {count > 0 ? `Filters · ${count}` : 'Filters'}
      </Button>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px 16px 0 0', maxHeight: '85vh', backgroundImage: 'none' } }}
      >
        <Box sx={{ width: 36, height: 4, borderRadius: 999, bgcolor: 'divider', mx: 'auto', mt: 2 }} aria-hidden />
        <Box sx={{ p: 4, pb: 2, overflowY: 'auto' }}>
          <FilterPanel />
        </Box>
        <Box sx={{ p: 4, pt: 2 }}>
          <Button variant="contained" fullWidth sx={{ height: 44 }} onClick={() => setOpen(false)}>
            Show results
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileFilters;
