import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { formatCurrency, formatMonth } from '@/scenes/reports/chartTheme';
import { tokensFor } from '@/theme';

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
  const t = tokensFor(palette.mode);

  if (!active || !payload || payload.length === 0) return null;

  const rows = [...payload]
    .filter((entry) => entry.value !== undefined && entry.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  return (
    <Box
      sx={{
        backgroundColor: palette.mode === 'dark' ? t.surface3 : t.surface,
        border: `1px solid ${palette.divider}`,
        borderRadius: 2,
        px: 3,
        py: 2.5,
        boxShadow: t.shadow2,
        minWidth: 200,
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 2 }}>
        {label ? formatMonth(label) : ''}
      </Typography>

      {rows.map((entry) => (
        <Box
          key={String(entry.dataKey ?? entry.name)}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}
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
          <Typography variant="body2" sx={{ flexGrow: 1 }}>{entry.name}</Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
            {formatCurrency(entry.value ?? 0)}
          </Typography>
        </Box>
      ))}

      {showTotal && rows.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${palette.divider}`,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', flexGrow: 1 }}>Total</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(total)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChartTooltip;
