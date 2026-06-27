import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "umrahCabApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab",
    credentials: "include",
  }),
  tagTypes: [
    "Bookings",
    "Customers",
    "Companies",
    "Services",
    "Flights",
    "Trains",
    "Invoices",
    "Ledgers",
    "Payments",
    "Notices",
    "Fleet",
    "Audits",
    "Followups",
    "PriceList",
    "Users",
    "Performance",
    "Settings",
  ],
  endpoints: () => ({}),
});
