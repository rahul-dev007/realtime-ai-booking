'use client';
import Link from 'next/link';
import { useMeQuery, useLogoutMutation } from '../../services/api';
import { toast } from '../../ui/useToast';

export default function NavBar() {
  const { data } = useMeQuery();
  const role = data?.user?.role;
  return (
    <header className="bg-white/80 backdrop-blur sticky top-0 border-b border-neutral-200 z-40">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold no-underline">AI Booking</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-blue-600 no-underline">Bookings</Link>
          <Link href="/chat" className="hover:text-blue-600 no-underline">Chat</Link>
          {role === 'admin' && (
            <Link href="/admin" className="hover:text-blue-600 no-underline">Admin</Link>
          )}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}

function LogoutButton() {
  const [logout] = useLogoutMutation();
  return (
    <button
      onClick={async () => {
        try {
          await logout().unwrap();
          location.href = '/login';
        } catch {
          toast({ title: 'Logout failed', variant: 'destructive' });
        }
      }}
      className="text-neutral-600 hover:text-red-600"
    >
      Logout
    </button>
  );
}
