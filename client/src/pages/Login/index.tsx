import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StoreIcon from '../../components/StoreIcon';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const result = await login({ username, password });

      if (!result.success) {
        setMessage(result.message || 'Invalid username or password.');
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
          <h1 className="m-0 text-2xl leading-tight font-bold">
            SF Sari-Sari Store
          </h1>
          <p className="mt-2 text-[#5f667a] text-[13px] font-medium">
            Credit Management System
          </p>
        </div>

        <form className="grid gap-[14px] mt-[26px]" onSubmit={handleSubmit}>
          <label className="grid gap-[7px] text-[#20263a] text-[13px] font-medium">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-md"
            />
          </label>

          <label className="grid gap-[7px] text-[#20263a] text-[13px] font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              className="h-10 border border-[#dce0ea] rounded-md px-3 bg-white text-[#12172a] text-[13px] outline-none focus:border-[#5b50e6] focus:ring-2 focus:ring-white focus:rounded-md"
            />
          </label>

          <label className="flex items-center gap-2 text-[#5f667a] text-xs font-semibold">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[14px] h-[14px] accent-[#5b50e6]"
            />
            Remember me
          </label>

          {message && (
            <p className="m-0 text-[#d92d20] text-xs leading-snug">{message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[42px] rounded-md bg-[#141414] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#5b50e6] active:scale-[0.98] transition-colors duration-200 disabled:opacity-65 disabled:bg-[#5b50e6] disabled:cursor-wait"
          >
            {isSubmitting ? (
              <span className="inline-block w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="mt-[18px] text-[#6b7280] text-[13px] font-medium text-center">
          First time setup?{' '}
          <Link
            to="/register"
            className="text-[#141414] font-bold hover:text-[#5b50e6] hover:underline transition-all duration-200"
          >
            Create owner account
          </Link>
        </p>
      </section>

      <p className="fixed bottom-7 text-[#8a91a3] text-xs">
        © 2026 SF Sari-Sari Store. All rights reserved.
      </p>
    </main>
  );
}