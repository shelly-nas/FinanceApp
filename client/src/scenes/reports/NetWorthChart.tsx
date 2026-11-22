import React, { useMemo, useState } from 'react';
import { Box, Typography, ToggleButton, useTheme } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import ChartTooltip from '@/scenes/reports/ChartTooltip';
import ChartLegend from '@/scenes/reports/ChartLegend';
import StatRow from '@/scenes/reports/StatRow';
import {
  ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_ORDER, ACCOUNT_TYPE_LABELS,
  formatCurrency, formatCompact, formatMonthShort,
} from '@/scenes/reports/chartTheme';
import { trendSlope } from '@/scenes/reports/reportMath';
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
 * Net worth per month end, as a single line - read like a price chart.
 *
 * The y-axis fits the data instead of starting at zero: the question is how
 * the figure moved, and on a zero-based axis a year of saving is a flat line
 * near the top. The account-type split is one toggle away, as lines rather
 * than a stack, so each part can be read against the same axis.
 *
 * Months before the first imported movement are left out: their value would
 * only be the opening balance carried backwards, which nobody observed.
 */
const NetWorthChart: React.FC<Props> = ({ startDate, endDate }) => {
  const { palette } = useTheme();
  const [byType, setByType] = useState(false);
  const { data: history } = useGetNetWorthHistoryQuery({ startDate, endDate });

  const points = useMemo(
    () =>
      (history ?? [])
        .filter((point) => point.has_data)
        .map((point) => ({
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
        <Typography variant="body2">No data for this period.</Typography>
      </DashboardBox>
    );
  }

  const totals = points.map((p) => p.total);
  const latest = totals[totals.length - 1];
  const change = latest - totals[0];
  const changePct = totals[0] !== 0 ? (change / Math.abs(totals[0])) * 100 : null;
  const slope = trendSlope(totals);

  const presentTypes = ACCOUNT_TYPE_ORDER.filter((type) =>
    points.some((point) => point[KEY_BY_TYPE[type] as 'checking'] !== 0),
  );

  const axisTick = { fill: palette.text.secondary, fontSize: 12 };

  return (
    <DashboardBox>
      <WidgetHeader
        title="Net worth"
        subtitle="At each month end"
        action={
          <ToggleButton
            size="small"
            value="byType"
            selected={byType}
            onChange={() => setByType((on) => !on)}
            disabled={presentTypes.length < 2}
          >
            By account type
          </ToggleButton>
        }
      />

      <StatRow
        stats={[
          { label: 'Now', value: formatCurrency(latest), emphasis: true },
          {
            label: 'Change',
            value: `${change >= 0 ? '+' : ''}${formatCurrency(change)}${
              changePct === null ? '' : ` (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`
            }`,
          },
          { label: 'High', value: formatCurrency(Math.max(...totals)) },
          { label: 'Low', value: formatCurrency(Math.min(...totals)) },
          { label: 'Trend / month', value: slope === null ? '–' : `${slope >= 0 ? '+' : ''}${formatCurrency(slope)}` },
          { label: 'Months', value: String(points.length) },
        ]}
      />

      <Box sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={palette.divider} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: palette.divider }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={formatCompact}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: palette.text.secondary, strokeWidth: 1 }} />
            {byType && <Legend content={<ChartLegend />} />}
            <Line
              type="linear"
              dataKey="total"
              name="Net worth"
              stroke={palette.primary.main}
              strokeWidth={2}
              dot={points.length === 1 ? { r: 4 } : false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.background.paper }}
            />
            {byType && presentTypes.map((type) => (
              <Line
                key={type}
                type="linear"
                dataKey={KEY_BY_TYPE[type]}
                name={ACCOUNT_TYPE_LABELS[type]}
                stroke={ACCOUNT_TYPE_COLORS[type]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 2, stroke: palette.background.paper }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </DashboardBox>
  );
};

export default NetWorthChart;
