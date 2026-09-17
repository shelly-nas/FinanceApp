import React from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';

interface Props {
  title: string;
  /** Small line under the title, e.g. the date a figure applies to. */
  subtitle?: string;
  /** Icon buttons for this widget, laid out at the right edge. */
  action?: React.ReactNode;
}

/**
 * A dashboard panel's heading: centred title with its actions at the right.
 *
 * Both AccountOverview and TransactionDetails used to carry an identical block of
 * `position: absolute; right: 0; top: 50%; transform: translateY(-50%)` to place
 * one icon button, which is a layout that has to be repeated exactly to keep the
 * panels aligned. Flexbox does the same job in one place.
 */
const WidgetHeader: React.FC<Props> = ({ title, subtitle, action }) => {
  const { palette } = useTheme();

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Balances the action on the right so the title stays optically centred. */}
        <Box sx={{ width: 32, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
          <Typography variant="h3">{title}</Typography>
          {subtitle && (
            <Typography variant="body3" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          {action}
        </Box>
      </Box>
      <Divider color={palette.cosmetics.colorSecondary} sx={{ mt: 1, mb: 1 }} />
    </>
  );
};

export default WidgetHeader;
