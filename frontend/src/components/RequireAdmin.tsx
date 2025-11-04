'use client';
import { ReactNode, useEffect } from 'react';
import { useMeQuery } from '../services/api';
import { useRouter } from 'next/navigation';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useMeQuery();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // ❌ not logged in
    if (error && (error as any).status === 401) {
      router.replace('/login');
      return;
    }

    // ✅ logged in but not admin
    if (data?.user?.role !== 'admin') {
      router.replace('/');
      return;
    }
  }, [data, error, isLoading, router]);

  if (isLoading) {
    return <div className="p-6 text-neutral-500">Checking admin session...</div>;
  }

  return <>{children}</>;
}
