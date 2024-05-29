import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: ["transactions"],
  endpoints: (build) => ({
    getTransactions: build.query<void, { startDate: string; endDate: string }>({
      query: ({ startDate, endDate }) => ({
        url: `api/transactions`,
        params: { startDate, endDate },
      }),
      providesTags: ["transactions"],
    }),
  }),
});

export const { useGetTransactionsQuery } = api;
