import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
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
import { getLogoUrl } from '../lib/logo';
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

/** Inactivity timeout in ms — sign out after no user activity (mouse, keyboard, touch, scroll). */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

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

  // Inactivity timeout: sign out after INACTIVITY_TIMEOUT_MS with no activity
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => signOut(), INACTIVITY_TIMEOUT_MS);
    };
    resetTimer();
    ACTIVITY_EVENTS.forEach((ev) => document.addEventListener(ev, resetTimer));
    return () => {
      clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((ev) => document.removeEventListener(ev, resetTimer));
    };
  }, [signOut]);

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
          try {
            const attrs = await fetchUserAttributes();
            const name = (attrs?.preferred_username as string)?.trim() || email?.split('@')[0] || 'Client';
            const { data: created } = await client.models.UserProfile.create({
              userId,
              email: email || '',
              name: name || 'Client',
              role: 'client',
            });
            if (cancelled) return;
            if (created) {
              setProfile(created as Schema['UserProfile']['type']);
            }
          } catch (createErr) {
            if (!cancelled) {
              const msg = createErr instanceof Error ? createErr.message : String(createErr);
              setProfileError(msg || 'Failed to create profile');
            }
          }
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
  }, [userId, email]);

  // Close mobile menu when route changes (e.g. after tapping a nav link)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
            src={getLogoUrl()}
            alt="Forever Faded — Est. 2008"
            className="layout-logo-img"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.add('show');
            }}
          />
          <span className="layout-logo-text layout-logo-fallback">FOREVER FADED</span>
        </Link>
        <div className="layout-spacer" />
      </header>

      {/* Backdrop: tap outside sidebar to close on mobile */}
      <div
        className={`layout-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

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

      <footer className="layout-powered-by" aria-label="Powered by">
        <span className="layout-powered-by-label">Powered by</span>
        <span className="layout-powered-by-logos">
          <img src={`${import.meta.env.BASE_URL || '/'}powered-by/ghostweave.png`} alt="Ghostweave Labs" />
          <img src={`${import.meta.env.BASE_URL || '/'}powered-by/layerone.png`} alt="Layer One" />
        </span>
      </footer>
    </div>
  );
}
