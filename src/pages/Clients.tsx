import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { BookUser } from 'lucide-react';

const client = generateClient<Schema>();

export default function Clients() {
  const [profiles, setProfiles] = useState<Schema['UserProfile']['type'][]>([]);
  const [appointments, setAppointments] = useState<Schema['Appointment']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([client.models.UserProfile.list(), client.models.Appointment.list()])
      .then(([profRes, aptRes]) => {
        const clients = (profRes.data ?? []).filter((p) => p.role === 'client') as Schema['UserProfile']['type'][];
        setProfiles(clients);
        setAppointments(aptRes.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading clients…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const lastBookingByClient = appointments.reduce<Record<string, { at: string; serviceId: string }>>((acc, apt) => {
    const key = apt.clientId;
    const at = apt.startAt ?? '';
    if (!acc[key] || at > (acc[key]?.at ?? '')) acc[key] = { at, serviceId: apt.serviceId ?? '' };
    return acc;
  }, {});

  return (
    <div>
      <h1 className="page-title">Clients</h1>
      <p className="page-subtitle">Client list.</p>
      {profiles.length === 0 && <p>No clients yet. Clients appear after they sign up and have a UserProfile with role client.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {profiles.map((p) => {
          const last = lastBookingByClient[p.userId];
          return (
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
              <BookUser size={20} color="var(--ff-gold)" />
              <div>
                <strong>{p.name}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>{p.email}</div>
                {p.phone && <div style={{ fontSize: '0.85rem' }}>{p.phone}</div>}
                {last && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ff-gray)', marginTop: '0.25rem' }}>
                    Last booking: {new Date(last.at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
