import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { MapPin } from 'lucide-react';

const client = generateClient<Schema>();

const STAFF_ROLES = ['barber', 'manager', 'owner', 'admin'];

export default function Staff() {
  const [profiles, setProfiles] = useState<Schema['UserProfile']['type'][]>([]);
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([client.models.UserProfile.list(), client.models.Location.list()])
      .then(([profRes, locRes]) => {
        const staff = (profRes.data ?? []).filter((p) => STAFF_ROLES.includes(p.role ?? '')) as Schema['UserProfile']['type'][];
        setProfiles(staff);
        setLocations(locRes.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading staff…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const locById = Object.fromEntries(locations.map((l) => [l.id, l]));

  return (
    <div>
      <h1 className="page-title">Staff</h1>
      <p className="page-subtitle">Barbers and staff. Barbers pin themselves to a location in Profile so they appear when clients book.</p>
      {profiles.length === 0 && (
        <p>No staff yet. Add UserProfiles with role barber, manager, owner, or admin in Amplify Data manager.</p>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {profiles.map((p) => (
          <li
            key={p.id}
            style={{
              background: 'var(--ff-card)',
              border: '1px solid var(--ff-border)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--ff-gold), var(--ff-red))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--ff-black)',
              }}
            >
              {p.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <strong>{p.name}</strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--ff-gold)', textTransform: 'uppercase' }}>
                {p.role}
              </span>
              <div style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>{p.email}</div>
              {p.locationId && locById[p.locationId] ? (
                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={14} /> {locById[p.locationId].name}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--ff-gray)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                  Not pinned to a location — barber should set in Profile
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
