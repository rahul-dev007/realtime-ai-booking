'use client';
import Protected from './components/Protected';
import {
  useListBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from '../services/api';
import { useSocketCache } from '../hooks/useSocketCache';
import { useState } from 'react';
import { toast } from '../ui/useToast';
import Link from 'next/link'; // 👈 added

export default function Dashboard() {
  useSocketCache();

  const { data, isLoading, isFetching, isError, refetch } = useListBookingsQuery();
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: deleting }] = useDeleteBookingMutation();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState(''); // ISO string for datetime-local

  return (
    <Protected>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-neutral-600">
            Create, view, and manage your bookings in real-time.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-ghost" disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ---------- CREATE BOOKING FORM ---------- */}
      <div className="card p-4 mb-6">
        <form
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title || !time) {
              toast({ title: 'Please fill title & date/time' });
              return;
            }
            try {
              await createBooking({ title, time }).unwrap();
              setTitle('');
              setTime('');
              toast({ title: 'Booking created' });
            } catch {
              toast({ title: 'Failed to create booking', variant: 'destructive' });
            }
          }}
        >
          <div>
            <label className="label">Title</label>
            <input
              className="input w-full"
              placeholder="Team sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Date & Time</label>
            <input
              className="input w-full"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              className="btn btn-primary w-full"
              disabled={!title || !time || creating}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* ---------- LIST ---------- */}
      {isLoading && (
        <div className="space-y-2">
          <div className="card p-4 skeleton h-20" />
          <div className="card p-4 skeleton h-20" />
        </div>
      )}

      {isError && (
        <div className="card p-4 border-red-300">
          <div className="text-red-600">Failed to load bookings.</div>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="card p-6 text-neutral-600">
          No bookings yet. Create your first booking above.
        </div>
      )}

      {(data ?? []).length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Date & Time</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((b: any) => (
                <tr key={b._id} className="border-b last:border-0">
                  <td className="p-3">{b.title}</td>
                  <td className="p-3">{b.time ? new Date(b.time).toLocaleString() : '—'}</td>
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
                    {/* 👇 Chat লিংক: কনফার্মড হলে দেখাও */}
                    {b.status === 'confirmed' ? (
                      <Link href={`/chat/booking/${b._id}`} className="btn btn-ghost text-blue-600">
                        Open Chat
                      </Link>
                    ) : (
                      <button className="btn btn-ghost opacity-60 cursor-not-allowed" title="Chat available after confirmation" disabled>
                        Open Chat
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        try {
                          await deleteBooking(b._id).unwrap();
                          toast({ title: 'Deleted' });
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
        </div>
      )}
    </Protected>
  );
}
