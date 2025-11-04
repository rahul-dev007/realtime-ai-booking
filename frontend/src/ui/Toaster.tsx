'use client';
import { useEffect } from 'react';
import { useToastStore } from './useToast';

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dismiss(t.id), 3000));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, dismiss]);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className={`card px-4 py-3 max-w-xs ${t.variant==='destructive' ? 'border-red-300' : ''}`}>
          <div className="text-sm font-medium">{t.title}</div>
          {t.description && <div className="text-sm text-neutral-600 mt-1">{t.description}</div>}
          <button onClick={() => dismiss(t.id)} className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-800">×</button>
        </div>
      ))}
    </div>
  );
}
