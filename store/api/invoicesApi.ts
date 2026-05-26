import { apiSlice } from "./apiSlice";

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query({
      query: () => `/invoices`,
      providesTags: ["Invoices"],
    }),
    createInvoice: builder.mutation({
      query: (inv) => ({
        url: `/invoices`,
        method: "POST",
        body: inv,
      }),
      invalidatesTags: ["Invoices"],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
} = invoicesApi;
