import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import { api } from './services/api';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: { auth: authReducer, [api.reducerPath]: api.reducer },
  middleware: (g) => g().concat(api.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
setupListeners(store.dispatch);
