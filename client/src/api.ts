import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BASE_URL }),
  reducerPath: "main",
  tagTypes: ["users"],
  endpoints: (build) => ({
    getUsers: build.query<void, void>({
      query: () => "api/users",
      providesTags: ["users"],
    }),
  }),
});

export const { useGetUsersQuery } = api;
