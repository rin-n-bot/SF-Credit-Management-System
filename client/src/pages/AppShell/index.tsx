import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './styles.css';

interface NavItem {
  key: string;
  label: string;
  path: string;
  Icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', Icon: BarChart3 },
  { key: 'customers', label: 'Customers', path: '/customers', Icon: Users },
  { key: 'transactions', label: 'Transactions', path: '/transactions', Icon: ReceiptText },
  { key: 'payments', label: 'Payments', path: '/payments', Icon: WalletCards },
  { key: 'reports', label: 'Reports', path: '/reports', Icon: FileText },
  { key: 'settings', label: 'Settings', path: '/settings', Icon: Settings },
];

export default function AppShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>SF Credit</strong>
          <span>Management System</span>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.Icon;

            return (
              <button
                key={item.key}
                type="button"
                className={activeKey === item.key ? 'active' : ''}
                onClick={() => navigate(item.path)}
              >
                <Icon className="nav-icon" size={16} strokeWidth={2.2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="logout-wrap">
          <button type="button" className="logout" onClick={logout}>
            <LogOut className="nav-icon" size={16} strokeWidth={2.2} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}