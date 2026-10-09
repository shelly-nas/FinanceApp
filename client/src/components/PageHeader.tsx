import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  /** The page's controls and its primary action, at the right. */
  actions?: React.ReactNode;
}

/**
 * The top of every page: Title with a muted line under it on the left, the
 * page's actions on the right. Wraps under the title on narrow screens.
 */
const PageHeader: React.FC<Props> = ({ title, subtitle, actions }) => (
  <Box
    component="header"
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 4,
      mb: 8,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h2" component="h1">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {actions}
      </Box>
    )}
  </Box>
);

export default PageHeader;
