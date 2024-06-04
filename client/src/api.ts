// api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: ["transactions", "categorySums", "incomeExpensesSum", "uploadTransactions", "emptyCategoryTransactions", "transaction", "accountOverview"],
  endpoints: (build) => ({
    getTransactions: build.query<any, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({
        url: `api/transactions`,
        params: { startDate, endDate },
      }),
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
    postUploadTransactions: build.mutation<any, { formData: FormData, bankType: string }>({
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
    // You can add more endpoints here following the same pattern
    // ...
  }),
});

export const { 
  useGetTransactionsQuery,
  useGetCategorySumsQuery,
  useGetIncomeExpensesSumQuery,
  usePostUploadTransactionsMutation,
  useGetEmptyCategoryTransactionsQuery,
  useUpdateTransactionMutation,
  useGetAccountOverviewQuery,
} = api;
