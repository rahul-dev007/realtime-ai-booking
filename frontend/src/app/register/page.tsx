'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterMutation } from '../../services/api';
import { toast } from '../../ui/useToast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      // 🔹 call backend /auth/register
      const res = await registerUser({ email, password }).unwrap();
      const role = res?.user?.role ?? 'user';

      toast({ title: 'Account created successfully!' });

      // 🔹 Ensure cookie applied before redirect
      // add slight delay + force page reload to pick up new session
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/admin'; // ✅ hard redirect ensures cookies are sent
        } else {
          window.location.href = '/'; // ✅ go to user dashboard
        }
      }, 500);
    } catch (err) {
      console.error('Register error:', err);
      toast({ title: 'Registration failed', variant: 'destructive' });
    }
  }

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-1">Create an account</h1>
      <p className="text-sm text-neutral-600 mb-4">
        Sign up to start booking.
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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
