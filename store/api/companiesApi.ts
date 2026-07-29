import { apiSlice } from "./apiSlice";

export const companiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanies: builder.query({
      query: () => `/companies`,
      providesTags: ["Companies"],
    }),
    createCompany: builder.mutation({
      query: (comp) => ({
        url: `/companies`,
        method: "POST",
        body: comp,
      }),
      invalidatesTags: ["Companies"],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...comp }) => ({
        url: `/companies/${id}`,
        method: "PUT",
        body: comp,
      }),
      invalidatesTags: ["Companies", "Ledgers", "Invoices", "Payments"],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} = companiesApi;
