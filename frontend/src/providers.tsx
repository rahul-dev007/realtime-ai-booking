'use client';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from './ui/Toaster';
import { useSocketCache } from './hooks/useSocketCache';

function ClientSideEffects() {
  // ✅ socket listeners run once for the whole app
  useSocketCache();
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ClientSideEffects />
      <Toaster /> {/* ✅ toast container mounted */}
      {children}
    </Provider>
  );
}
