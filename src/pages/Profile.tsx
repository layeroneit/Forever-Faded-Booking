import { useAuth } from 'react-oidc-context';

export default function Profile() {
  const auth = useAuth();
  const email = (auth.user?.profile?.email as string) ?? '';
  const userId = (auth.user?.profile?.sub as string) ?? '';

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Account details.</p>
      <p>Email: {email}</p>
      {userId && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
          User ID (for UserProfile in Data manager): <code style={{ wordBreak: 'break-all' }}>{userId}</code>
        </p>
      )}
    </div>
  );
}
