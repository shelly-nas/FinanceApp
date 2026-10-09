import React from 'react';
import { Box, Typography } from '@mui/material';

interface Entry {
  value?: string;
  color?: string;
  dataKey?: unknown;
  payload?: { fill?: string };
}

/**
 * Legend for every chart on this screen. The swatch carries the series colour;
 * the name stays in text colour. The swatch reads the series fill, because
 * stacked fills are outlined in the surface colour and Recharts would
 * otherwise take that outline as the series colour.
 */
const ChartLegend: React.FC<{ payload?: Entry[] }> = ({ payload }) => (
  <Box
    component="ul"
    sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', m: 0, mt: 4, p: 0 }}
  >
    {(payload ?? []).map((entry) => (
      <Box component="li" key={String(entry.dataKey ?? entry.value)} sx={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none' }}>
        <Box
          aria-hidden
          sx={{ width: 10, height: 10, borderRadius: '2px', flexShrink: 0, bgcolor: entry.payload?.fill ?? entry.color }}
        />
        <Typography variant="caption">{entry.value}</Typography>
      </Box>
    ))}
  </Box>
);

export default ChartLegend;
