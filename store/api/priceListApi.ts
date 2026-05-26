import { apiSlice } from "./apiSlice";

export const priceListApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPriceList: builder.query({
      query: () => `/price-list`,
      providesTags: ["PriceList"],
    }),
    updatePriceList: builder.mutation({
      query: ({ id, ...prices }) => ({
        url: `/price-list/${id}`,
        method: "PUT",
        body: prices,
      }),
      invalidatesTags: ["PriceList"],
    }),
    applyBulkPriceList: builder.mutation({
      query: (bulk) => ({
        url: `/price-list/bulk`,
        method: "POST",
        body: bulk,
      }),
      invalidatesTags: ["PriceList"],
    }),
  }),
});

export const {
  useGetPriceListQuery,
  useUpdatePriceListMutation,
  useApplyBulkPriceListMutation,
} = priceListApi;
