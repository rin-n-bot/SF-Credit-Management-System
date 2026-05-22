import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StoreIcon from '../../components/StoreIcon';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        full_name: fullName,
        username,
        password,
      });

      if (!result.success) {
        setMessage(result.message || 'Registration failed.');
      }
    } catch (error) {
      console.error(error);
      if (!window.api) {
        setMessage('Electron backend is not available. Open the app through Electron, not the browser.');
      } else {
        setMessage('Cannot connect to the database. Check DATABASE_URL and Supabase connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-8 bg-white text-[#12172a]">
      <section className="w-[360px] max-w-full px-7 pt-[34px] pb-6 mb-20">

        <StoreIcon />

        <div className="text-center mt-[18px]">
          <h1 className="m-0 text-2xl leading-tight font-extrabold">
            SF Sari-Sari Store
          </h1>
          <p className="mt-2 text-[#5f667a] text-[13px] font-semibold">
            Credit Management System
          </p>
        </div>

        <form className="grid gap-[14px] mt-[26px]" onSubmit={handleSubmit}>
          <label className="grid gap-[7px] text-[#20263a] text-xs font-medium">
            Full Name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          <label className="grid gap-[7px] text-[#20263a] text-xs font-medium">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          <label className="grid gap-[7px] text-[#20263a] text-xs font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min. 6 characters)"
              autoComplete="new-password"
              minLength={6}
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          <label className="grid gap-[7px] text-[#20263a] text-xs font-medium">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="off"
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-lg"
            />
          </label>

          {message && (
            <p className="m-0 text-[#d92d20] text-xs leading-snug">{message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[42px] rounded-md bg-[#141414] text-white text-[13px] font-extrabold cursor-pointer hover:bg-[#5b50e6] active:scale-[0.98] transition-colors duration-200 disabled:opacity-65 disabled:bg-[#5b50e6] disabled:cursor-wait"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-[18px] text-[#6b7280] text-xs text-center">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#141414] font-extrabold hover:text-[#5b50e6] hover:underline transition-all duration-200"
          >
            Sign in
          </Link>
        </p>
      </section>

      <p className="fixed bottom-7 text-[#8a91a3] text-[11px]">
        © 2026 SF Sari-Sari Store. All rights reserved.
      </p>
    </main>
  );
}