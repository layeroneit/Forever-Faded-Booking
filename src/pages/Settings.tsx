import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, User, Key } from 'lucide-react';

export default function Settings() {
  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">App and account settings.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'var(--ff-card)',
            border: '1px solid var(--ff-border)',
            borderRadius: 12,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <User size={20} color="var(--ff-gold)" />
          <span>Profile & account</span>
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'var(--ff-card)',
            border: '1px solid var(--ff-border)',
            borderRadius: 12,
            color: 'var(--ff-gray)',
          }}
        >
          <Key size={20} color="var(--ff-gold)" />
          <span>Password: change in Amplify Authenticator or AWS Cognito Console.</span>
        </div>
      </div>
    </div>
  );
}
