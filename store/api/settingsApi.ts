import { apiSlice } from "./apiSlice";

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => `/admin/system-setting`,
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation({
      query: (settings) => ({
        url: `/admin/system-setting`,
        method: "POST",
        body: settings,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = settingsApi;
