import { apiSlice } from "./apiSlice";

export const bookingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: (search?: string) => `/bookings${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      providesTags: ["Bookings"],
    }),
    getBookingStatus: builder.query({
      query: (code: string) => `/bookings/status/${encodeURIComponent(code)}`,
    }),
    getDashboardSummary: builder.query({
      query: () => `/bookings/summary`,
      providesTags: ["Bookings"],
    }),
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: `/bookings`,
        method: "POST",
        body: bookingData,
      }),
      invalidatesTags: ["Bookings"],
    }),
    updateBooking: builder.mutation({
      query: ({ id, ...bookingData }) => ({
        url: `/bookings/${id}`,
        method: "PUT",
        body: bookingData,
      }),
      invalidatesTags: ["Bookings"],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingStatusQuery,
  useGetDashboardSummaryQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
} = bookingsApi;
