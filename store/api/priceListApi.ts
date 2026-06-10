import { apiSlice } from "./apiSlice";

export const priceListApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPriceList: builder.query({
      query: (params?: { page?: number; per_page?: number; search?: string }) => {
        const q = new URLSearchParams();
        if (params?.page) q.append("page", String(params.page));
        if (params?.per_page) q.append("per_page", String(params.per_page));
        if (params?.search) q.append("search", params.search);
        const queryStr = q.toString();
        return `/price-list${queryStr ? `?${queryStr}` : ""}`;
      },
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
