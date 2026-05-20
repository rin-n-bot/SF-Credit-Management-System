import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StoreIcon from '../../components/StoreIcon';
import '../../styles/auth.css';

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
    <main className="auth-page">
      <section className="auth-card">

        <StoreIcon />

        <div className="auth-heading">
          <h1>SF Sari-Sari Store</h1>
          <p>Credit Management System</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          {message && <p className="auth-error">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="register-link">
          First time setup? <Link to="/register">Create owner account</Link>
        </p>
      </section>

      <p className="auth-footer">© 2026 SF Sari-Sari Store. All rights reserved.</p>
    </main>
  );
}