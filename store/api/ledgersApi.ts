import { apiSlice } from "./apiSlice";

export const ledgersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLedgers: builder.query({
      query: () => `/ledgers`,
      providesTags: ["Ledgers"],
    }),
    createLedger: builder.mutation({
      query: (ld) => ({
        url: `/ledgers`,
        method: "POST",
        body: ld,
      }),
      invalidatesTags: ["Ledgers"],
    }),
  }),
});

export const {
  useGetLedgersQuery,
  useCreateLedgerMutation,
} = ledgersApi;
