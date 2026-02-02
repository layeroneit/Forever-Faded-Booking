import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import '../styles/Book.css';

const client = generateClient<Schema>();

const OWNER_EMAILS = ['joe.henderson@layeroneconsultants.com'];
const STAFF_WITH_LOCATION = ['barber', 'manager'];

export default function Profile() {
  const { user } = useAuthenticator((context) => [context.user]);
  const email = (user?.signInDetails?.loginId as string) ?? '';
  const preferredName = (user?.signInDetails?.loginId as string)?.split('@')[0] ?? 'User';
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [settingRole, setSettingRole] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [pinningLocation, setPinningLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, [user]);

  useEffect(() => {
    if (!userId || !email) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      client.models.UserProfile.list(),
      client.models.Location.list(),
      client.models.PendingBarber.list(),
    ])
      .then(([profRes, locRes, pendingRes]) => {
        if (cancelled) return;
        const mine = (profRes.data ?? []).find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        if (mine) {
          setProfile(mine);
          setLocations(locRes.data ?? []);
          return;
        }
        const pending = (pendingRes.data ?? []).find(
          (p) => p.status === 'pending' && (p.email ?? '').toLowerCase() === email.toLowerCase()
        ) as Schema['PendingBarber']['type'] | undefined;
        if (pending) {
          return client.models.UserProfile.create({
            userId,
            email: pending.email,
            name: pending.name,
            phone: pending.phone ?? undefined,
            locationId: pending.locationId ?? undefined,
            role: 'barber',
            isActive: true,
          })
            .then(({ data: created }) => {
              if (cancelled) return;
              if (created) {
                client.models.PendingBarber.update({ id: pending.id, status: 'used' }).catch(() => {});
                setProfile(created as Schema['UserProfile']['type']);
              }
              setLocations(locRes.data ?? []);
            })
            .catch(() => !cancelled && setProfile(null))
            .finally(() => !cancelled && setLoading(false));
        }
        setProfile(null);
        setLocations(locRes.data ?? []);
      })
      .catch(() => !cancelled && setProfile(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, email]);

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

  const handleUpgradeToOwner = async (profileId: string) => {
    setSettingRole(true);
    setRoleError('');
    try {
      await client.models.UserProfile.update({ id: profileId, role: 'owner' });
      window.location.reload();
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : 'Failed to upgrade role');
    } finally {
      setSettingRole(false);
    }
  };

  const handlePinLocation = async (profileId: string, locationId: string | null) => {
    if (!profile) return;
    setPinningLocation(true);
    setLocationError('');
    try {
      await client.models.UserProfile.update({
        id: profileId,
        locationId: locationId || undefined,
      });
      setProfile({ ...profile, locationId: locationId || undefined });
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : 'Failed to update location');
    } finally {
      setPinningLocation(false);
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
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
            Role: <strong style={{ color: 'var(--ff-gold)' }}>{profile.role}</strong>
          </p>
          {canBeOwner && profile.role !== 'owner' && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              disabled={settingRole}
              onClick={() => handleUpgradeToOwner(profile.id)}
            >
              Upgrade to Owner
            </button>
          )}
          {STAFF_WITH_LOCATION.includes(profile.role ?? '') && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--ff-card)', border: '1px solid var(--ff-border)', borderRadius: 12 }}>
              <strong style={{ color: 'var(--ff-gold)' }}>Pin to location</strong>
              <p style={{ marginTop: '0.25rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
                Choose your shop location so clients see you when booking.
              </p>
              <select
                className="book-select"
                value={profile.locationId ?? ''}
                onChange={(e) => handlePinLocation(profile.id, e.target.value || null)}
                disabled={pinningLocation}
                aria-label="Pin to location"
              >
                <option value="">— Not pinned —</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {pinningLocation && <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--ff-gray)' }}>Updating…</span>}
              {locationError && <p style={{ marginTop: '0.5rem', color: '#fca5a5', fontSize: '0.9rem' }}>{locationError}</p>}
            </div>
          )}
          {roleError && (
            <p style={{ marginTop: '0.75rem', color: '#fca5a5', fontSize: '0.9rem' }}>{roleError}</p>
          )}
        </div>
      )}
    </div>
  );
}
