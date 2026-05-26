import { apiSlice } from "./apiSlice";

export const trainsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrains: builder.query({
      query: ({ search, leg, page, perPage, status, startDate, endDate } = {}) => {
        const q = new URLSearchParams();
        if (search) q.append("search", search);
        if (leg) q.append("leg", leg);
        if (page !== undefined) q.append("page", String(page));
        if (perPage !== undefined) q.append("per_page", String(perPage));
        if (status) q.append("status", status);
        if (startDate) q.append("start_date", startDate);
        if (endDate) q.append("end_date", endDate);
        return `/trains?${q.toString()}`;
      },
      providesTags: ["Trains"],
    }),
    getTrain: builder.query({
      query: (id) => `/trains/${id}`,
      providesTags: (result, error, id) => [{ type: "Trains", id }],
    }),
    createTrain: builder.mutation({
      query: (trn) => ({
        url: `/trains`,
        method: "POST",
        body: trn,
      }),
      invalidatesTags: ["Trains"],
    }),
    updateTrain: builder.mutation({
      query: ({ id, ...trn }) => ({
        url: `/trains/${id}`,
        method: "PUT",
        body: trn,
      }),
      invalidatesTags: (result, error, { id }) => ["Trains", { type: "Trains", id }],
    }),
    deleteTrain: builder.mutation({
      query: (id) => ({
        url: `/trains/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Trains"],
    }),
  }),
});

export const {
  useGetTrainsQuery,
  useGetTrainQuery,
  useCreateTrainMutation,
  useUpdateTrainMutation,
  useDeleteTrainMutation,
} = trainsApi;
