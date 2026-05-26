import { apiSlice } from "./apiSlice";

export const servicesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query({
      query: (args: { search?: string; type?: string; page?: number; perPage?: number; status?: string; catalog?: boolean } = {}) => {
        const { search, type, page, perPage, status, catalog } = args;
        const q = new URLSearchParams();
        if (search) q.append("search", search);
        if (type) q.append("type", type);
        if (page !== undefined) q.append("page", String(page));
        if (perPage !== undefined) q.append("per_page", String(perPage));
        if (status) q.append("status", status);
        if (catalog) q.append("catalog", "true");
        return `/services?${q.toString()}`;
      },
      providesTags: ["Services"],
    }),
    getService: builder.query({
      query: (id) => `/services/${id}`,
      providesTags: (result, error, id) => [{ type: "Services", id }],
    }),
    createService: builder.mutation({
      query: (srv) => ({
        url: `/services`,
        method: "POST",
        body: srv,
      }),
      invalidatesTags: ["Services"],
    }),
    updateService: builder.mutation({
      query: ({ id, ...srv }) => ({
        url: `/services/${id}`,
        method: "PUT",
        body: srv,
      }),
      invalidatesTags: (result, error, { id }) => ["Services", { type: "Services", id }],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Services"],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = servicesApi;
