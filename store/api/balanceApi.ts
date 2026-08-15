import { apiSlice } from "./apiSlice";

export const balanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBalanceSummary: builder.query<any, { company?: string; tab?: string } | void>({
      query: (params) => {
        const p: Record<string, string> = {};
        if (params?.company) p.company = params.company;
        if (params?.tab && params.tab !== "all") p.tab = params.tab;
        const qs = new URLSearchParams(p).toString();
        return `/balance/summary${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Ledgers", "Invoices", "Payments", "Companies", "Bookings", "Customers", "Services", "Followups"],
    }),
  }),
});

export const { useGetBalanceSummaryQuery } = balanceApi;
