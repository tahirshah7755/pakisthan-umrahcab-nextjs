import { apiSlice } from "./apiSlice";

export const invoicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<any, { page?: number; per_page?: number; search?: string; status?: string; company?: string; type?: string; start_date?: string; end_date?: string } | void>({
      query: (params) => {
        const p: Record<string, any> = {};
        if (params) {
          if (params.page) p.page = params.page;
          if (params.per_page) p.per_page = params.per_page;
          if (params.search) p.search = params.search;
          if (params.status && params.status !== "all") p.status = params.status;
          if (params.company) p.company = params.company;
          if (params.type && params.type !== "all") p.type = params.type;
          if (params.start_date) p.start_date = params.start_date;
          if (params.end_date) p.end_date = params.end_date;
        }
        const qs = new URLSearchParams(p).toString();
        return `/invoices${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Invoices"],
    }),
    getInvoice: builder.query<any, string | number>({
      query: (id) => `/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: "Invoices", id }],
    }),
    createInvoice: builder.mutation({
      query: (inv) => ({
        url: `/invoices`,
        method: "POST",
        body: inv,
      }),
      invalidatesTags: ["Invoices"],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...inv }) => ({
        url: `/invoices/${id}`,
        method: "PUT",
        body: inv,
      }),
      invalidatesTags: ["Invoices"],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoices"],
    }),
    calculateInvoice: builder.mutation({
      query: (params) => ({
        url: `/invoices/calculate`,
        method: "POST",
        body: params,
      }),
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useCalculateInvoiceMutation,
} = invoicesApi;
