import { useState } from 'react';
import './styles.css';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    full_name: 'Admin User',
    contact_no: '0917 000 0000',
    email: 'admin@sfstore.local',
  });

  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [notice, setNotice] = useState('');

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice('Profile information updated.');
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password.next !== password.confirm) {
      setNotice('New password and confirm password do not match.');
      return;
    }

    setPassword({ current: '', next: '', confirm: '' });
    setNotice('Password updated.');
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings / Profile</h1>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="settings-grid">
        <section className="settings-card">
          <h2>Profile Information</h2>

          <form onSubmit={handleProfileSubmit}>
            <label>
              Full Name
              <input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </label>

            <label>
              Contact No.
              <input
                value={profile.contact_no}
                onChange={(e) => setProfile({ ...profile, contact_no: e.target.value })}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </label>

            <button type="submit">Update Profile</button>
          </form>
        </section>

        <section className="settings-card">
          <h2>Change Password</h2>

          <form onSubmit={handlePasswordSubmit}>
            <label>
              Current Password
              <input
                type="password"
                placeholder="Enter current password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                placeholder="Enter new password"
                value={password.next}
                onChange={(e) => setPassword({ ...password, next: e.target.value })}
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                placeholder="Confirm new password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              />
            </label>

            <button type="submit">Update Password</button>
          </form>
        </section>

        <section className="settings-card">
          <h2>Backup & Restore</h2>

          <p>Backup your database to keep your data safe.</p>
          <button className="secondary-button">Backup Now</button>

          <h3>Restore Database</h3>
          <p>Restore from a previous backup.</p>
          <input type="file" />

          <div className="system-info">
            <h3>System Information</h3>
            <span>Version <strong>1.0.0</strong></span>
            <span>Database <strong>Local PostgreSQL</strong></span>
            <span>Last Backup <strong>May 15, 2026 10:30 PM</strong></span>
          </div>
        </section>
      </div>
    </div>
  );
}