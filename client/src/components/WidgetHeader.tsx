import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  /** Small line under the title, e.g. the date a figure applies to. */
  subtitle?: React.ReactNode;
  /** Controls for this card, laid out at the right edge. */
  action?: React.ReactNode;
}

/**
 * A card's heading: Heading-sized title with a muted line under it, and the
 * card's own controls at the right. Whitespace separates it from the content
 * below rather than a rule.
 */
const WidgetHeader: React.FC<Props> = ({ title, subtitle, action }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4 }}>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography variant="h3" component="h2">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}>
        {action}
      </Box>
    )}
  </Box>
);

export default WidgetHeader;
