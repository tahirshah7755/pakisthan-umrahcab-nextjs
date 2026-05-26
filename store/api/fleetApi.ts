import { apiSlice } from "./apiSlice";

export const fleetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFleet: builder.query({
      query: () => `/fleet`,
      providesTags: ["Fleet"],
    }),
    updateFleet: builder.mutation({
      query: ({ id, count, active }) => ({
        url: `/fleet/${id}`,
        method: "PUT",
        body: { count, active },
      }),
      invalidatesTags: ["Fleet"],
    }),
  }),
});

export const {
  useGetFleetQuery,
  useUpdateFleetMutation,
} = fleetApi;
