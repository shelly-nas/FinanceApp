import React from 'react';
import { Box, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { LineChart, Line, YAxis } from 'recharts';
import CardTable from '@/components/CardTable';
import { formatCurrency } from '@/scenes/reports/chartTheme';
import { CategoryStats, OTHER_COLOR } from '@/scenes/reports/reportMath';

interface Props {
  stats: CategoryStats[];
  selected: string[];
  onToggle?: (category: string) => void;
}

const numeric = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

/** A line without axes, just the shape of one category over the period. */
const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => (
  <LineChart width={96} height={24} data={values.map((value) => ({ value }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
    <YAxis hide domain={['dataMin', 'dataMax']} />
    <Line type="linear" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
  </LineChart>
);

/**
 * Every category with its figures over the period. The trend column is the
 * slope of the best-fit line in euros per month, so rising categories can be
 * spotted without reading every sparkline. A row click toggles the category in
 * the page filter.
 */
const CategoryStatsTable: React.FC<Props> = ({ stats, selected, onToggle }) => (
    <CardTable minWidth={720}>
      <TableHead>
        <TableRow>
          <TableCell>Category</TableCell>
          <TableCell align="right">Total</TableCell>
          <TableCell align="right">Avg / month</TableCell>
          <TableCell align="right">Min</TableCell>
          <TableCell align="right">Max</TableCell>
          <TableCell align="right">Trend / month</TableCell>
          <TableCell>Shape</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {stats.map((row) => {
          const color = row.color ?? OTHER_COLOR;
          const isSelected = selected.includes(row.category);
          return (
            <TableRow
              key={row.category}
              hover
              selected={isSelected}
              onClick={onToggle ? () => onToggle(row.category) : undefined}
              sx={{ cursor: onToggle ? 'pointer' : undefined }}
            >
              <TableCell sx={{ fontWeight: isSelected ? 600 : undefined }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color, flexShrink: 0 }} />
                  {row.category}
                </Box>
              </TableCell>
              <TableCell align="right" sx={numeric}>{formatCurrency(row.total)}</TableCell>
              <TableCell align="right" sx={numeric}>{formatCurrency(row.average)}</TableCell>
              <TableCell align="right" sx={numeric}>{formatCurrency(row.min)}</TableCell>
              <TableCell align="right" sx={numeric}>{formatCurrency(row.max)}</TableCell>
              <TableCell align="right" sx={numeric}>
                {row.slope === null ? '–' : `${row.slope >= 0 ? '+' : ''}${formatCurrency(row.slope)}`}
              </TableCell>
              <TableCell sx={{ py: 0 }}>
                <Sparkline values={row.series.map((p) => p.value)} color={color} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </CardTable>
);

export default CategoryStatsTable;
