import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, Alert, Stack, Chip, Tabs, Tab,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TablePagination,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useLocation, useSearchParams } from 'react-router-dom';
import DashboardBox from '@/components/DashboardBox';
import StickyBar from '@/components/StickyBar';
import PageHeader from '@/components/PageHeader';
import Toast, { ToastMessage } from '@/components/Toast';
import ImportActions from '@/scenes/layout/ImportActions';
import TransactionTable from '@/components/TransactionTable';
import FilterBar from '@/scenes/transactions/FilterBar';
import TransferReview from '@/scenes/transactions/TransferReview';
import BulkTagControl from '@/scenes/transactions/BulkTagControl';
import UnknownAccounts from '@/scenes/transactions/UnknownAccounts';
import NeedsCategory from '@/scenes/transactions/NeedsCategory';
import { useTodoCount } from '@/scenes/transactions/useTodoCount';
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
  useSetInternalMutation,
} from '@/api';
import { CARD_PADDING } from '@/components/DashboardBox';

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
  const [searchParams, setSearchParams] = useSearchParams();

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
    /** The Overview selection, carried along with "Open in Transactions". */
    presetAccounts?: string[];
    presetCategories?: string[];
    /** That selection in words, for the chip that shows it was carried over. */
    presetLabel?: string;
  } = location.state ?? {};

  // To do is what an import left to decide; All is every transaction. An
  // import and the menu counter open To do, everything else opens All.
  const todo = useTodoCount();
  const tabParam = searchParams.get('tab');
  const tab: 'todo' | 'all' = tabParam === 'todo' || tabParam === 'all'
    ? tabParam
    : searchParams.get('review') === 'true' || navState.imported !== undefined ? 'todo' : 'all';
  const setTab = (next: 'todo' | 'all') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    params.delete('review');
    setSearchParams(params, { replace: true });
  };

  const fromInsights = navState.presetLabel !== undefined || navState.presetCategory !== undefined;
  const [carried, setCarried] = useState<string | null>(navState.presetLabel ?? null);

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    // "Open in Transactions" carries the Overview selection across, so the
    // user continues where they were rather than re-entering the filters.
    categories: navState.presetCategories?.length
      ? navState.presetCategories
      : navState.presetCategory ? [navState.presetCategory] : undefined,
    accounts: navState.presetAccounts,
    startDate: navState.presetStart,
    endDate: navState.presetEnd,
    // Transfers between own accounts are listed, marked with an icon and filed
    // under Overboekingen. Coming from Overview they follow its rule instead,
    // so the list adds up to the figures it came from.
    includeInternal: !fromInsights,
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
  const [setInternal] = useSetInternalMutation();

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
    if (!filters.includeInternal) count++;
    return count;
  }, [filters]);

  const changeFilters = (next: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(0);          // a narrowed result has fewer pages than the current one
    setSelectedIds([]);  // a selection cannot outlive the list it was made from
  };

  const resetFilters = () => {
    setCarried(null);
    setFilters({ includeInternal: true, sortBy: 'date_str', sortDir: 'desc' });
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

  const handleToggleInternal = async (row: TransactionRow) => {
    const internal = !row.is_internal;
    try {
      await setInternal({ ids: [row.id], internal }).unwrap();
      setToast({
        message: internal
          ? 'Marked as a transfer, filed under Overboekingen'
          : 'No longer a transfer - it counts as income or spending again',
        severity: 'success',
      });
    } catch {
      setToast({ message: 'Could not change that, please try again.', severity: 'error' });
    }
  };

  const handleBulkInternal = async () => {
    try {
      const { updated } = await setInternal({ ids: selectedIds, internal: true }).unwrap();
      setToast({ message: `${updated} transaction(s) marked as transfer`, severity: 'success' });
      setSelectedIds([]);
    } catch {
      setToast({ message: 'Could not mark those as transfers.', severity: 'error' });
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
        subtitle="Review what came in, then browse and correct everything"
        actions={<ImportActions />}
      />

      <Stack spacing={4} useFlexGap>
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

        <Tabs
          value={tab}
          onChange={(_e, next) => setTab(next)}
          aria-label="Transactions"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}
        >
          <Tab
            value="todo"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                To do
                <Chip size="small" label={todo.total} color={todo.total > 0 ? 'primary' : 'default'} sx={{ height: 20 }} />
              </Box>
            }
          />
          <Tab value="all" label="All transactions" />
        </Tabs>

        {tab === 'todo' && (
          <>
            <UnknownAccounts />
            <TransferReview transactionIds={navState.transactionIds} suggestionsOnly />
            <NeedsCategory categories={categories} onEdit={handleEdit} savingIds={savingIds} />
            {todo.total === 0 && (
              <DashboardBox>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>Nothing to do.</Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 3 }}>
                  Every account is known, every transfer decided and every transaction has a category.
                </Typography>
                <Button variant="outlined" onClick={() => setTab('all')}>All transactions</Button>
              </DashboardBox>
            )}
          </>
        )}

        {tab === 'all' && (
        <DashboardBox>
          {/* Filters and the bulk bar stay above the rows while the table
              scrolls, so a filter can be changed from anywhere in the list. */}
          <StickyBar surface="paper" sx={{ mx: -CARD_PADDING, px: CARD_PADDING, pt: 2, mt: -2 }}>
            <FilterBar
              filters={filters}
              onChange={changeFilters}
              onReset={resetFilters}
              categories={categories}
              accounts={accounts ?? []}
              tags={tags ?? []}
              activeCount={activeFilterCount}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2, minHeight: 32, flexWrap: 'wrap' }}>
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
                  <Button variant="outlined" size="small" onClick={handleBulkInternal}>
                    Mark as transfer
                  </Button>
                  <BulkTagControl
                    ids={selectedIds}
                    onDone={(message, severity) => setToast({ message, severity })}
                  />
                  <Button variant="text" onClick={() => setSelectedIds([])}>Clear selection</Button>
                </>
              ) : (
                <>
                  {carried && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`From Overview: ${carried}`}
                      onDelete={resetFilters}
                    />
                  )}
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {range} · click a cell to edit · Enter saves · Esc cancels
                  </Typography>
                </>
              )}
              {isFetching && <CircularProgress size={16} aria-label="Loading" sx={{ ml: 'auto' }} />}
            </Box>
          </StickyBar>

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
                onToggleInternal={handleToggleInternal}
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
                sx={{ mt: 1 }}
              />
            </>
          )}
        </DashboardBox>
        )}
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
