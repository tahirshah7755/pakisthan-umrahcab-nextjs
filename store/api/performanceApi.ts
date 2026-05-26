import { apiSlice } from "./apiSlice";

export const performanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPerformance: builder.query({
      query: () => `/performance`,
      providesTags: ["Performance"],
    }),
  }),
});

export const { useGetPerformanceQuery } = performanceApi;
