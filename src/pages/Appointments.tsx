import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Calendar } from 'lucide-react';

const client = generateClient<Schema>();

export default function Appointments() {
  const [appointments, setAppointments] = useState<Schema['Appointment']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [role, setRole] = useState<string>('client');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { userId: uid } = await getCurrentUser();
        if (!cancelled) setUserId(uid);
        const { data: profiles } = await client.models.UserProfile.list();
        const mine = (profiles ?? []).find((p) => p.userId === uid);
        if (!cancelled && mine) setRole(mine.role ?? 'client');
      } catch {
        if (!cancelled) setUserId('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId && role !== 'client') return;
    client.models.Appointment.list()
      .then((res) => {
        const list = res.data ?? [];
        const filtered =
          role === 'client' && userId
            ? list.filter((a) => a.clientId === userId)
            : list;
        setAppointments(filtered);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [userId, role]);

  if (loading) return <div className="page-loading">Loading appointments…</div>;

  return (
    <div>
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">{role === 'client' ? 'Your bookings.' : 'All appointments.'}</p>
      {appointments.length === 0 && <p>No appointments yet.</p>}
      {appointments.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {appointments.map((apt) => (
            <li
              key={apt.id}
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
              <Calendar size={20} color="var(--ff-gold)" />
              <div>
                <strong>{new Date(apt.startAt).toLocaleString()}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
                  {apt.status} · {apt.paymentStatus}
                  {apt.totalCents != null && (
                    <span style={{ marginLeft: '0.5rem' }}>${(apt.totalCents / 100).toFixed(2)}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
