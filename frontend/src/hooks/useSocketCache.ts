import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';
import { useDispatch } from 'react-redux';
import { toast } from '../ui/useToast';

let socket: Socket | null = null;

export function useSocketCache() {
  const dispatch = useDispatch();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    if (!socket) {
      socket = io(apiUrl, { transports: ['websocket'], withCredentials: true });

      // debug: দেখবে connect হলে log হবে
      socket.on('connect', () => console.log('[socket] connected:', socket!.id));
    }

    const invalUser = () => dispatch(api.util.invalidateTags([{ type: 'Booking', id: 'LIST' }]));
    const invalAdmin = () => dispatch(api.util.invalidateTags([{ type: 'Booking', id: 'ADMIN_LIST' }]));

    const onNew = () => { invalUser(); invalAdmin(); toast({ title: 'New booking created' }); };
    const onDel = () => { invalUser(); invalAdmin(); toast({ title: 'A booking was deleted' }); };
    const onStatus = (p: { bookingId: string; status: string }) => {
      invalUser(); invalAdmin();
      toast({ title: p.status === 'confirmed' ? 'Booking confirmed' : p.status === 'cancelled' ? 'Booking cancelled' : `Status: ${p.status}` });
    };
    const onNotify = (n: any) => {
      const title =
        n?.type === 'booking_confirmed' ? 'Your booking is confirmed' :
        n?.type === 'booking_cancelled' ? 'Your booking was cancelled' :
        n?.type === 'booking_deleted_by_admin' ? 'Your booking was deleted by admin' :
        'New notification';
      toast({ title });
    };

    socket.on('booking:new', onNew);
    socket.on('booking:deleted', onDel);
    socket.on('booking:status', onStatus);
    socket.on('notify:new', onNotify);

    return () => {
      socket?.off('booking:new', onNew);
      socket?.off('booking:deleted', onDel);
      socket?.off('booking:status', onStatus);
      socket?.off('notify:new', onNotify);
    };
  }, [dispatch, apiUrl]);
}
