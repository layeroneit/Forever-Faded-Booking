import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

const OWNER_EMAILS = ['joe.henderson@layeroneconsultants.com'];

export default function Profile() {
  const { user } = useAuthenticator((context) => [context.user]);
  const email = (user?.signInDetails?.loginId as string) ?? '';
  const preferredName = (user?.signInDetails?.loginId as string)?.split('@')[0] ?? 'User';
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingRole, setSettingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, [user]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    client.models.UserProfile.list()
      .then(({ data }) => {
        if (cancelled) return;
        const mine = (data ?? []).find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        setProfile(mine ?? null);
      })
      .catch(() => !cancelled && setProfile(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSetRole = async (role: string) => {
    if (!userId || !email) return;
    setSettingRole(true);
    setRoleError('');
    try {
      await client.models.UserProfile.create({
        userId,
        email,
        name: preferredName,
        role,
        isActive: true,
      });
      window.location.reload();
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Failed to set role');
    } finally {
      setSettingRole(false);
    }
  };

  if (loading) return <div className="page-loading">Loading profile…</div>;

  const canBeOwner = OWNER_EMAILS.includes(email.toLowerCase());

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Account details.</p>
      <p>Email: {email}</p>
      {userId && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
          User ID: <code style={{ wordBreak: 'break-all' }}>{userId}</code>
        </p>
      )}

      {!profile ? (
        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--ff-card)', border: '1px solid var(--ff-border)', borderRadius: 12 }}>
          <strong style={{ color: 'var(--ff-gold)' }}>Set your role</strong>
          <p style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
            Choose how you use this app. You can change this later by contacting support.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={settingRole}
              onClick={() => handleSetRole('client')}
            >
              Client — book appointments
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={settingRole}
              onClick={() => handleSetRole('barber')}
            >
              Barber — manage my clients
            </button>
            {canBeOwner && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={settingRole}
                onClick={() => handleSetRole('owner')}
              >
                Owner — full access
              </button>
            )}
          </div>
          {roleError && (
            <p style={{ marginTop: '0.75rem', color: '#fca5a5', fontSize: '0.9rem' }}>{roleError}</p>
          )}
        </div>
      ) : (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
          Role: <strong style={{ color: 'var(--ff-gold)' }}>{profile.role}</strong>
        </p>
      )}
    </div>
  );
}
