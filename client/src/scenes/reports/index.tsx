import React, { useMemo, useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, TextField, MenuItem,
  Select, OutlinedInput, FormControl, InputLabel, Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DashboardBox from '@/components/DashboardBox';
import NetWorthChart from '@/scenes/reports/NetWorthChart';
import CategoryTrendChart from '@/scenes/reports/CategoryTrendChart';
import { useGetCategoryListQuery } from '@/api';

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

  const { data: categoryList } = useGetCategoryListQuery();
  const categories: string[] = useMemo(
    () => (categoryList ?? []).map((c: { category_name: string }) => c.category_name),
    [categoryList],
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
    <Box>
      <DashboardBox sx={{ p: 1.5, mb: 1.5, textAlign: 'left' }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h3" sx={{ mr: 1 }}>Reports</Typography>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={preset}
            onChange={(_e, value) => value && applyPreset(value)}
          >
            {PRESETS.map((option) => (
              <ToggleButton key={option.months} value={String(option.months)}>
                {option.label}
              </ToggleButton>
            ))}
            <ToggleButton value="ytd">This year</ToggleButton>
          </ToggleButtonGroup>

          <TextField
            size="small"
            type="date"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={range.startDate}
            onChange={(e) => {
              setPreset('custom');
              setRange((prev) => ({ ...prev, startDate: e.target.value }));
            }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={range.endDate}
            onChange={(e) => {
              setPreset('custom');
              setRange((prev) => ({ ...prev, endDate: e.target.value }));
            }}
            sx={{ minWidth: 150 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="report-category-filter">Categories</InputLabel>
            <Select
              multiple
              labelId="report-category-filter"
              input={<OutlinedInput label="Categories" />}
              value={selectedCategories}
              onChange={(e: SelectChangeEvent<string[]>) =>
                setSelectedCategories(
                  typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                )
              }
              renderValue={(selected) =>
                selected.length === 0 ? 'All' : `${selected.length} selected`
              }
            >
              {categories.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {endsThisMonth && (
            <Chip
              size="small"
              variant="outlined"
              label="This month is still running"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>
      </DashboardBox>

      <NetWorthChart startDate={range.startDate} endDate={range.endDate} />
      <CategoryTrendChart
        startDate={range.startDate}
        endDate={range.endDate}
        categories={selectedCategories.length > 0 ? selectedCategories : undefined}
      />
    </Box>
  );
};

export default Reports;
