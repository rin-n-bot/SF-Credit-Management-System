import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import StoreIcon from '../../components/StoreIcon';
import '../../styles/auth.css';

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
    <main className="auth-page">
      <section className="auth-card">

        <StoreIcon />

        <div className="auth-heading">
          <h1>SF Sari-Sari Store</h1>
          <p>Credit Management System</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </label>

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
              placeholder="Enter password (min. 6 characters)"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="off"
              required
            />
          </label>

          {message && <p className="auth-error">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="register-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>

      <p className="auth-footer">© 2026 SF Sari-Sari Store. All rights reserved.</p>
    </main>
  );
}