import React, { useMemo } from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import ChartTooltip from '@/scenes/reports/ChartTooltip';
import ChartLegend from '@/scenes/reports/ChartLegend';
import {
  ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_ORDER, ACCOUNT_TYPE_LABELS,
  formatCurrency, formatCompact, formatMonthShort,
} from '@/scenes/reports/chartTheme';
import { NetWorthPoint, useGetNetWorthHistoryQuery } from '@/api';

interface Props {
  startDate: string;
  endDate: string;
}

const KEY_BY_TYPE: Record<string, keyof NetWorthPoint> = {
  'Checking Account': 'checking',
  'Savings Account': 'savings',
  Investments: 'investments',
};

/**
 * Net worth per month end, stacked by account type.
 *
 * Stacked rather than three separate lines because the parts genuinely sum to
 * the whole, and the question behind the chart - "is my net worth growing" - is
 * answered by the top edge while the bands say where the growth came from.
 *
 * The headline is the latest figure with its change over the period beside it,
 * because that is the sentence a reader wants before they read any shape.
 */
const NetWorthChart: React.FC<Props> = ({ startDate, endDate }) => {
  const { palette } = useTheme();
  const { data: history } = useGetNetWorthHistoryQuery({ startDate, endDate });

  const points = useMemo(
    () =>
      (history ?? []).map((point) => ({
        month: point.month,
        checking: Number(point.checking ?? 0),
        savings: Number(point.savings ?? 0),
        investments: Number(point.investments ?? 0),
        total: Number(point.net_worth),
      })),
    [history],
  );

  if (points.length === 0) {
    return (
      <DashboardBox>
        <WidgetHeader title="Net worth" />
        <Typography variant="body2">
          No data for this period yet. Import a bank export, and add your accounts
          with their opening balances.
        </Typography>
      </DashboardBox>
    );
  }

  const latest = points[points.length - 1];
  const first = points[0];
  const change = latest.total - first.total;
  const changePct = first.total !== 0 ? (change / Math.abs(first.total)) * 100 : 0;
  const rising = change >= 0;

  // Only the types actually present: an empty band would add a legend entry for
  // something the reader has none of.
  const presentTypes = ACCOUNT_TYPE_ORDER.filter((type) =>
    points.some((point) => point[KEY_BY_TYPE[type] as 'checking'] !== 0),
  );

  return (
    <DashboardBox>
      <WidgetHeader title="Net worth" subtitle="At each month end, by account type" />

      {/* The headline: where it stands now, and what the period did to it. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 6, flexWrap: 'wrap' }}>
        <Typography variant="h1" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(latest.total)}
        </Typography>
        <Chip
          size="small"
          icon={rising ? <TrendingUpIcon /> : <TrendingDownIcon />}
          label={`${rising ? '+' : ''}${formatCurrency(change)} (${changePct.toFixed(1)}%)`}
          color={rising ? 'success' : 'error'}
          variant="outlined"
        />
        <Typography variant="body2">
          over {points.length} month{points.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              vertical={false}
              stroke={palette.divider}
            />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tick={{ fill: palette.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: palette.divider }}
            />
            <YAxis
              tickFormatter={formatCompact}
              tick={{ fill: palette.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip showTotal />} cursor={{ stroke: palette.text.secondary, strokeWidth: 1 }} />
            <Legend content={<ChartLegend />} />
            {presentTypes.map((type) => (
              <Area
                key={type}
                type="monotone"
                dataKey={KEY_BY_TYPE[type]}
                name={ACCOUNT_TYPE_LABELS[type]}
                stackId="networth"
                fill={ACCOUNT_TYPE_COLORS[type]}
                fillOpacity={0.85}
                // A 2px line in the surface colour separates the bands, so two
                // adjacent fills never read as one.
                stroke={palette.background.paper}
                strokeWidth={2}
                activeDot={{ r: 4, strokeWidth: 2, stroke: palette.background.paper }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </DashboardBox>
  );
};

export default NetWorthChart;
