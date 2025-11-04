'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '../../services/api';
import Link from 'next/link';
import { toast } from '../../ui/useToast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Please enter email & password', variant: 'destructive' });
      return;
    }

    try {
      // 🔹 Send login request (sets HttpOnly cookie)
      const res = await login({ email, password }).unwrap();
      const role = res?.user?.role ?? 'user';

      toast({ title: 'Login successful!' });

      // 🔹 Wait a bit for cookie to apply, then hard redirect
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/admin'; // ✅ reloads page with cookie
        } else {
          window.location.href = '/'; // ✅ goes to user dashboard
        }
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      toast({ title: 'Login failed', variant: 'destructive' });
    }
  }

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-1">Sign in</h1>
      <p className="text-sm text-neutral-600 mb-4">
        Welcome back! Please enter your credentials.
      </p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="label">Email</label>
          <input
            className="input w-full"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            className="input w-full"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-neutral-600 mt-4">
        New here?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
