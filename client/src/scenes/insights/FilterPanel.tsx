import React, { useMemo, useState } from 'react';
import {
  Box, Button, ButtonBase, Checkbox, Collapse, IconButton, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useGetAccountOverviewQuery, useGetCategoriesQuery } from '@/api';
import { useInsightsFilter } from '@/scenes/insights/InsightsFilterContext';
import { Preset } from '@/scenes/insights/filter';
import { groupAccounts } from '@/scenes/dashboard/accountSelection';
import { ACCOUNT_TYPE_LABELS } from '@/scenes/reports/chartTheme';

const PERIODS: { value: Preset; label: string; title: string }[] = [
  { value: 'month', label: 'Month', title: 'One month' },
  { value: '3m', label: '3M', title: '3 months' },
  { value: '6m', label: '6M', title: '6 months' },
  { value: '12m', label: '12M', title: '12 months' },
  { value: 'year', label: 'Year', title: 'Calendar year' },
  { value: 'custom', label: '…', title: 'Custom period' },
];

/** A section that folds away, saying what is selected while folded. */
const Section: React.FC<{
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, summary, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
      <ButtonBase
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2, borderRadius: 1 }}
      >
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: 'transform .15s ease', transform: open ? 'none' : 'rotate(-90deg)' }}
        />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', flexGrow: 1, textAlign: 'left' }}>
          {title}
        </Typography>
        <Typography variant="caption">{summary}</Typography>
      </ButtonBase>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 3 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

/** A group heading that ticks or clears the whole group. */
const GroupHeading: React.FC<{ label: string; members: string[]; selected: string[]; onChange: (next: string[]) => void }> = ({
  label, members, selected, onChange,
}) => {
  const ticked = members.filter((m) => selected.includes(m)).length;
  const all = ticked === members.length;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <Checkbox
        size="small"
        checked={all}
        indeterminate={ticked > 0 && !all}
        onChange={() =>
          onChange(all ? selected.filter((s) => !members.includes(s)) : [...new Set([...selected, ...members])])}
        inputProps={{ 'aria-label': `All ${label}` }}
        sx={{ p: 0.5, ml: -0.5 }}
      />
      <Typography variant="overline" sx={{ fontSize: 10.5, lineHeight: 1.6 }}>{label}</Typography>
    </Box>
  );
};

/** One ticked-or-not item, with "only" on hover to select just this one. */
const Item: React.FC<{
  label: string;
  checked: boolean;
  swatch?: string | null;
  onToggle: () => void;
  onOnly: () => void;
}> = ({ label, checked, swatch, onToggle, onOnly }) => (
  <Box
    sx={{
      display: 'flex', alignItems: 'center', gap: 1, minHeight: 28, borderRadius: 1,
      '&:hover': { bgcolor: 'action.hover' }, '&:hover .only, & .only:focus-visible': { opacity: 1 },
    }}
  >
    <Checkbox size="small" checked={checked} onChange={onToggle} sx={{ p: 0.5, ml: -0.5 }} inputProps={{ 'aria-label': label }} />
    {swatch && <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: swatch, flexShrink: 0 }} />}
    <Typography
      variant="body2"
      onClick={onToggle}
      sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary', fontSize: 13, cursor: 'pointer' }}
    >
      {label}
    </Typography>
    <Button
      className="only"
      size="small"
      variant="text"
      onClick={onOnly}
      sx={{ opacity: 0, minWidth: 0, height: 22, px: 1, fontSize: 11, transition: 'opacity 150ms ease' }}
    >
      only
    </Button>
  </Box>
);

/**
 * The one filter of Insights: period, accounts and categories. Nothing ticked
 * means all; changes apply at once. Shown in the sidebar on a desktop and in
 * a sheet on a phone.
 */
