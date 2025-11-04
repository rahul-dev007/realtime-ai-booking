import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/** ---------------- Base Query with 401 redirect ---------------- */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  credentials: 'include', // cookie-based auth
});

const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const res = await rawBaseQuery(args, api, extraOptions);
  const status = (res as any)?.error?.status;
  if (typeof window !== 'undefined') {
    if (status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
  }
  return res;
};

/** ---------------- Types ---------------- */
export type Role = 'user' | 'admin';
export type UserSummary = { id: string; role: Role };

export type Booking = {
  _id: string;
  title: string;
  time: string;           // ISO string
  status: 'pending' | 'confirmed' | 'cancelled';
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  _id: string;
  bookingId: string;
  senderId: string | null;
  content: string;
  kind: 'text' | 'system';
  createdAt: string;
  updatedAt: string;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

/** ---------------- API ---------------- */
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Booking', 'Chat'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({

    /** Session */
    me: builder.query<{ user: UserSummary }, void>({
      query: () => '/auth/me',
    }),

    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    /** Auth */
    register: builder.mutation<{ user: any }, { email: string; password: string; name?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    login: builder.mutation<{ user: any }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    /** Bookings (user) */
    listBookings: builder.query<Booking[], void>({
      query: () => '/bookings',
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({ type: 'Booking' as const, id: b._id })),
              { type: 'Booking', id: 'LIST' },
            ]
          : [{ type: 'Booking', id: 'LIST' }],
    }),

    // backend expects { title, time }
    createBooking: builder.mutation<Booking, { title: string; time: string }>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: [{ type: 'Booking', id: 'LIST' }],
    }),

    deleteBooking: builder.mutation<{ ok: boolean; _id: string }, string>({
      query: (id) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Booking', id },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    /** Chat (RAG knowledge ask) */
    askChat: builder.mutation<
      { answer: string; sources?: { score: number; excerpt: string }[] },
      { question: string }
    >({
      query: (body) => ({ url: '/chat/ask', method: 'POST', body }),
    }),

    /** ---------- CHAT (booking room) ---------- */

    // history
    getChat: builder.query<Message[], string>({
      // bookingId
      query: (bookingId) => `/chat/${bookingId}`,
      providesTags: (_res, _err, bookingId) => [{ type: 'Chat', id: bookingId }],
    }),

    // send
    sendChat: builder.mutation<Message, { bookingId: string; content: string }>({
      query: ({ bookingId, content }) => ({
        url: `/chat/${bookingId}/send`,
        method: 'POST',
        body: { content },
      }),
      async onQueryStarted({ bookingId, content }, { dispatch, queryFulfilled, getState }) {
        // Optional optimistic feel: just refetch after success; socket will also append
        try {
          await queryFulfilled;
          // If you prefer strict cache control:
          // dispatch(api.util.invalidateTags([{ type: 'Chat', id: bookingId }]));
        } catch {
          // no-op
        }
      },
    }),

    /** ---------- ADMIN endpoints ---------- */

    // paged list
    adminListBookings: builder.query<Paged<Booking>, { status?: string; page?: number; limit?: number } | void>({
      query: (p) => {
        if (!p) return '/admin/bookings';
        const qs = new URLSearchParams();
        if (p.status) qs.set('status', p.status);
        if (p.page) qs.set('page', String(p.page));
        if (p.limit) qs.set('limit', String(p.limit));
        return `/admin/bookings${qs.toString() ? `?${qs.toString()}` : ''}`;
      },
      providesTags: (res) =>
        res?.items
          ? [
              ...res.items.map((b) => ({ type: 'Booking' as const, id: b._id })),
              { type: 'Booking', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Booking', id: 'ADMIN_LIST' }],
    }),

    adminConfirm: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/admin/bookings/${id}/confirm`, method: 'PATCH' }),
      invalidatesTags: (res) =>
        res
          ? [
              { type: 'Booking', id: res._id },
              { type: 'Booking', id: 'ADMIN_LIST' },
              { type: 'Booking', id: 'LIST' },
            ]
          : [],
    }),

    adminCancel: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/admin/bookings/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (res) =>
        res
          ? [
              { type: 'Booking', id: res._id },
              { type: 'Booking', id: 'ADMIN_LIST' },
              { type: 'Booking', id: 'LIST' },
            ]
          : [],
    }),

    adminDeleteBooking: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: (r, e, id) => [
        { type: 'Booking', id },
        { type: 'Booking', id: 'ADMIN_LIST' },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

  }),
});

/** ---------------- Hooks ---------------- */
export const {
  useMeQuery,
  useLazyMeQuery,
  useLogoutMutation,
  useRegisterMutation,
  useLoginMutation,
  useListBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
  useAskChatMutation,

  // chat
  useGetChatQuery,
  useLazyGetChatQuery,
  useSendChatMutation,

  // admin
  useAdminListBookingsQuery,
  useAdminConfirmMutation,
  useAdminCancelMutation,
  useAdminDeleteBookingMutation,
} = api;
