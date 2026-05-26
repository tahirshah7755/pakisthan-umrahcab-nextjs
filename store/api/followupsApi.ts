import { apiSlice } from "./apiSlice";

export const followupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowups: builder.query<any, {
      page?: number;
      per_page?: number;
      search?: string;
      company?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    } | void>({
      query: (params) => {
        const p: Record<string, string> = {};
        if (params) {
          if (params.page)       p.page       = String(params.page);
          if (params.per_page)   p.per_page   = String(params.per_page);
          if (params.search)     p.search     = params.search;
          if (params.company)    p.company    = params.company;
          if (params.status)     p.status     = params.status;
          if (params.start_date) p.start_date = params.start_date;
          if (params.end_date)   p.end_date   = params.end_date;
        }
        const qs = new URLSearchParams(p).toString();
        return `/followups${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Followups"],
    }),
    getFollowup: builder.query({
      query: (id) => `/followups/${id}`,
      providesTags: (result, error, id) => [{ type: "Followups", id }],
    }),
    createFollowup: builder.mutation({
      query: (flp) => ({
        url: `/followups`,
        method: "POST",
        body: flp,
      }),
      invalidatesTags: ["Followups"],
    }),
    updateFollowup: builder.mutation({
      query: ({ id, ...flp }) => ({
        url: `/followups/${id}`,
        method: "PUT",
        body: flp,
      }),
      invalidatesTags: (result, error, { id }) => ["Followups", { type: "Followups", id }],
    }),
    deleteFollowup: builder.mutation({
      query: (id) => ({
        url: `/followups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Followups"],
    }),
  }),
});

export const {
  useGetFollowupsQuery,
  useGetFollowupQuery,
  useCreateFollowupMutation,
  useUpdateFollowupMutation,
  useDeleteFollowupMutation,
} = followupsApi;
