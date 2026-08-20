import { apiSlice } from "./apiSlice";

export const priceListApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPriceList: builder.query({
      query: (params?: { page?: number; per_page?: number; search?: string; group_name?: string; paginate?: string | boolean }) => {
        const q = new URLSearchParams();
        if (params?.page) q.append("page", String(params.page));
        if (params?.per_page) q.append("per_page", String(params.per_page));
        if (params?.search) q.append("search", params.search);
        if (params?.group_name) q.append("group_name", params.group_name);
        if (params?.paginate !== undefined) q.append("paginate", String(params.paginate));
        const queryStr = q.toString();
        return `/price-list${queryStr ? `?${queryStr}` : ""}`;
      },
      providesTags: ["PriceList"],
    }),
    getPriceGroups: builder.query<string[], void>({
      query: () => `/price-list/groups`,
      providesTags: ["PriceList"],
    }),
    createPriceList: builder.mutation({
      query: (pkg) => ({
        url: `/price-list`,
        method: "POST",
        body: pkg,
      }),
      invalidatesTags: ["PriceList"],
    }),
    updatePriceList: builder.mutation({
      query: ({ id, ...prices }) => ({
        url: `/price-list/${id}`,
        method: "PUT",
        body: prices,
      }),
      invalidatesTags: ["PriceList"],
    }),
    deletePriceList: builder.mutation({
      query: (arg: number | { id: number; group_name?: string }) => {
        const id = typeof arg === "object" ? arg.id : arg;
        const groupName = typeof arg === "object" ? arg.group_name : undefined;
        return {
          url: `/price-list/${id}${groupName ? `?group_name=${encodeURIComponent(groupName)}` : ""}`,
          method: "DELETE",
        };
      },
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
  useGetPriceGroupsQuery,
  useCreatePriceListMutation,
  useUpdatePriceListMutation,
  useDeletePriceListMutation,
  useApplyBulkPriceListMutation,
} = priceListApi;
