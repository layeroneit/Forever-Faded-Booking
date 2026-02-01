import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  Home,
  Calendar,
  User,
  MapPin,
  Menu,
  X,
  LogOut,
  Users,
  Scissors,
  DollarSign,
  BarChart3,
  Settings,
  Package,
  CreditCard,
  ClipboardList,
  BookUser,
} from 'lucide-react';
import './Layout.css';

const client = generateClient<Schema>();

const navByRole: Record<string, { to: string; label: string; icon: typeof Home }[]> = {
  client: [
    { to: '/book', label: 'Book', icon: Calendar },
    { to: '/appointments', label: 'My Appointments', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  barber: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/schedule', label: 'Schedule', icon: Calendar },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/clients', label: 'My Clients', icon: BookUser },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/locations', label: 'Locations', icon: MapPin },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/schedule', label: 'Schedule', icon: Calendar },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/clients', label: 'Clients', icon: BookUser },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  owner: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/daily-cuts', label: 'Daily Cuts', icon: ClipboardList },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/clients', label: 'Clients', icon: BookUser },
    { to: '/staff', label: 'Staff', icon: Users },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/locations', label: 'Locations', icon: MapPin },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/payroll', label: 'Payroll', icon: DollarSign },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/daily-cuts', label: 'Daily Cuts', icon: ClipboardList },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/clients', label: 'Clients', icon: BookUser },
    { to: '/staff', label: 'Staff', icon: Users },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/locations', label: 'Locations', icon: MapPin },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
};

const defaultNav = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/book', label: 'Book', icon: Calendar },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut]);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const email = (user?.signInDetails?.loginId as string) ?? '';
  const role = profile?.role ?? 'client';
  const displayName = profile?.name ?? email?.split('@')[0] ?? 'Account';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  const links = navByRole[role] ?? defaultNav;

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, [user]);

  const handleSignOut = () => {
    signOut();
  };

  useEffect(() => {
    if (!userId) return;
    setProfileError(null);
    let cancelled = false;
    (async () => {
      try {
        const { data: profiles } = await client.models.UserProfile.list();
        if (cancelled) return;
        const mine = (profiles ?? []).find((p) => p.userId === userId);
        if (mine) {
          setProfile(mine as Schema['UserProfile']['type']);
          if (mine.locationId) {
            const { data: locs } = await client.models.Location.list();
            if (cancelled) return;
            const loc = (locs ?? []).find((l) => l.id === mine.locationId);
            if (loc) setLocationName(loc.name);
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        if (!cancelled) {
          setProfile(null);
          const msg = e instanceof Error ? e.message : String(e);
          setProfileError(msg || 'Failed to load profile');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="layout">
      <header className="layout-header">
        <button
          type="button"
          className="layout-menu-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="layout-logo">
          <img
            src={`${import.meta.env.BASE_URL || '/'}logo.png`.replace(/\/+/g, '/')}
            alt="Forever Faded"
            className="layout-logo-img"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.add('show');
            }}
          />
          <span className="layout-logo-text layout-logo-fallback">FOREVER FADED</span>
        </Link>
        <div className="layout-spacer" />
      </header>

      <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="layout-sidebar-header">
          <span className="layout-logo-text" style={{ letterSpacing: '0.05em' }}>FOREVER FADED</span>
          {locationName && (
            <p className="layout-location">
              <MapPin size={12} /> {locationName}
            </p>
          )}
        </div>
        <nav className="layout-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`layout-nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              <Icon size={20} /> {label}
            </Link>
          ))}
        </nav>
        <div className="layout-sidebar-footer">
          <div className="layout-user">
            <div className="layout-avatar">{initials}</div>
            <div>
              <div className="layout-user-name">{displayName}</div>
              <div className="layout-user-role">{role}</div>
            </div>
          </div>
          <button type="button" className="layout-logout" onClick={handleSignOut}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className={`layout-main ${sidebarOpen ? '' : 'full'}`}>
        {profileError && (
          <div className="layout-api-error" role="alert">
            {profileError}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
