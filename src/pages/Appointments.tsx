import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Calendar } from 'lucide-react';

const client = generateClient<Schema>();

export default function Appointments() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [userId, setUserId] = useState<string>('');
  const [appointments, setAppointments] = useState<Schema['Appointment']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('client');

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, [user]);

  const [myProfile, setMyProfile] = useState<Schema['UserProfile']['type'] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: profiles } = await client.models.UserProfile.list();
        const mine = (profiles ?? []).find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        if (!cancelled) {
          setMyProfile(mine ?? null);
          setRole(mine?.role ?? 'client');
        }
      } catch {
        if (!cancelled) setRole('client');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    client.models.Appointment.list()
      .then((res) => {
        const list = res.data ?? [];
        let filtered = list;
        if (role === 'client' && userId) {
          filtered = list.filter((a) => a.clientId === userId);
        } else if (role === 'barber' && myProfile?.id) {
          filtered = list.filter((a) => a.barberId === myProfile.id);
        }
        setAppointments(filtered);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [userId, role, myProfile?.id]);

  if (loading) return <div className="page-loading">Loading appointments…</div>;

  return (
    <div>
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">
        {role === 'client' ? 'Your bookings.' : role === 'barber' ? 'Appointments with your clients.' : 'All appointments.'}
      </p>
      {appointments.length === 0 && <p className="page-subtitle" style={{ marginBottom: 0 }}>No appointments yet.</p>}
      {appointments.length > 0 && (
        <ul className="page-card-list">
          {appointments.map((apt) => (
            <li key={apt.id} className="page-card-item">
              <Calendar size={22} className="ff-accent-gold" />
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
