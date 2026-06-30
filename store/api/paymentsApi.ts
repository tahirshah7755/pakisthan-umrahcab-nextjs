import { apiSlice } from "./apiSlice";

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({
        url: `/payments`,
        params,
      }),
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
    updatePaymentStatus: builder.mutation({
      query: ({ id, status, approved_amount }) => ({
        url: `/payments/${id}/status`,
        method: "PUT",
        body: { status, approved_amount },
      }),
      invalidatesTags: ["Payments", "Companies"],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentStatusMutation,
} = paymentsApi;
