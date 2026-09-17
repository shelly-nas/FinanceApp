import React from 'react';
import {
  Box, TextField, MenuItem, Select, Chip, InputAdornment, IconButton,
  FormControl, InputLabel, OutlinedInput, Button, Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5 }}>
      <TextField
        size="small"
        placeholder="Search description, counterparty, account"
        value={filters.query ?? ''}
        onChange={(e) => onChange({ query: e.target.value })}
        sx={{ minWidth: 280, flexGrow: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
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

      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel id="category-filter">Category</InputLabel>
        <Select
          multiple
          labelId="category-filter"
          input={<OutlinedInput label="Category" />}
          value={filters.categories ?? []}
          onChange={(e: SelectChangeEvent<string[]>) => onChange({ categories: multiValue(e.target.value) })}
          renderValue={(selected) => `${selected.length} selected`}
        >
          {categories.map((name) => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 170 }}>
        <InputLabel id="account-filter">Account</InputLabel>
        <Select
          multiple
          labelId="account-filter"
          input={<OutlinedInput label="Account" />}
          value={filters.accounts ?? []}
          onChange={(e: SelectChangeEvent<string[]>) => onChange({ accounts: multiValue(e.target.value) })}
          renderValue={(selected) => `${selected.length} selected`}
        >
          {accounts.map((account) => (
            <MenuItem key={account.details} value={account.details}>
              {account.account_name} ({account.transaction_count})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="tag-filter">Event</InputLabel>
        <Select
          multiple
          labelId="tag-filter"
          input={<OutlinedInput label="Event" />}
          value={(filters.tagIds ?? []).map(String)}
          onChange={(e: SelectChangeEvent<string[]>) =>
            onChange({ tagIds: multiValue(e.target.value).map(Number) })
          }
          renderValue={(selected) => `${selected.length} selected`}
        >
          {tags.map((tag) => (
            <MenuItem key={tag.id} value={String(tag.id)}>{tag.tag_name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        select
        size="small"
        label="Direction"
        value={filters.debitCredit ?? ''}
        onChange={(e) => onChange({ debitCredit: (e.target.value || undefined) as 'Debit' | 'Credit' | undefined })}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="">Any</MenuItem>
        <MenuItem value="Debit">Out</MenuItem>
        <MenuItem value="Credit">In</MenuItem>
      </TextField>

      <TextField
        size="small"
        type="date"
        label="From"
        InputLabelProps={{ shrink: true }}
        value={filters.startDate ?? ''}
        onChange={(e) => onChange({ startDate: e.target.value || undefined })}
        sx={{ minWidth: 145 }}
      />
      <TextField
        size="small"
        type="date"
        label="To"
        InputLabelProps={{ shrink: true }}
        value={filters.endDate ?? ''}
        onChange={(e) => onChange({ endDate: e.target.value || undefined })}
        sx={{ minWidth: 145 }}
      />

      <TextField
        size="small"
        type="number"
        label="Min €"
        value={filters.minAmount ?? ''}
        onChange={(e) => onChange({ minAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
        sx={{ width: 100 }}
      />
      <TextField
        size="small"
        type="number"
        label="Max €"
        value={filters.maxAmount ?? ''}
        onChange={(e) => onChange({ maxAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
        sx={{ width: 100 }}
      />

      <Tooltip title="Rows the classifier was not confident enough to label">
        <Chip
          label="Needs a category"
          size="small"
          color={filters.uncategorised ? 'secondary' : 'default'}
          variant={filters.uncategorised ? 'filled' : 'outlined'}
          onClick={() => onChange({ uncategorised: !filters.uncategorised })}
        />
      </Tooltip>

      <Tooltip title="Transfers between your own accounts are hidden by default">
        <Chip
          label="Include transfers"
          size="small"
          color={filters.includeInternal ? 'secondary' : 'default'}
          variant={filters.includeInternal ? 'filled' : 'outlined'}
          onClick={() => onChange({ includeInternal: !filters.includeInternal })}
        />
      </Tooltip>

      {activeCount > 0 && (
        <Button size="small" onClick={onReset}>Clear filters</Button>
      )}
    </Box>
  );
};

export default FilterBar;
