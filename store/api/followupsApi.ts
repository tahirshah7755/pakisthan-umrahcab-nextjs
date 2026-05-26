import { apiSlice } from "./apiSlice";

export const followupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowups: builder.query({
      query: () => `/followups`,
      providesTags: ["Followups"],
    }),
    createFollowup: builder.mutation({
      query: (flp) => ({
        url: `/followups`,
        method: "POST",
        body: flp,
      }),
      invalidatesTags: ["Followups"],
    }),
  }),
});

export const {
  useGetFollowupsQuery,
  useCreateFollowupMutation,
} = followupsApi;
