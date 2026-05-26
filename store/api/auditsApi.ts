import { apiSlice } from "./apiSlice";

export const auditsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAudits: builder.query({
      query: () => `/audits`,
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
