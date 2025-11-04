'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useGetChatQuery, useSendChatMutation } from '../../services/api';
import { toast } from '../../ui/useToast';

let socket: Socket | null = null;

export default function BookingChatPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const { data: initial, isLoading, isError, refetch } = useGetChatQuery(bookingId);
  const [sendChat, { isLoading: sending }] = useSendChatMutation();
  const [text, setText] = useState('');

  // singleton socket
  const s = useMemo(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL!, {
        transports: ['websocket'],
        withCredentials: true,
      });
    }
    return socket;
  }, []);

  // local live messages
  const [live, setLive] = useState<any[]>([]);

  useEffect(() => {
    s.emit('join:booking', bookingId);
    const onMsg = (m: any) => {
      if (String(m.bookingId) === String(bookingId)) {
        setLive((prev) => [...prev, m]);
      }
    };
    s.on('chat:message', onMsg);

    return () => {
      s.emit('leave:booking', bookingId);
      s.off('chat:message', onMsg);
    };
  }, [s, bookingId]);

  const all = [...(initial ?? []), ...live];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chat • Booking #{bookingId}</h1>
        <button className="btn btn-ghost" onClick={() => refetch()}>Refresh</button>
      </div>

      {isLoading && <div className="card p-4">Loading messages…</div>}
      {isError && <div className="card p-4 border-red-300 text-red-600">Failed to load chat.</div>}

      <div className="card p-4 h-[50vh] overflow-y-auto space-y-2">
        {all.map((m) => (
          <div key={m._id} className="text-sm">
            {m.kind === 'system' ? (
              <div className="opacity-70">[system] {m.content}</div>
            ) : (
              <div>{m.content}</div>
            )}
          </div>
        ))}
        {all.length === 0 && <div className="opacity-60">No messages yet.</div>}
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          try {
            await sendChat({ bookingId, content: text }).unwrap();
            setText('');
          } catch {
            toast({ title: 'Failed to send', variant: 'destructive' });
          }
        }}
      >
        <input
          className="input flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary" disabled={sending || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
