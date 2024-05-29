import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: ["transactions", "categorySums", "incomeExpensesSum"],
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
    // You can add more endpoints here following the same pattern
    // ...
  }),
});

export const { 
  useGetTransactionsQuery,
  useGetCategorySumsQuery,
  useGetIncomeExpensesSumQuery,
} = api;
