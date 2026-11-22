import React, { useMemo, useState } from 'react';
import {
  Box, ToggleButton, ToggleButtonGroup, TextField, Chip, Stack, Button,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import PageHeader from '@/components/PageHeader';
import NetWorthChart from '@/scenes/reports/NetWorthChart';
import CategoryTrendChart from '@/scenes/reports/CategoryTrendChart';
import CashflowChart from '@/scenes/reports/CashflowChart';
import { useGetCategoriesQuery } from '@/api';

/** Named ranges, in months back from the current month. */
const PRESETS = [
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
  { label: '24 months', months: 24 },
] as const;

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** A range ending with the last day of the current month, `months` long. */
const presetRange = (months: number) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toIso(start), endDate: toIso(end) };
};

const yearToDate = () => {
  const now = new Date();
  return {
    startDate: toIso(new Date(now.getFullYear(), 0, 1)),
    endDate: toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

/**
 * How things developed, rather than what one month did.
 *
 * The time axis is a range instead of the dashboard's single month, which is the
 * whole reason this is a separate screen: the dashboard answers "what happened in
 * August", this one answers "what has been happening".
 */
const Reports: React.FC = () => {
  const [preset, setPreset] = useState<string>('12');
  const [range, setRange] = useState(() => presetRange(12));
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: categoryList } = useGetCategoriesQuery();
  // Income categories are not part of the spending chart, so offering them as
  // a filter would select something that can never show up.
  const categories = useMemo(
    () => (categoryList ?? [])
      .filter((c) => c.income_outcome !== 'Inkomsten')
      .map((c) => c.category_name)
      .sort((a, b) => a.localeCompare(b)),
    [categoryList],
  );

  const toggleCategory = (name: string) =>
    setSelectedCategories((current) =>
      current.includes(name) ? current.filter((c) => c !== name) : [...current, name],
    );

  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === 'ytd') {
      setRange(yearToDate());
    } else if (value !== 'custom') {
      setRange(presetRange(Number(value)));
    }
  };

  // The current month is still running, so its figures are partial. Saying so
  // beats a reader concluding that spending collapsed this month.
  const endsThisMonth = range.endDate.slice(0, 7) === toIso(new Date()).slice(0, 7);

  return (
    <>
      <PageHeader title="Reports" subtitle="How things developed over a period, rather than what one month did" />

      {/* Filters in one row above the charts; both charts follow them. */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap', mb: 3 }}>
        <ToggleButtonGroup
          exclusive
          value={preset}
          onChange={(_e, value) => value && applyPreset(value)}
          aria-label="Period"
        >
          {PRESETS.map((option) => (
            <ToggleButton key={option.months} value={String(option.months)}>
              {option.label}
            </ToggleButton>
          ))}
          <ToggleButton value="ytd">This year</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          type="date"
          label="From"
          value={range.startDate}
          onChange={(e) => {
            setPreset('custom');
            setRange((prev) => ({ ...prev, startDate: e.target.value }));
          }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          type="date"
          label="To"
          value={range.endDate}
          onChange={(e) => {
            setPreset('custom');
            setRange((prev) => ({ ...prev, endDate: e.target.value }));
          }}
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

      {/* Every category one click away, instead of behind a dropdown. None
          selected means all; the spending chart and its table follow this. */}
      <Box
        role="group"
        aria-label="Categories"
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 4 }}
      >
        <Button
          size="small"
          variant={selectedCategories.length === 0 ? 'contained' : 'outlined'}
          onClick={() => setSelectedCategories([])}
        >
          All categories
        </Button>
        {categories.map((name) => {
          const on = selectedCategories.includes(name);
          return (
            <Chip
              key={name}
              size="small"
              label={name}
              icon={on ? <CheckIcon /> : undefined}
              color={on ? 'primary' : 'default'}
              variant={on ? 'filled' : 'outlined'}
              onClick={() => toggleCategory(name)}
              aria-pressed={on}
            />
          );
        })}
      </Box>

      <Stack spacing={4} useFlexGap>
        <NetWorthChart startDate={range.startDate} endDate={range.endDate} />
        <CashflowChart startDate={range.startDate} endDate={range.endDate} />
        <CategoryTrendChart
          startDate={range.startDate}
          endDate={range.endDate}
          categories={selectedCategories.length > 0 ? selectedCategories : undefined}
          onToggleCategory={toggleCategory}
        />
      </Stack>
    </>
  );
};

export default Reports;
