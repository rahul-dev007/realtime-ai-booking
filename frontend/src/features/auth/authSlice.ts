import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type User = { id: string; role: 'user'|'admin'; email?: string };
type AuthState = { user: User | null };

const initialState: AuthState = { user: null };

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (s, a: PayloadAction<User | null>) => { s.user = a.payload; },
  },
});

export const { setUser } = slice.actions;
export default slice.reducer;