const FilterPanel: React.FC = () => {
  const { filter, update, setPreset, step, reset, period } = useInsightsFilter();
  const { data: accounts = [] } = useGetAccountOverviewQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [search, setSearch] = useState('');

  const accountGroups = useMemo(() => groupAccounts(accounts), [accounts]);
  const categoryGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = categories
      .filter((c) => !term || c.category_name.toLowerCase().includes(term))
      .sort((a, b) => a.category_name.localeCompare(b.category_name));
    return [
      { label: 'Income', items: matches.filter((c) => c.income_outcome === 'Inkomsten') },
      { label: 'Expenses · fixed', items: matches.filter((c) => c.income_outcome !== 'Inkomsten' && c.category_type === 'Vast') },
      { label: 'Expenses · variable', items: matches.filter((c) => c.income_outcome !== 'Inkomsten' && c.category_type !== 'Vast') },
    ].filter((g) => g.items.length > 0);
  }, [categories, search]);

  const toggle = (list: string[], item: string) =>
    (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const count = (selected: number, total: number) => (selected === 0 || selected === total ? 'All' : `${selected} of ${total}`);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, mb: 1 }}>
        <Typography variant="overline">Filters</Typography>
        <Button size="small" variant="text" onClick={reset} sx={{ height: 24, px: 1 }}>Reset</Button>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2.5, bgcolor: 'background.paper' }}>
        <Section title="Period" summary={PERIODS.find((p) => p.value === filter.preset)?.title ?? ''} defaultOpen>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={filter.preset}
            onChange={(_e, value) => value && setPreset(value)}
            aria-label="Period"
            sx={{ '& .MuiToggleButton-root': { px: 0, height: 28, fontSize: 12 } }}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p.value} value={p.value} aria-label={p.title}>{p.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
            <Tooltip title="Previous period">
              <IconButton size="small" onClick={() => step(-1)} aria-label="Previous period"><ChevronLeftIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Typography aria-live="polite" sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
              {period.label}
            </Typography>
            <Tooltip title="Next period">
              <IconButton size="small" onClick={() => step(1)} aria-label="Next period"><ChevronRightIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          {filter.preset === 'custom' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1.5 }}>
              <TextField
                type="month"
                label="From"
                size="small"
                value={period.from}
                onChange={(e) => e.target.value && update({ preset: 'custom', from: e.target.value, to: period.to })}
              />
              <TextField
                type="month"
                label="To"
                size="small"
                value={period.to}
                onChange={(e) => e.target.value && update({ preset: 'custom', from: period.from, to: e.target.value })}
              />
            </Box>
          )}
        </Section>

        <Section title="Accounts" summary={count(filter.accounts.length, accounts.length)} defaultOpen>
          {accountGroups.map((group) => {
            const members = group.accounts.map((a) => a.details);
            return (
              <Box key={group.type}>
                <GroupHeading
                  label={ACCOUNT_TYPE_LABELS[group.type] ?? group.type}
                  members={members}
                  selected={filter.accounts}
                  onChange={(next) => update({ accounts: next })}
                />
                {group.accounts.map((account) => (
                  <Item
                    key={account.details}
                    label={account.account_name}
                    checked={filter.accounts.includes(account.details)}
                    onToggle={() => update({ accounts: toggle(filter.accounts, account.details) })}
                    onOnly={() => update({ accounts: [account.details] })}
                  />
                ))}
              </Box>
            );
          })}
        </Section>

        <Section title="Categories" summary={count(filter.categories.length, categories.length)}>
          {categories.length > 8 && (
            <TextField
              size="small"
              fullWidth
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputProps={{ 'aria-label': 'Search categories' }}
              sx={{ mb: 1 }}
            />
          )}
          {categoryGroups.map((group) => {
            const members = group.items.map((c) => c.category_name);
            return (
              <Box key={group.label}>
                <GroupHeading
                  label={group.label}
                  members={members}
                  selected={filter.categories}
                  onChange={(next) => update({ categories: next })}
                />
                {group.items.map((c) => (
                  <Item
                    key={c.category_name}
                    label={c.category_name}
                    swatch={c.color}
                    checked={filter.categories.includes(c.category_name)}
                    onToggle={() => update({ categories: toggle(filter.categories, c.category_name) })}
                    onOnly={() => update({ categories: [c.category_name] })}
                  />
                ))}
              </Box>
            );
          })}
        </Section>
      </Box>
    </Box>
  );
};

export default FilterPanel;
