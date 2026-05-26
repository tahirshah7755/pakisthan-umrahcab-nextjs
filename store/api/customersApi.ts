import { apiSlice } from "./apiSlice";

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (args: { search?: string; company?: string; page?: number; perPage?: number } = {}) => {
        const { search, company, page, perPage } = args;
        const q = new URLSearchParams();
        if (search) q.append("search", search);
        if (company) q.append("company", company);
        if (page !== undefined) q.append("page", String(page));
        if (perPage !== undefined) q.append("per_page", String(perPage));
        return `/customers?${q.toString()}`;
      },
      providesTags: ["Customers"],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customers", id }],
    }),
    createCustomer: builder.mutation({
      query: (cust) => ({
        url: `/customers`,
        method: "POST",
        body: cust,
      }),
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...cust }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: cust,
      }),
      invalidatesTags: (result, error, { id }) => ["Customers", { type: "Customers", id }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} = customersApi;
