import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Tone } from '@/scenes/reports/reportMath';

/** Theme colour for a tone: green for good, red for bad, nothing for neutral. */
export const toneColor = (tone?: Tone) =>
  tone === 'positive' ? 'success.main' : tone === 'negative' ? 'error.main' : undefined;

export interface Stat {
  label: string;
  value: string;
  /** The headline figure, shown larger. */
  emphasis?: boolean;
  /** Green for a good change, red for a bad one; see toneFor. */
  tone?: Tone;
}

/**
 * A row of key figures above a chart - the numbers a reader wants before the
 * shape. Labels in the overline style, values in tabular figures.
 */
const StatRow: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <Box component="dl" sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px 32px', m: 0, mb: 4 }}>
    {stats.map((stat) => (
      <Box key={stat.label} sx={{ minWidth: 0 }}>
        <Typography variant="overline" component="dt">{stat.label}</Typography>
        <Typography
          component="dd"
          sx={{
            m: 0,
            fontSize: stat.emphasis ? 24 : 14,
            // The headline in regular weight, like the dashboard tiles.
            fontWeight: stat.emphasis ? 400 : 600,
            lineHeight: stat.emphasis ? 1.2 : 1.5,
            color: toneColor(stat.tone) ?? 'text.primary',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {stat.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default StatRow;
