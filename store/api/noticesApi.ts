import { apiSlice } from "./apiSlice";

export const noticesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query({
      query: (target?: string) => `/notices${target ? `?target=${target}` : ""}`,
      providesTags: ["Notices"],
    }),
    createNotice: builder.mutation({
      query: (nt) => ({
        url: `/notices`,
        method: "POST",
        body: nt,
      }),
      invalidatesTags: ["Notices"],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useCreateNoticeMutation,
} = noticesApi;
