import React, { useMemo, useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Chip, useTheme,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardBox from '@/components/DashboardBox';
import WidgetHeader from '@/components/WidgetHeader';
import ChartTooltip from '@/scenes/reports/ChartTooltip';
import ChartLegend from '@/scenes/reports/ChartLegend';
import {
  formatCurrency, formatCompact, formatMonthShort, monthsBetween,
} from '@/scenes/reports/chartTheme';
import { useGetCategoryHistoryQuery } from '@/api';

interface Props {
  startDate: string;
  endDate: string;
  categories?: string[];
}

/** Beyond this many series the chart stops being readable. */
const MAX_SERIES = 8;
const OTHER = 'Other';
const OTHER_COLOR = '#8f929b';

/**
 * Spending per category over time.
 *
 * Two forms for two questions, because one chart cannot answer both: stacked
 * bars show what a month consisted of and how the total moved, lines follow one
 * category across months without the neighbours shifting its baseline.
 *
 * Series are capped: past eight, the ninth is not given a new colour but folded
 * into "Other", so no category is ever drawn in a hue that means nothing.
 * Categories keep the colour they carry in the database, so a category looks the
 * same here as in the spending breakdown.
 */
const CategoryTrendChart: React.FC<Props> = ({ startDate, endDate, categories }) => {
  const { palette } = useTheme();
  const [form, setForm] = useState<'bar' | 'line'>('bar');

  const { data: history } = useGetCategoryHistoryQuery({ startDate, endDate, categories });

  const { rows, series, colors, labels } = useMemo<{
    rows: Record<string, number | string>[];
    series: string[];
    colors: Record<string, string>;
    labels: Record<string, string>;
  }>(() => {
    const points = history ?? [];
    if (points.length === 0) {
      return { rows: [], series: [], colors: {}, labels: {} };
    }

    // Rank by total spend over the whole period, so the series that matter most
    // are the ones that keep their own identity.
    const totals = new Map<string, number>();
    const colorByCategory: Record<string, string> = {};

    for (const point of points) {
      const value = Number(point.total);
      totals.set(point.category, (totals.get(point.category) ?? 0) + value);
      if (point.color) colorByCategory[point.category] = point.color;
    }

    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
    const kept = ranked.slice(0, MAX_SERIES);
    const folded = new Set(ranked.slice(MAX_SERIES));

    // Recharts reads a dataKey as a path expression, so a category name
    // containing a dot, comma or bracket - "Kleding, Shoppen, Elektronica" -
    // resolves to nothing and the series silently renders empty. Each series
    // gets an index-based key instead, with the real name kept for the legend
    // and tooltip.
    const seriesNames = folded.size > 0 ? [...kept, OTHER] : kept;
    const keyByName = new Map(seriesNames.map((name, index) => [name, `s${index}`]));

    const labelByKey: Record<string, string> = {};
    const colorByKey: Record<string, string> = {};
    for (const name of seriesNames) {
      const key = keyByName.get(name)!;
      labelByKey[key] = name;
      colorByKey[key] = name === OTHER ? OTHER_COLOR : colorByCategory[name] ?? OTHER_COLOR;
    }

    // The months come from the requested range rather than the data, so a month
    // in which nothing happened is a genuine zero instead of a gap.
    const months = monthsBetween(startDate.slice(0, 7), endDate.slice(0, 7));
    const byMonth = new Map<string, Record<string, number | string>>(
      months.map((month) => [month, { month }]),
    );

    for (const point of points) {
      const bucket = byMonth.get(point.month);
      if (!bucket) continue;
      const key = keyByName.get(folded.has(point.category) ? OTHER : point.category);
      if (!key) continue;
      bucket[key] = Number(bucket[key] ?? 0) + Number(point.total);
    }

    // Zero-fill so a line does not jump the gap and a bar segment is absent
    // rather than undefined.
    for (const bucket of byMonth.values()) {
      for (const key of Object.keys(labelByKey)) {
        if (bucket[key] === undefined) bucket[key] = 0;
      }
    }

    return {
      rows: months.map((month) => byMonth.get(month)!),
      series: seriesNames.map((name) => keyByName.get(name)!),
      colors: colorByKey,
      labels: labelByKey,
    };
  }, [history, startDate, endDate]);

  if (rows.length === 0 || series.length === 0) {
    return (
      <DashboardBox>
        <WidgetHeader title="Spending by category" />
        <Typography variant="body2">
          No categorised spending in this period.
        </Typography>
      </DashboardBox>
    );
  }

  const periodTotal = rows.reduce(
    (sum, row) => sum + series.reduce((s, name) => s + Number(row[name] ?? 0), 0),
    0,
  );

  const axisProps = {
    tick: { fill: palette.text.secondary, fontSize: 12 },
    tickLine: false,
  };

  return (
    <DashboardBox>
      <WidgetHeader
        title="Spending by category"
        subtitle={
          <>
            {formatCurrency(periodTotal)} across {rows.length} month{rows.length === 1 ? '' : 's'} ·{' '}
            {form === 'bar'
              ? 'what each month consisted of'
              : 'each category followed across months'}
          </>
        }
        action={
          <>
            {Object.values(labels).includes(OTHER) && (
              <Chip size="small" variant="outlined" label={`Top ${MAX_SERIES} shown, rest as Other`} />
            )}
            <ToggleButtonGroup
              size="small"
              exclusive
              value={form}
              onChange={(_e, next) => next && setForm(next)}
              aria-label="Chart form"
            >
              <ToggleButton value="bar">
                <BarChartIcon fontSize="small" aria-hidden /> Composition
              </ToggleButton>
              <ToggleButton value="line">
                <ShowChartIcon fontSize="small" aria-hidden /> Trend
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        }
      />

      <Box sx={{ width: '100%', height: 340 }}>
        <ResponsiveContainer>
          {form === 'bar' ? (
            <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={palette.divider} />
              <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps} axisLine={{ stroke: palette.divider }} />
              <YAxis tickFormatter={formatCompact} {...axisProps} axisLine={false} width={60} />
              <Tooltip content={<ChartTooltip showTotal />} cursor={{ fill: palette.action.hover }} />
              <Legend content={<ChartLegend />} />
              {series.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  name={labels[name]}
                  stackId="spend"
                  fill={colors[name] ?? OTHER_COLOR}
                  // A 2px line in the surface colour keeps adjacent segments
                  // from reading as one block.
                  stroke={palette.background.paper}
                  strokeWidth={2}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={palette.divider} />
              <XAxis dataKey="month" tickFormatter={formatMonthShort} {...axisProps} axisLine={{ stroke: palette.divider }} />
              <YAxis tickFormatter={formatCompact} {...axisProps} axisLine={false} width={60} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: palette.text.secondary, strokeWidth: 1 }} />
              <Legend content={<ChartLegend />} />
              {series.map((name) => (
                <Line
                  key={name}
                  // Straight segments, not a spline: a monotone curve between a
                  // peak and a zero overshoots below the axis, drawing a
                  // negative cost that never happened.
                  type="linear"
                  dataKey={name}
                  name={labels[name]}
                  stroke={colors[name] ?? OTHER_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: palette.background.paper }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </Box>
    </DashboardBox>
  );
};

export default CategoryTrendChart;
