import { apiSlice } from "./apiSlice";

export const fleetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFleet: builder.query({
      query: () => `/fleet`,
      providesTags: ["Fleet"],
    }),
    addFleet: builder.mutation({
      query: (newVehicle) => ({
        url: `/fleet`,
        method: "POST",
        body: newVehicle,
      }),
      invalidatesTags: ["Fleet"],
    }),
    updateFleet: builder.mutation({
      query: ({ id, count, active, capacity, luggage }) => ({
        url: `/fleet/${id}`,
        method: "PUT",
        body: { count, active, capacity, luggage },
      }),
      invalidatesTags: ["Fleet"],
    }),
    deleteFleet: builder.mutation({
      query: (id) => ({
        url: `/fleet/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Fleet"],
    }),
  }),
});

export const {
  useGetFleetQuery,
  useAddFleetMutation,
  useUpdateFleetMutation,
  useDeleteFleetMutation,
} = fleetApi;
