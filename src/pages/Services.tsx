import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Scissors } from 'lucide-react';

const client = generateClient<Schema>();

export default function Services() {
  const [services, setServices] = useState<Schema['Service']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.models.Service.list()
      .then((res) => setServices(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading services…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Services</h1>
      <p className="page-subtitle">Services and pricing.</p>
      {services.length === 0 && <p>No services yet. Seed from Dashboard or add in Amplify Data manager.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {services.map((svc) => (
          <li
            key={svc.id}
            style={{
              background: 'var(--ff-card)',
              border: '1px solid var(--ff-border)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Scissors size={20} color="var(--ff-gold)" />
              <div>
                <strong>{svc.name}</strong>
                {svc.category && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--ff-gray)' }}>
                    {svc.category}
                  </span>
                )}
                {(svc.durationMinutes ?? 0) > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--ff-gray)' }}>{svc.durationMinutes} min</div>
                )}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--ff-gold)' }}>
              ${((svc.priceCents ?? 0) / 100).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
