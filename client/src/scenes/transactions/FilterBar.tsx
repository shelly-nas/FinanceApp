import React from 'react';
import {
  Box, TextField, MenuItem, Select, Chip, InputAdornment, IconButton,
  FormControl, InputLabel, OutlinedInput, Button, Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import { SearchFilters, TransactionAccount, Tag } from '@/api';

interface Props {
  filters: SearchFilters;
  onChange: (next: Partial<SearchFilters>) => void;
  onReset: () => void;
  categories: string[];
  accounts: TransactionAccount[];
  tags: Tag[];
  activeCount: number;
}

/**
 * Filters for the transactions screen.
 *
 * Everything narrows the same query, so a filter combination reads as one
 * sentence: "Boodschappen at Albert Heijn over 50 euro last August".
 */
const FilterBar: React.FC<Props> = ({
  filters, onChange, onReset, categories, accounts, tags, activeCount,
}) => {
  const multiValue = (value: unknown) => (typeof value === 'string' ? value.split(',') : (value as string[]));

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'flex-end', mb: 6 }}>
      <TextField
        label="Search"
        placeholder="Description, counterparty or account"
        value={filters.query ?? ''}
        onChange={(e) => onChange({ query: e.target.value })}
        sx={{ minWidth: 280, flexGrow: 1, flexBasis: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" aria-hidden />
            </InputAdornment>
          ),
          endAdornment: filters.query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange({ query: '' })} aria-label="Clear search">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />

      <FormControl sx={{ minWidth: 170 }}>
        <InputLabel id="category-filter">Category</InputLabel>
        <Select
          multiple
          labelId="category-filter"
          input={<OutlinedInput />}
          value={filters.categories ?? []}
          onChange={(e: SelectChangeEvent<string[]>) => onChange({ categories: multiValue(e.target.value) })}
          displayEmpty
          renderValue={(selected) => (selected.length === 0 ? 'Any' : `${selected.length} selected`)}
        >
          {categories.map((name) => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 170 }}>
        <InputLabel id="account-filter">Account</InputLabel>
        <Select
          multiple
          labelId="account-filter"
          input={<OutlinedInput />}
          value={filters.accounts ?? []}
          onChange={(e: SelectChangeEvent<string[]>) => onChange({ accounts: multiValue(e.target.value) })}
          displayEmpty
          renderValue={(selected) => (selected.length === 0 ? 'Any' : `${selected.length} selected`)}
        >
          {accounts.map((account) => (
            <MenuItem key={account.details} value={account.details}>
              {account.account_name} ({account.transaction_count})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel id="tag-filter">Event</InputLabel>
        <Select
          multiple
          labelId="tag-filter"
          input={<OutlinedInput />}
          value={(filters.tagIds ?? []).map(String)}
          onChange={(e: SelectChangeEvent<string[]>) =>
            onChange({ tagIds: multiValue(e.target.value).map(Number) })
          }
          displayEmpty
          renderValue={(selected) => (selected.length === 0 ? 'Any' : `${selected.length} selected`)}
        >
          {tags.map((tag) => (
            <MenuItem key={tag.id} value={String(tag.id)}>{tag.tag_name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        select
        label="Direction"
        SelectProps={{ displayEmpty: true }}
        value={filters.debitCredit ?? ''}
        onChange={(e) => onChange({ debitCredit: (e.target.value || undefined) as 'Debit' | 'Credit' | undefined })}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="">Any</MenuItem>
        <MenuItem value="Debit">Out</MenuItem>
        <MenuItem value="Credit">In</MenuItem>
      </TextField>

      <TextField
        type="date"
        label="From"
        value={filters.startDate ?? ''}
        onChange={(e) => onChange({ startDate: e.target.value || undefined })}
        sx={{ minWidth: 160 }}
      />
      <TextField
        type="date"
        label="To"
        value={filters.endDate ?? ''}
        onChange={(e) => onChange({ endDate: e.target.value || undefined })}
        sx={{ minWidth: 160 }}
      />

      <TextField
        type="number"
        label="Min €"
        value={filters.minAmount ?? ''}
        onChange={(e) => onChange({ minAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
        sx={{ width: 112 }}
      />
      <TextField
        type="number"
        label="Max €"
        value={filters.maxAmount ?? ''}
        onChange={(e) => onChange({ maxAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
        sx={{ width: 112 }}
      />

      <Tooltip title="Rows the classifier was not confident enough to label">
        <Chip
          label="Needs a category"
          icon={filters.uncategorised ? <CheckIcon /> : undefined}
          color={filters.uncategorised ? 'primary' : 'default'}
          variant={filters.uncategorised ? 'filled' : 'outlined'}
          aria-pressed={Boolean(filters.uncategorised)}
          onClick={() => onChange({ uncategorised: !filters.uncategorised })}
          sx={{ height: 40, borderRadius: 2, px: 1 }}
        />
      </Tooltip>

      <Tooltip title="Transfers between your own accounts are hidden by default">
        <Chip
          label="Include transfers"
          icon={filters.includeInternal ? <CheckIcon /> : undefined}
          color={filters.includeInternal ? 'primary' : 'default'}
          variant={filters.includeInternal ? 'filled' : 'outlined'}
          aria-pressed={Boolean(filters.includeInternal)}
          onClick={() => onChange({ includeInternal: !filters.includeInternal })}
          sx={{ height: 40, borderRadius: 2, px: 1 }}
        />
      </Tooltip>

      {activeCount > 0 && (
        <Button variant="text" onClick={onReset}>Clear filters</Button>
      )}
    </Box>
  );
};

export default FilterBar;
