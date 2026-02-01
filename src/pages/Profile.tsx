import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';

export default function Profile() {
  const { user } = useAuthenticator();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, []);

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Account details.</p>
      <p>Email: {user?.signInDetails?.loginId}</p>
      {userId && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
          User ID (for UserProfile in Data manager): <code style={{ wordBreak: 'break-all' }}>{userId}</code>
        </p>
      )}
    </div>
  );
}
