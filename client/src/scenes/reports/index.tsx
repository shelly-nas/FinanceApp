import React, { useMemo } from 'react';
import {
  Box, ToggleButton, ToggleButtonGroup, TextField, Chip, Stack,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import PageHeader from '@/components/PageHeader';
import StickyBar from '@/components/StickyBar';
import NetWorthChart from '@/scenes/reports/NetWorthChart';
import CategoryTrendChart from '@/scenes/reports/CategoryTrendChart';
import CashflowChart from '@/scenes/reports/CashflowChart';
import PeriodStepper from '@/scenes/insights/PeriodStepper';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { Preset } from '@/scenes/insights/filter';
import { toMonthKey } from '@/utils/monthRange';
import { useGetCategoriesQuery } from '@/api';

const PRESET_LABELS: { value: Preset; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
  { value: 'year', label: 'Year' },
];

/**
 * How things developed, rather than what one month did.
 *
 * Reads the same filter as the dashboard - period, accounts, categories - so
 * switching between the two keeps the selection. A single month has nothing
 * to show per month, so the charts then cover the twelve months up to it.
 */
const Reports: React.FC = () => {
  const { filter, update, setPreset, toggleCategory, trend } = useInsightsFilter();

  const { data: categoryList } = useGetCategoriesQuery();
  const categories = useMemo(
    () => (categoryList ?? []).map((c) => c.category_name).sort((a, b) => a.localeCompare(b)),
    [categoryList],
  );

  // The current month is still running, so its figures are partial. Saying so
  // beats a reader concluding that spending collapsed this month.
  const endsThisMonth = trend.to === toMonthKey(new Date());

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={
          trend.widened
            ? `${trend.label}, per month - the 12 months up to the selected month`
            : `${trend.label}, per month`
        }
      />

      {/* The period applies to every chart, so it stays in view while the
          page scrolls. Category filters live in the card they apply to. */}
      <StickyBar sx={{ mb: 4, py: 2 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            exclusive
            value={filter.preset}
            onChange={(_e, value) => value && setPreset(value)}
            aria-label="Period"
          >
            {PRESET_LABELS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          <PeriodStepper trend />

          <TextField
            type="month"
            label="From"
            value={trend.from}
            onChange={(e) => e.target.value && update({ preset: 'custom', from: e.target.value, to: trend.to })}
            sx={{ minWidth: 150 }}
          />
          <TextField
            type="month"
            label="To"
            value={trend.to}
            onChange={(e) => e.target.value && update({ preset: 'custom', from: trend.from, to: e.target.value })}
            sx={{ minWidth: 150 }}
          />

          {endsThisMonth && (
            <Chip
              variant="outlined"
              icon={<InfoIcon />}
              label="This month is still running"
              sx={{ ml: 'auto', height: 40, borderRadius: 2, px: 1 }}
            />
          )}
        </Box>
      </StickyBar>

      <Stack spacing={4} useFlexGap>
        <NetWorthChart startDate={trend.startDate} endDate={trend.endDate} />
        <CashflowChart startDate={trend.startDate} endDate={trend.endDate} />
        <CategoryTrendChart
          startDate={trend.startDate}
          endDate={trend.endDate}
          allCategories={categories}
          selected={filter.categories}
          onToggleCategory={toggleCategory}
          onClearCategories={() => update({ categories: [] })}
        />
      </Stack>
    </>
  );
};

export default Reports;
