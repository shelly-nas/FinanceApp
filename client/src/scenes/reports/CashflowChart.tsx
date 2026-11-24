import React, { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import ChartTooltip from '@/scenes/reports/ChartTooltip';
import ChartLegend from '@/scenes/reports/ChartLegend';
import StatRow from '@/scenes/reports/StatRow';
import {
  CASHFLOW_COLORS, formatCurrency, formatCompact, formatMonthShort,
} from '@/scenes/reports/chartTheme';
import { buildCashflow, toneFor } from '@/scenes/reports/reportMath';
import { useGetCashflowHistoryQuery } from '@/api';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';

interface Props {
  startDate: string;
  endDate: string;
}

const formatPct = (value: number | null) => (value === null ? '–' : `${value.toFixed(1)}%`);

/**
 * Income against spending per month, with what was left over as a line.
 *
 * The savings rate is a percentage and the bars are euros, so it does not get
 * an axis of its own - two scales on one chart invite comparing heights that
 * mean different things. It is in the figures above and in the tooltip.
 */
const CashflowChart: React.FC<Props> = ({ startDate, endDate }) => {
  const { palette } = useTheme();
  const { accounts, categories } = useInsightsFilter();
  const { data } = useGetCashflowHistoryQuery({ startDate, endDate, accounts, categories });
  const rows = useMemo(() => buildCashflow(data ?? []), [data]);

  if (rows.length === 0) {
    return (
      <DashboardBox>
        <WidgetHeader title="Income and spending" />
        <Typography variant="body2">No data for this period.</Typography>
      </DashboardBox>
    );
  }

  const income = rows.reduce((sum, row) => sum + row.income, 0);
  const expenses = rows.reduce((sum, row) => sum + row.expenses, 0);
  const net = income - expenses;
  const axisTick = { fill: palette.text.secondary, fontSize: 12 };

  return (
    <DashboardBox>
      <WidgetHeader title="Income and spending" subtitle="Per month, internal transfers excluded" />

      <StatRow
        stats={[
          { label: 'Saved', value: formatCurrency(net), emphasis: true, tone: toneFor(net) },
          { label: 'Savings rate', value: formatPct(income > 0 ? (net / income) * 100 : null), tone: toneFor(income > 0 ? net : null) },
          { label: 'Income', value: formatCurrency(income) },
          { label: 'Spending', value: formatCurrency(expenses) },
          { label: 'Avg saved / month', value: formatCurrency(net / rows.length), tone: toneFor(net) },
        ]}
      />

      <Box sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }} barGap={2}>
            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={palette.divider} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: palette.divider }}
            />
            <YAxis tickFormatter={formatCompact} tick={axisTick} tickLine={false} axisLine={false} width={64} />
            <ReferenceLine y={0} stroke={palette.divider} />
            <Tooltip
              content={
                <ChartTooltip
                  derivedKeys={['net']}
                  footer={(row) => `Savings rate ${formatPct((row.savingsRate as number | null) ?? null)}`}
                />
              }
              cursor={{ fill: palette.action.hover }}
            />
            <Legend content={<ChartLegend />} />
            <Bar dataKey="income" name="Income" fill={CASHFLOW_COLORS.income} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Spending" fill={CASHFLOW_COLORS.expenses} radius={[4, 4, 0, 0]} />
            <Line
              type="linear"
              dataKey="net"
              name="Saved"
              stroke={palette.text.primary}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: palette.text.primary }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.background.paper }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </DashboardBox>
  );
};

export default CashflowChart;
