import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { MapPin } from 'lucide-react';

const client = generateClient<Schema>();

export default function Locations() {
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.models.Location.list()
      .then((res) => setLocations(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading locations…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Locations</h1>
      <p className="page-subtitle">Shop locations.</p>
      {locations.length === 0 && <p>No locations yet. Seed from Dashboard or add in Amplify Data manager.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {locations.map((loc) => (
          <li
            key={loc.id}
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
            <MapPin size={20} color="var(--ff-gold)" />
            <div>
              <strong>{loc.name}</strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
                {loc.address}, {loc.city} {loc.state} {loc.zip}
              </div>
              {loc.phone && <div style={{ fontSize: '0.85rem' }}>{loc.phone}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
