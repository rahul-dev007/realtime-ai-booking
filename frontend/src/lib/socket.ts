// frontend/src/lib/socket.ts
import { io } from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

export function getSocket(token?: string) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["websocket"],
      auth: { token }
    });
  }
  return socket;
}
