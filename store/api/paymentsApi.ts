import { apiSlice } from "./apiSlice";

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: () => `/payments`,
      providesTags: ["Payments"],
    }),
    createPayment: builder.mutation({
      query: (pm) => ({
        url: `/payments`,
        method: "POST",
        body: pm,
      }),
      invalidatesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useCreatePaymentMutation,
} = paymentsApi;
