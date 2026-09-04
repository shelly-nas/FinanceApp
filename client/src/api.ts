// api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Investment } from "@/components/UploadInvestButton";

interface TransactionsQueryParams {
  startDate?: string;
  endDate?: string;
  ids?: string;
}

export interface Tag {
  id: number;
  tag_name: string;
  color?: string | null;
  budget?: number | null;
  is_closed?: boolean;
  notes?: string | null;
  transaction_count?: number;
}

export interface TagSummary extends Tag {
  total_spent: string;
  total_received: string;
  transaction_count: number;
  first_transaction: string | null;
  last_transaction: string | null;
  by_category: { category: string | null; total_amount: string }[];
  by_month: { month: string; total_amount: string }[];
}

export interface ImportSummary {
  message: string;
  createdIds: number[];
  imported: number;
  skipped: number;
}

/** A proposed pair of rows that together look like one internal transfer. */
export interface TransferCandidate {
  from_transaction_id: number;
  from_date: string;
  from_account: string | null;
  from_account_name: string | null;
  from_description: string | null;
  to_transaction_id: number;
  to_date: string;
  to_account: string | null;
  to_account_name: string | null;
  to_description: string | null;
  amount: string;
  /** 'iban' when both accounts are known and certain, 'amount' when inferred. */
  match_basis: 'iban' | 'amount';
}

export interface Transfer {
  id: number;
  match_basis: 'iban' | 'amount';
  confirmed_at: string;
  from_date: string;
  from_account: string | null;
  from_account_name: string | null;
  to_date: string;
  to_account: string | null;
  to_account_name: string | null;
  amount: string;
}

export interface Account {
  id: number;
  account_type: 'Checking Account' | 'Savings Account' | 'Investments';
  account_name: string;
  details: string;
  balance_when_created: string | number | null;
  transaction_count?: number;
}

/** An account identifier seen in transactions but not yet in the accounts table. */
export interface UnknownAccount {
  details: string;
  transaction_count: number;
  first_seen: string;
  last_seen: string;
  last_description: string | null;
}

export interface TransactionRow {
  id: number;
  date_str: string;
  name_description: string | null;
  account: string | null;
  counterparty: string | null;
  category: string | null;
  debit_credit: string;
  amount: string;
  notifications: string | null;
  is_internal: boolean | null;
  tags: { id: number; tag_name: string; color: string | null }[];
}

export interface SearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  accounts?: string[];
  tagIds?: number[];
  debitCredit?: 'Debit' | 'Credit';
  minAmount?: number;
  maxAmount?: number;
  uncategorised?: boolean;
  includeInternal?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  rows: TransactionRow[];
  /** Matches ignoring paging, so the client can show "100 of 1,432". */
  total: number;
}

