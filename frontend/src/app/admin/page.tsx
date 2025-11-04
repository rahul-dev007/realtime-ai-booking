'use client';

import Link from 'next/link'; // 👈 added
import RequireAdmin from '../../components/RequireAdmin';
import {
  useAdminListBookingsQuery,
  useAdminDeleteBookingMutation,
  useAdminConfirmMutation,
  useAdminCancelMutation,
} from '../../services/api';
import { toast } from '../../ui/useToast';

export default function AdminPage() {
  // ⚠️ adminListBookings returns { items, total, page, limit }
  const { data, isLoading, isError, refetch, isFetching } = useAdminListBookingsQuery();
  const [adminDelete, { isLoading: deleting }] = useAdminDeleteBookingMutation();
  const [adminConfirm, { isLoading: confirming }] = useAdminConfirmMutation();
  const [adminCancel, { isLoading: cancelling }] = useAdminCancelMutation();

  const items = data?.items ?? [];

  return (
    <RequireAdmin>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Admin • All Bookings</h1>
          <p className="text-sm text-neutral-600">
            View and manage all users’ bookings ({data?.total ?? 0} total).
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-ghost" disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <div className="card p-4 skeleton h-20" />
          <div className="card p-4 skeleton h-20" />
        </div>
      )}

      {isError && (
        <div className="card p-6 border border-red-300 rounded">
          <div className="text-red-600 font-medium">Failed to load admin bookings.</div>
          <div className="text-sm text-neutral-600 mt-1">
            Check that backend <code>/admin/bookings</code> route returns
            {' {items, total, page, limit} '} and you are logged in as admin.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Date/Time</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b: any) => (
                <tr key={b._id} className="border-b last:border-0">
                  <td className="p-3 text-neutral-600 truncate max-w-[200px]">
                    {String(b.userId)}
                  </td>
                  <td className="p-3">{b.title}</td>
                  <td className="p-3">
                    {b.time ? new Date(b.time).toLocaleString() : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        'inline-flex items-center rounded px-2 py-0.5 text-xs ' +
                        (b.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : b.status === 'cancelled'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-neutral-100 text-neutral-700')
                      }
                    >
                      {b.status ?? 'pending'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {/* 👇 Open Chat (admin side) */}
                    <Link
                      href={`/chat/booking/${b._id}`}
                      className="btn btn-ghost text-blue-600"
                    >
                      Open Chat
                    </Link>

                    <button
                      onClick={async () => {
                        try {
                          await adminConfirm(b._id).unwrap();
                          toast({ title: 'Booking confirmed' });
                        } catch {
                          toast({ title: 'Confirm failed', variant: 'destructive' });
                        }
                      }}
                      className="btn btn-ghost text-green-700"
                      disabled={confirming || b.status === 'confirmed'}
                    >
                      {confirming ? 'Confirming…' : 'Confirm'}
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await adminCancel(b._id).unwrap();
                          toast({ title: 'Booking cancelled' });
                        } catch {
                          toast({ title: 'Cancel failed', variant: 'destructive' });
                        }
                      }}
                      className="btn btn-ghost text-amber-700"
                      disabled={cancelling || b.status === 'cancelled'}
                    >
                      {cancelling ? 'Cancelling…' : 'Cancel'}
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await adminDelete(b._id).unwrap();
                          toast({ title: 'Booking deleted' });
                        } catch {
                          toast({ title: 'Delete failed', variant: 'destructive' });
                        }
                      }}
                      className="btn btn-ghost text-red-600"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ছোট pager hint (optional) */}
          <div className="p-3 text-xs text-neutral-500 flex justify-between">
            <span>Page {data?.page ?? 1} • Limit {data?.limit ?? 20}</span>
            <span>Total {data?.total ?? 0}</span>
          </div>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-6 text-neutral-600">No bookings found.</div>
      )}
    </RequireAdmin>
  );
}
