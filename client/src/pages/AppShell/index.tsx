import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
  CircleUser,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { BreadcrumbContext } from '../../context/breadcrumbContext';

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

function buildBreadcrumbs(pathname: string, items: NavItem[], customLabel: string | null) {
  const segments = pathname === '/' ? ['dashboard'] : pathname.split('/').filter(Boolean);
  return segments.map((seg) => {
    const match = items.find((item) => item.key === seg);
    if (match) return { label: match.label, Icon: match.Icon };
    return { label: customLabel || seg, Icon: null };
  });
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1];
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const crumbs = buildBreadcrumbs(location.pathname, navItems, customLabel);

  return (
    <BreadcrumbContext.Provider value={{ customLabel, setCustomLabel }}>
      <div className="min-h-screen grid grid-cols-[220px_1fr] bg-white max-[820px]:grid-cols-1">

        {/* Sidebar */}
        <aside className="bg-white p-5 px-4 flex flex-col gap-6 sticky top-0 h-screen max-[820px]:static max-[820px]:h-auto">

          <div className="pb-4">
            <strong className="text-lg font-black block text-[var(--color-text-dark)]">SF Credit</strong>
            <span className="text-xs text-[var(--color-text-muted)] font-semibold">Management System</span>
          </div>

          <nav className="flex flex-col gap-1.5 flex-1 max-[820px]:grid max-[820px]:grid-cols-3">
            {navItems.map((item) => {
              const Icon = item.Icon;
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`h-[38px] border-0 rounded-md text-left px-3 text-[13px] font-medium cursor-pointer flex items-center gap-2.5 transition-colors
                    ${isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white text-[var(--color-text-muted)] hover:text-[var(--color-primary-hover)]'
                    }`}
                >
                  <Icon size={16} strokeWidth={2.2} className="w-4 h-4 flex-none" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="-mx-4 px-4 pt-3.5 pb-6 border-t border-[var(--color-border)] mt-auto">
            <button
              type="button"
              onClick={logout}
              className="w-full h-[38px] border-0 bg-white rounded-md text-left px-3 text-[13px] font-medium text-[var(--color-error)] cursor-pointer flex items-center gap-2.5 hover:text-[var(--color-primary-hover)]"
            >
              <LogOut size={16} strokeWidth={2.2} className="w-4 h-4 flex-none" />
              Logout
            </button>
          </div>
        </aside>

        {/* Shell body */}
        <div className="flex flex-col min-h-0 border border-[var(--color-border)] rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] overflow-hidden">

          {/* Topbar */}
          <header className="h-12 border-b border-[var(--color-border)] px-6 flex items-center justify-between bg-white flex-shrink-0">
            <nav className="flex items-center gap-1 min-w-0 overflow-hidden">
              {crumbs.map((crumb, i) => {
                const Icon = crumb.Icon;
                return (
                  <span key={i} className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
                    {i > 0 && <span className="text-[var(--color-text-light)] text-base leading-none -translate-y-[1px] inline-flex items-center">›</span>}
                    {Icon && <Icon size={14} strokeWidth={2.2} />}
                    <span>{crumb.label}</span>
                  </span>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 border border-[var(--color-border)] rounded-full px-3 py-1.5 ml-3 flex-shrink-0">
            <CircleUser size={16} strokeWidth={2} className="text-[var(--color-text-muted)]" />
            <span className="text-xs font-bold text-[var(--color-text-dark)] whitespace-nowrap">
              {user?.username || 'Owner'}
            </span>
          </div>
          </header>

          {/* Main content */}
          <main className="overflow-y-auto p-7 px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  );
}