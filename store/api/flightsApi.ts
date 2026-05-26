import { apiSlice } from "./apiSlice";

export const flightsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFlights: builder.query({
      query: (args: { search?: string; leg?: string; page?: number; perPage?: number; status?: string; startDate?: string; endDate?: string } = {}) => {
        const { search, leg, page, perPage, status, startDate, endDate } = args;
        const q = new URLSearchParams();
        if (search) q.append("search", search);
        if (leg) q.append("leg", leg);
        if (page !== undefined) q.append("page", String(page));
        if (perPage !== undefined) q.append("per_page", String(perPage));
        if (status) q.append("status", status);
        if (startDate) q.append("start_date", startDate);
        if (endDate) q.append("end_date", endDate);
        return `/flights?${q.toString()}`;
      },
      providesTags: ["Flights"],
    }),
    getFlight: builder.query({
      query: (id) => `/flights/${id}`,
      providesTags: (result, error, id) => [{ type: "Flights", id }],
    }),
    createFlight: builder.mutation({
      query: (flt) => ({
        url: `/flights`,
        method: "POST",
        body: flt,
      }),
      invalidatesTags: ["Flights"],
    }),
    updateFlight: builder.mutation({
      query: ({ id, ...flt }) => ({
        url: `/flights/${id}`,
        method: "PUT",
        body: flt,
      }),
      invalidatesTags: (result, error, { id }) => ["Flights", { type: "Flights", id }],
    }),
    deleteFlight: builder.mutation({
      query: (id) => ({
        url: `/flights/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Flights"],
    }),
  }),
});

export const {
  useGetFlightsQuery,
  useGetFlightQuery,
  useCreateFlightMutation,
  useUpdateFlightMutation,
  useDeleteFlightMutation,
} = flightsApi;
