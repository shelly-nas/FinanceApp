import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, Alert, Stack,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TablePagination,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useLocation, useSearchParams } from 'react-router-dom';
import DashboardBox from '@/components/DashboardBox';
import PageHeader from '@/components/PageHeader';
import Toast, { ToastMessage } from '@/components/Toast';
import ImportActions from '@/scenes/layout/ImportActions';
import TransactionTable from '@/components/TransactionTable';
import FilterBar from '@/scenes/transactions/FilterBar';
import TransferSuggestions from '@/scenes/transactions/TransferSuggestions';
import OneSidedTransfers from '@/scenes/transactions/OneSidedTransfers';
import UnknownAccounts from '@/scenes/transactions/UnknownAccounts';
import {
  SearchFilters,
  TransactionRow,
  useSearchTransactionsQuery,
  useGetCategoryListQuery,
  useGetTransactionAccountsQuery,
  useGetTagsQuery,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useBulkUpdateTransactionsMutation,
} from '@/api';

const PAGE_SIZES = [25, 50, 100, 250];

/**
 * Every transaction, searchable.
 *
 * This replaces the old review screen rather than sitting beside it: reviewing
 * is the same list with one filter applied, so keeping them apart meant two
 * tables that could each do things the other could not. Arriving from an import
 * pre-selects "needs a category", which is what the classifier left for a human
 * to decide.
 */
const Transactions: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Set by UploadButton after an import, or by the dashboard when drilling into
  // a category from the spending breakdown.
  const navState: {
    imported?: number;
    skipped?: number;
    transactionIds?: string;
    markedInternal?: number;
    presetCategory?: string;
    presetStart?: string;
    presetEnd?: string;
  } = location.state ?? {};

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    // Arriving from an import or the tab badge means there is something to
    // decide; opening the tab deliberately means browsing everything.
    uncategorised: searchParams.get('review') === 'true' || navState.imported !== undefined,
    // A drill-down from the dashboard carries its category and month across, so
    // the user continues where they were rather than re-entering the filters.
    categories: navState.presetCategory ? [navState.presetCategory] : undefined,
    startDate: navState.presetStart,
    endDate: navState.presetEnd,
    sortBy: 'date_str',
    sortDir: 'desc',
  }));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { data: result, isFetching } = useSearchTransactionsQuery({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  });
  const { data: categoryList } = useGetCategoryListQuery();
  const { data: accounts } = useGetTransactionAccountsQuery();
  const { data: tags } = useGetTagsQuery({ includeClosed: false });

  const [updateTransaction] = useUpdateTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [bulkUpdate] = useBulkUpdateTransactionsMutation();

  const categories: string[] = useMemo(
    () => (categoryList ?? []).map((c: { category_name: string }) => c.category_name),
    [categoryList],
  );

  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.categories?.length) count++;
    if (filters.accounts?.length) count++;
    if (filters.tagIds?.length) count++;
    if (filters.debitCredit) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) count++;
    if (filters.uncategorised) count++;
    if (filters.includeInternal) count++;
    return count;
  }, [filters]);

  const changeFilters = (next: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(0);          // a narrowed result has fewer pages than the current one
    setSelectedIds([]);  // a selection cannot outlive the list it was made from
  };

  const resetFilters = () => {
    setFilters({ sortBy: 'date_str', sortDir: 'desc' });
    setPage(0);
    setSelectedIds([]);
  };

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortDir: prev.sortBy === key && prev.sortDir === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Applied optimistically through the cache, with the row dimmed while in
  // flight; a rejected save surfaces as a toast and the refetch restores it.
  const handleEdit = async (row: TransactionRow, column: keyof TransactionRow, value: string) => {
    setSavingIds((prev) => [...prev, row.id]);
    try {
      await updateTransaction({ id: row.id, [column]: value === '' ? null : value }).unwrap();
      setToast({ message: 'Change saved', severity: 'success' });
    } catch {
      setToast({ message: 'Could not save that change, please try again.', severity: 'error' });
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== row.id));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id).unwrap();
      setToast({ message: 'Transaction deleted', severity: 'success' });
    } catch {
      setToast({ message: 'Could not delete that transaction.', severity: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkCategory = async (event: SelectChangeEvent) => {
    const category = event.target.value;
    if (!category || selectedIds.length === 0) return;

    try {
      const { updated } = await bulkUpdate({ ids: selectedIds, updates: { category } }).unwrap();
      setToast({ message: `${updated} transaction(s) set to ${category}`, severity: 'success' });
      setSelectedIds([]);
      setBulkCategory('');
    } catch {
      setToast({ message: 'Could not apply that category.', severity: 'error' });
    }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.length === rows.length ? [] : rows.map((r) => r.id)));

  const range = total === 0
    ? 'No matches'
    : `${Math.min(page * pageSize + 1, total)}–${Math.min((page + 1) * pageSize, total)} of ${total}`;

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Search, correct and categorise every transaction"
        actions={<ImportActions />}
      />

      <Stack spacing={6} useFlexGap>
        {typeof navState.imported === 'number' && (
          <Alert severity={navState.skipped ? 'info' : 'success'}>
            {navState.imported} transactions imported
            {navState.skipped
              ? `, ${navState.skipped} skipped because they were already stored`
              : ''}
            {navState.markedInternal
              ? `, ${navState.markedInternal} recognised as transfers between your own accounts.`
              : '.'}
          </Alert>
        )}

        <UnknownAccounts />
        <OneSidedTransfers transactionIds={navState.transactionIds} />
        <TransferSuggestions transactionIds={navState.transactionIds} />

        <DashboardBox>
          <FilterBar
            filters={filters}
            onChange={changeFilters}
            onReset={resetFilters}
            categories={categories}
            accounts={accounts ?? []}
            tags={tags ?? []}
            activeCount={activeFilterCount}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 4, minHeight: 40, flexWrap: 'wrap' }}>
            {selectedIds.length > 0 ? (
              // Bulk bar: only present once something is selected.
              <>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
                  {selectedIds.length} selected
                </Typography>
                <Select
                  displayEmpty
                  value={bulkCategory}
                  onChange={handleBulkCategory}
                  inputProps={{ 'aria-label': 'Set category for all selected' }}
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="" disabled>Set category for all selected…</MenuItem>
                  {categories.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
                <Button variant="text" onClick={() => setSelectedIds([])}>Clear selection</Button>
              </>
            ) : (
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {range} · Click any cell to edit. Enter saves, Escape cancels.
              </Typography>
            )}
            {isFetching && <CircularProgress size={16} aria-label="Loading" sx={{ ml: 'auto' }} />}
          </Box>

          {rows.length === 0 ? (
            <Typography variant="body1" sx={{ py: 6 }}>
              {filters.uncategorised && activeFilterCount === 1
                ? 'Nothing needs a category. Every transaction has been classified.'
                : activeFilterCount > 0
                  ? 'No transactions match these filters.'
                  : 'No transactions yet. Import a bank export to get started.'}
            </Typography>
          ) : (
            <>
              <TransactionTable
                rows={rows}
                editable
                categories={categories}
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                savingIds={savingIds}
              />
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_e, next) => { setPage(next); setSelectedIds([]); }}
                rowsPerPage={pageSize}
                rowsPerPageOptions={PAGE_SIZES}
                onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DashboardBox>
      </Stack>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this transaction?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {deleteTarget?.name_description} will be removed permanently.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleDelete}>Delete transaction</Button>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
};

export default Transactions;
