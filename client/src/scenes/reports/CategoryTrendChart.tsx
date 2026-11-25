import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Chip, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import ChartTooltip from '@/scenes/reports/ChartTooltip';
import ChartLegend from '@/scenes/reports/ChartLegend';
import StatRow from '@/scenes/reports/StatRow';
import CategoryStatsTable from '@/scenes/reports/CategoryStatsTable';
import { formatCurrency, formatCompact, formatMonthShort } from '@/scenes/reports/chartTheme';
import {
  buildCategoryRows, summariseCategories, trendSlope, toneFor, defaultSide, Side, OTHER, OTHER_COLOR,
} from '@/scenes/reports/reportMath';
import { useGetCategoriesQuery, useGetCategoryHistoryQuery } from '@/api';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';

interface Props {
  startDate: string;
  endDate: string;
  /** The categories selected in the Insights filter; empty means all. */
  selected: string[];
  /** Toggles a category in the filter - the table rows call this. */
  onToggleCategory: (category: string) => void;
}

/** Beyond this many series the stack stops being readable. */
const MAX_SERIES = 8;

/**
 * Spending or income per category over time: stacked bars for what each month
 * consisted of, a three-month moving average of the total over them for the
 * direction, and a table below with the per-category figures and their own
 * trend. One side at a time: mixed, a salary would make every cost a sliver.
 * Selecting only income categories in the filter switches to income.
 *
 * Only months with data are drawn. A month that was never imported is not a
 * month of zero spending, and a zero bar would say it was.
 */
const CategoryTrendChart: React.FC<Props> = ({ startDate, endDate, selected, onToggleCategory }) => {
  const { palette } = useTheme();
  const { accounts } = useInsightsFilter();
  const { data: categoryList = [] } = useGetCategoriesQuery();
  const suggested = defaultSide(selected, categoryList);
  const [side, setSide] = useState<Side>(suggested);
  // A change in the filter picks the side again; the toggle can still override.
  useEffect(() => setSide(suggested), [suggested]);
  const income = side === 'income';

  const { data: history } = useGetCategoryHistoryQuery({
    startDate,
    endDate,
    categories: selected.length > 0 ? selected : undefined,
    accounts,
    side,
  });

  const { rows, series, colors, labels } = useMemo(
    () => buildCategoryRows(history ?? [], MAX_SERIES),
    [history],
  );
  const stats = useMemo(() => summariseCategories(history ?? []), [history]);


  const toggle = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={side}
      onChange={(_e, next) => next && setSide(next)}
      aria-label="Spending or income"
    >
      <ToggleButton value="expenses">Spending</ToggleButton>
      <ToggleButton value="income">Income</ToggleButton>
    </ToggleButtonGroup>
  );

  if (rows.length === 0) {
    return (
      <DashboardBox>
        <WidgetHeader title="By category" action={toggle} />
        <Typography variant="body2">
          {income ? 'No income in these categories for this period.' : 'No spending in these categories for this period.'}
        </Typography>
      </DashboardBox>
    );
  }

  const monthTotals = rows.map((row) => series.reduce((sum, key) => sum + Number(row[key] ?? 0), 0));
  const periodTotal = monthTotals.reduce((sum, value) => sum + value, 0);
  const slope = trendSlope(monthTotals);
  const axisTick = { fill: palette.text.secondary, fontSize: 12 };

  return (
    <DashboardBox>
      <WidgetHeader
        title="By category"
        subtitle={`${income ? 'Income' : 'Spending'} per month, with the three-month moving average of the total`}
        action={
          <>
            {Object.values(labels).includes(OTHER) && (
              <Chip size="small" variant="outlined" label={`Top ${MAX_SERIES}, rest as Other`} />
            )}
            {toggle}
          </>
        }
      />

      <StatRow
        stats={[
          { label: 'Total', value: formatCurrency(periodTotal), emphasis: true },
          { label: 'Avg / month', value: formatCurrency(periodTotal / rows.length) },
          { label: 'High', value: formatCurrency(Math.max(...monthTotals)) },
          { label: 'Low', value: formatCurrency(Math.min(...monthTotals)) },
          {
            label: 'Trend / month',
            value: slope === null ? '–' : `${slope >= 0 ? '+' : ''}${formatCurrency(slope)}`,
            // More spending is the bad direction, more income the good one.
            tone: toneFor(slope, { higherIsBetter: income }),
          },
          { label: 'Months', value: String(rows.length) },
        ]}
      />

      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={palette.divider} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthShort}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: palette.divider }}
            />
            <YAxis tickFormatter={formatCompact} tick={axisTick} tickLine={false} axisLine={false} width={64} />
            <Tooltip
              content={<ChartTooltip showTotal derivedKeys={['trend']} />}
              cursor={{ fill: palette.action.hover }}
            />
            <Legend content={<ChartLegend />} />
            {series.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                name={labels[key]}
                stackId="spend"
                fill={colors[key] ?? OTHER_COLOR}
                // A 2px line in the surface colour keeps adjacent segments
                // from reading as one block.
                stroke={palette.background.paper}
                strokeWidth={2}
              />
            ))}
            <Line
              type="linear"
              dataKey="trend"
              name="3-month average"
              stroke={palette.text.primary}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: palette.background.paper }}
              // The first two months have no full window; skip them rather
              // than draw a line from nothing.
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 4 }}>
        <CategoryStatsTable stats={stats} selected={selected} onToggle={onToggleCategory} higherIsBetter={income} />
      </Box>
    </DashboardBox>
  );
};

export default CategoryTrendChart;
