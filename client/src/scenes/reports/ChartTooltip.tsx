import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { formatCurrency, formatMonth } from '@/scenes/reports/chartTheme';

interface Entry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

interface Props {
  active?: boolean;
  payload?: Entry[];
  label?: string;
  /** Adds a total row - meaningful for stacked forms, misleading for lines. */
  showTotal?: boolean;
}

/**
 * Tooltip for every chart on this screen.
 *
 * Text wears text tokens rather than the series colour; the swatch beside each
 * row carries the identity. Rows are ordered largest first, since that is the
 * order the eye needs when a stack has several segments.
 */
const ChartTooltip: React.FC<Props> = ({ active, payload, label, showTotal }) => {
  const { palette } = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const rows = [...payload]
    .filter((entry) => entry.value !== undefined && entry.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  return (
    <Box
      sx={{
        backgroundColor: palette.background.light,
        border: `1px solid ${palette.cosmetics.colorPrimary}`,
        borderRadius: 1,
        px: 1.25,
        py: 1,
        boxShadow: 3,
        minWidth: 180,
      }}
    >
      <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
        {label ? formatMonth(label) : ''}
      </Typography>

      {rows.map((entry) => (
        <Box
          key={String(entry.dataKey ?? entry.name)}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="body3" sx={{ flexGrow: 1 }}>{entry.name}</Typography>
          <Typography variant="body3" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(entry.value ?? 0)}
          </Typography>
        </Box>
      ))}

      {showTotal && rows.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 0.5,
            pt: 0.5,
            borderTop: `1px solid ${palette.cosmetics.colorSecondary}`,
          }}
        >
          <Typography variant="body3" fontWeight="bold" sx={{ flexGrow: 1 }}>Total</Typography>
          <Typography variant="body3" fontWeight="bold" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChartTooltip;
