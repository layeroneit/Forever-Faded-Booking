import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Home, Calendar, User } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const { signOut, user } = useAuthenticator();
  const location = useLocation();
  const email = user?.signInDetails?.loginId ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '?';

  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/book', label: 'Book', icon: Calendar },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="layout-wrapper">
      <header className="layout-header">
        <Link to="/" className="layout-logo">
          <img src="/logo.png" alt="Forever Faded" className="layout-logo-img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.add('show'); }} />
          <span className="layout-logo-text layout-logo-fallback">FOREVER FADED BOOKING</span>
        </Link>
      </header>
      <div className="layout-body">
      <aside className="layout-sidebar">
        <div className="layout-sidebar-header">
          <span className="layout-logo-text">FOREVER FADED BOOKING</span>
        </div>
        <nav className="layout-nav">
          {nav.map(({ to, label, icon: Icon }) => (
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
              <div className="layout-user-name">{email}</div>
              <div className="layout-user-role">Account</div>
            </div>
          </div>
          <button type="button" className="layout-logout" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="layout-main layout-main-wrap">
        <Outlet />
      </main>
      </div>
    </div>
  );
}
