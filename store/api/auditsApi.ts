import { apiSlice } from "./apiSlice";

export const auditsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAudits: builder.query<any, { page?: number; perPage?: number } | void>({
      query: (args) => {
        const { page = 1, perPage = 10 } = args || {};
        return `/audits?page=${page}&per_page=${perPage}`;
      },
      providesTags: ["Audits"],
    }),
    logAudit: builder.mutation({
      query: (action: string) => ({
        url: `/audits`,
        method: "POST",
        body: { performed_action: action },
      }),
      invalidatesTags: ["Audits"],
    }),
  }),
});

export const {
  useGetAuditsQuery,
  useLogAuditMutation,
} = auditsApi;
