import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "umrahCabApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab",
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = sessionStorage.getItem("umrahcab_token") || sessionStorage.getItem("umrahcab_company_token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
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
