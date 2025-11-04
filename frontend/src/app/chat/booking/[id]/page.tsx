'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useGetChatQuery, useSendChatMutation, type Message } from '../../../../services/api';
import { toast } from '../../../../ui/useToast';

let socketRef: Socket | null = null;

export default function BookingChatPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const { data: initial, isLoading, isError, refetch } = useGetChatQuery(bookingId);
  const [sendChat, { isLoading: sending }] = useSendChatMutation();
  const [text, setText] = useState('');

  // singleton socket
  const socket = useMemo(() => {
    if (!socketRef) {
      socketRef = io(process.env.NEXT_PUBLIC_API_URL!, {
        transports: ['websocket'],
        withCredentials: true,
      });
    }
    return socketRef;
  }, []);

  // live messages (socket)
  const [live, setLive] = useState<Message[]>([]);

  useEffect(() => {
    socket.emit('join:booking', bookingId);

    const onMsg = (m: Message) => {
      // একই বুকিং এর মেসেজ হলে তালিকায় যোগ করো
      if (String(m.bookingId) === String(bookingId)) {
        setLive((prev) => [...prev, m]);
      }
    };

    socket.on('chat:message', onMsg);

    return () => {
      socket.emit('leave:booking', bookingId);
      socket.off('chat:message', onMsg);
    };
  }, [socket, bookingId]);

  const all = [...(initial ?? []), ...live];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chat for Booking #{bookingId}</h1>
        <button className="btn btn-ghost" onClick={() => refetch()}>Refresh</button>
      </div>

      {isLoading && <div className="card p-4">Loading messages…</div>}
      {isError && <div className="card p-4 border-red-300 text-red-600">Failed to load chat.</div>}

      <div className="card p-4 h-[55vh] overflow-y-auto space-y-2">
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
          const content = text.trim();
          if (!content) return;
          try {
            await sendChat({ bookingId, content }).unwrap(); // POST /chat/:id/send
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