export interface TransactionAccount {
  details: string;
  account_name: string;
  transaction_count: number;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  // Only tags a query actually provides belong here. A mutation invalidating a
  // tag nothing provides refetches nothing, which is what left the app relying
  // on full page reloads to show a change.
  tagTypes: [
    "transactions",
    "categorySums",
    "incomeExpensesSum",
    "emptyCategoryTransactions",
    "accountOverview",
    "categoryList",
    "investmentAccounts",
    "tags",
    "tagSummary",
    "transactionTags",
    "transferCandidates",
    "transfers",
    "accounts",
    "unknownAccounts",
    "searchTransactions",
    "transactionAccounts",
  ],
  endpoints: (build) => ({
    getTransactions: build.query<any, Partial<TransactionsQueryParams>>({
      query: ({ startDate, endDate, ids }) => {
        // Constructing query parameters only for those that are not undefined
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.set('startDate', startDate);
        if (endDate) queryParams.set('endDate', endDate);
        if (ids) queryParams.set('ids', ids);

        return {
          url: `api/transactions`,
          params: queryParams,
        };
      },
      providesTags: ["transactions"],
    }),
    getCategorySums: build.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({
        url: `api/category-sums`,
        params: { startDate, endDate },
      }),
      providesTags: ["categorySums"],
    }),
    getIncomeExpensesSum: build.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({
        url: `api/income-expenses-sum`,
        params: { startDate, endDate },
      }),
      providesTags: ["incomeExpensesSum"],
    }),
    uploadTransactions: build.mutation<ImportSummary, { formData: FormData, bankType: string }>({
      query: ({ formData, bankType }) => ({
        url: `api/upload-transactions`,
        method: 'POST',
        body: formData,
        params: {bankType}
      }),
      // An import changes every derived figure at once.
      invalidatesTags: ["transactions", "searchTransactions", "categorySums",
                        "incomeExpensesSum", "emptyCategoryTransactions",
                        "accountOverview", "transferCandidates",
                        "unknownAccounts", "transactionAccounts"],
    }),
    getEmptyCategoryTransactions: build.query<any, void>({
      query: () => ({
        url: `api/empty-category-transactions`,
      }),
      providesTags: ["emptyCategoryTransactions"],
    }),
    updateTransaction: build.mutation<any, { id: number, [key: string]: any }>({
      query: ({ id, ...patch }) => ({
        url: `api/update-transaction/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // Editing a category moves money between breakdowns, so the sums and the
      // review list are stale too - not just the transaction itself.
      invalidatesTags: ["transactions", "searchTransactions", "categorySums",
                        "incomeExpensesSum", "emptyCategoryTransactions",
                        "accountOverview", "transferCandidates",
                        "unknownAccounts", "transactionAccounts"],
    }),
    getAccountOverview: build.query<any, void>({
      query: () => ({
        url: `api/account-overview`,
      }),
      providesTags: ["accountOverview"],
    }),
    getCategoryList: build.query<any, void>({
      query: () => ({
        url: `api/category-list`,
      }),
      providesTags: ["categoryList"],
    }),
    getInvestmentAccounts: build.query<any, void>({
      query: () => ({
        url: `api/investment-accounts`,
      }),
      providesTags: ["investmentAccounts"],
    }),
    uploadInvestments: build.mutation<any, Investment[]>({
      query: (investments) => ({
        url: 'api/upload-investments',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: investments,
      }),
      invalidatesTags: ["accountOverview"],
    }),
    deleteTransaction: build.mutation<void, number>({
      query: (id) => ({
        url: `api/remove-transaction/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["transactions", "searchTransactions", "categorySums",
                        "incomeExpensesSum", "emptyCategoryTransactions",
                        "accountOverview", "transferCandidates",
                        "unknownAccounts", "transactionAccounts"],
    }),
    getTags: build.query<Tag[], { includeClosed?: boolean } | void>({
      query: (args) => ({
        url: `api/tags`,
        params: args && args.includeClosed === false ? { includeClosed: 'false' } : undefined,
      }),
      providesTags: ["tags"],
    }),
    createTag: build.mutation<Tag, { tag_name: string; color?: string | null; budget?: number | null; notes?: string | null }>({
      query: (tag) => ({
        url: `api/tags`,
        method: 'POST',
        body: tag,
      }),
      invalidatesTags: ["tags"],
    }),
    updateTag: build.mutation<Tag, { id: number; updates: Partial<Tag> }>({
      query: ({ id, updates }) => ({
        url: `api/tags/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ["tags", "tagSummary"],
    }),
    deleteTag: build.mutation<void, number>({
      query: (id) => ({
        url: `api/tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["tags", "transactionTags"],
    }),
    getTagSummary: build.query<TagSummary, number>({
      query: (id) => ({
        url: `api/tags/${id}/summary`,
      }),
      providesTags: ["tagSummary"],
    }),
    getTransactionTags: build.query<Tag[], number>({
      query: (id) => ({
        url: `api/transactions/${id}/tags`,
      }),
      providesTags: ["transactionTags"],
    }),
    searchTransactions: build.query<SearchResult, SearchFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        const set = (key: string, value: unknown) => {
          if (value === undefined || value === '' || value === false) return;
          params.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
        };

        set('query', filters.query);
        set('startDate', filters.startDate);
        set('endDate', filters.endDate);
        if (filters.categories?.length) set('categories', filters.categories);
        if (filters.accounts?.length) set('accounts', filters.accounts);
        if (filters.tagIds?.length) set('tagIds', filters.tagIds);
        set('debitCredit', filters.debitCredit);
        set('minAmount', filters.minAmount);
        set('maxAmount', filters.maxAmount);
        set('uncategorised', filters.uncategorised);
        set('includeInternal', filters.includeInternal);
        set('sortBy', filters.sortBy);
        set('sortDir', filters.sortDir);
        set('limit', filters.limit);
        set('offset', filters.offset);

        return { url: `api/transactions/search`, params };
      },
      providesTags: ["searchTransactions"],
    }),
    getTransactionAccounts: build.query<TransactionAccount[], void>({
      query: () => ({ url: `api/transactions/accounts` }),
      providesTags: ["transactionAccounts"],
    }),
    bulkUpdateTransactions: build.mutation<{ updated: number }, { ids: number[]; updates: Record<string, unknown> }>({
      query: (body) => ({
        url: `api/transactions/bulk`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ["searchTransactions", "transactions", "categorySums",
                        "incomeExpensesSum", "emptyCategoryTransactions",
                        "accountOverview"],
    }),
    bulkSetTag: build.mutation<{ affected: number }, { ids: number[]; tagId: number; mode: 'add' | 'remove' }>({
      query: (body) => ({
        url: `api/transactions/bulk-tag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ["searchTransactions", "transactionTags", "tags", "tagSummary"],
    }),
    getAccounts: build.query<Account[], void>({
      query: () => ({ url: `api/accounts` }),
      providesTags: ["accounts"],
    }),
    getUnknownAccounts: build.query<UnknownAccount[], void>({
      query: () => ({ url: `api/accounts/unknown` }),
      providesTags: ["unknownAccounts"],
    }),
    createAccount: build.mutation<Account, Omit<Account, 'id' | 'transaction_count'>>({
      query: (account) => ({
        url: `api/accounts`,
        method: 'POST',
        body: account,
      }),
      // A newly named account changes the overview, empties it from the unknown
      // list, and makes its rows eligible for transfer detection.
      invalidatesTags: ["accounts", "unknownAccounts", "accountOverview",
                        "investmentAccounts", "transferCandidates"],
    }),
    updateAccount: build.mutation<Account, { id: number; updates: Partial<Account> }>({
      query: ({ id, updates }) => ({
        url: `api/accounts/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      // Renaming an identifier rewrites it on every transaction that used it.
      invalidatesTags: ["accounts", "unknownAccounts", "accountOverview",
                        "investmentAccounts", "transactions", "transferCandidates"],
    }),
    deleteAccount: build.mutation<void, number>({
      query: (id) => ({
        url: `api/accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["accounts", "unknownAccounts", "accountOverview", "investmentAccounts"],
    }),
    getTransferCandidates: build.query<TransferCandidate[], { ids?: string } | void>({
      query: (args) => ({
        url: `api/transfer-candidates`,
        params: args && args.ids ? { ids: args.ids } : undefined,
      }),
      providesTags: ["transferCandidates"],
    }),
    getTransfers: build.query<Transfer[], void>({
      query: () => ({ url: `api/transfers` }),
      providesTags: ["transfers"],
    }),
    confirmTransfer: build.mutation<Transfer, { fromTransactionId: number; toTransactionId: number; matchBasis: 'iban' | 'amount' }>({
      query: (body) => ({
        url: `api/transfers`,
        method: 'POST',
        body,
      }),
      // Confirming removes both rows from the summaries and categorises them,
      // so every derived figure and the review list change with it.
      invalidatesTags: ["transferCandidates", "transfers", "transactions",
                        "categorySums", "incomeExpensesSum",
                        "emptyCategoryTransactions"],
    }),
    rejectTransfer: build.mutation<void, { fromTransactionId: number; toTransactionId: number }>({
      query: (body) => ({
        url: `api/transfers/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ["transferCandidates"],
    }),
    unlinkTransfer: build.mutation<void, number>({
      query: (id) => ({
        url: `api/transfers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["transfers", "transferCandidates", "transactions",
                        "categorySums", "incomeExpensesSum"],
    }),
    setTransactionTags: build.mutation<Tag[], { id: number; tagIds: number[] }>({
      query: ({ id, tagIds }) => ({
        url: `api/transactions/${id}/tags`,
        method: 'PUT',
        body: { tagIds },
      }),
      invalidatesTags: ["transactionTags", "tags", "tagSummary"],
    }),
  }),
});

export const { 
  useGetTransactionsQuery,
  useGetCategorySumsQuery,
  useGetIncomeExpensesSumQuery,
  useUploadTransactionsMutation,
  useGetEmptyCategoryTransactionsQuery,
  useUpdateTransactionMutation,
  useGetAccountOverviewQuery,
  useGetCategoryListQuery,
  useGetInvestmentAccountsQuery,
  useUploadInvestmentsMutation,
  useDeleteTransactionMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useGetTagSummaryQuery,
  useGetTransactionTagsQuery,
  useSetTransactionTagsMutation,
  useGetTransferCandidatesQuery,
  useGetTransfersQuery,
  useConfirmTransferMutation,
  useRejectTransferMutation,
  useUnlinkTransferMutation,
  useGetAccountsQuery,
  useGetUnknownAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useSearchTransactionsQuery,
  useGetTransactionAccountsQuery,
  useBulkUpdateTransactionsMutation,
  useBulkSetTagMutation,
} = api;
