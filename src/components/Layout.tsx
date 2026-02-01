import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Home, Calendar, User } from 'lucide-react';

export default function Layout() {
  const { signOut, user } = useAuthenticator();
  const location = useLocation();

  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/book', label: 'Book', icon: Calendar },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, borderRight: '1px solid var(--ff-border)', padding: '1rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>FOREVER FADED BOOKING</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                textDecoration: 'none',
                color: location.pathname === to ? 'var(--ff-gold)' : 'var(--ff-fg)',
                fontWeight: location.pathname === to ? 600 : 400,
              }}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--ff-gray)' }}>{user?.signInDetails?.loginId}</span>
          <button type="button" onClick={() => signOut()} style={{ display: 'block', marginTop: '0.5rem' }}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
