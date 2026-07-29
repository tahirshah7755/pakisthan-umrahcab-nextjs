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
    getDirectClientsLedger: builder.query({
      query: (params) => ({
        url: `/ledgers/direct-clients`,
        params: params,
      }),
      providesTags: ["Ledgers"],
    }),
  }),
});

export const {
  useGetLedgersQuery,
  useGetDirectClientsLedgerQuery,
  useCreateLedgerMutation,
} = ledgersApi;

