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

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: ["transactions", "categorySums", "incomeExpensesSum", "uploadTransactions", "emptyCategoryTransactions", "transaction", "accountOverview", "categoryList", "investmentAccounts", "uploadInvestments", "deleteTransactions", "tags", "tagSummary", "transactionTags"],
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
    uploadTransactions: build.mutation<any, { formData: FormData, bankType: string }>({
      query: ({ formData, bankType }) => ({
        url: `api/upload-transactions`,
        method: 'POST',
        body: formData,
        params: {bankType}
      }),
      invalidatesTags: ["uploadTransactions"],
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
      invalidatesTags: ["transaction"],
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
      invalidatesTags: ['uploadInvestments'],
    }),
    deleteTransaction: build.mutation<void, number>({
      query: (id) => ({
        url: `api/remove-transaction/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["deleteTransactions"],
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
} = api;
