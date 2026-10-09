import React from 'react';
import { Box, Typography } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';

interface Props {
  label: string;
  /** The headline figure; style it with a typography variant when it carries a sign. */
  value: React.ReactNode;
  /** One muted line under the figure: what it consists of or applies to. */
  detail?: React.ReactNode;
  /** A control in the top-right corner, e.g. hiding the amounts. */
  action?: React.ReactNode;
  /** Extra content under the detail line, such as an expandable breakdown. */
  children?: React.ReactNode;
}

/**
 * One key figure: a Label, the number at Title size, and a line of context.
 * A stat tile instead of a chart, because the job is a single headline.
 */
const StatTile: React.FC<Props> = ({ label, value, detail, action, children }) => (
  <DashboardBox sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 28 }}>
      <Typography variant="overline" component="h2">{label}</Typography>
      {action}
    </Box>
    <Box sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
      {value}
    </Box>
    {detail && <Typography variant="body2">{detail}</Typography>}
    {children}
  </DashboardBox>
);

export default StatTile;
