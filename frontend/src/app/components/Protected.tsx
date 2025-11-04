'use client';
import { ReactNode, useEffect } from 'react';
import { useMeQuery } from '../../services/api';
import { useRouter, usePathname } from 'next/navigation';

export default function Protected({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useMeQuery();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 401 → not logged in
    if (error && (error as any).status === 401) {
      router.push('/login');
      return;
    }

    // Logged in user redirect guard
    const role = data?.user?.role;

    // if admin logged in but on user dashboard
    if (role === 'admin' && pathname === '/') {
      router.push('/admin');
    }
    // if normal user logged in but on admin dashboard
    if (role === 'user' && pathname.startsWith('/admin')) {
      router.push('/');
    }
  }, [data, error, isLoading, pathname, router]);

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Checking session...</div>;
  }

  return <>{children}</>;
}
