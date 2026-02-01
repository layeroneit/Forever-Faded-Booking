import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export default function Appointments() {
  const [appointments, setAppointments] = useState<Schema['Appointment']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await client.models.Appointment.list();
      setAppointments(res.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loading">Loading appointments…</div>;

  return (
    <div>
      <h1 className="page-title">Appointments</h1>
      <p className="page-subtitle">Your bookings.</p>
      {appointments.length === 0 && <p>No appointments yet.</p>}
      {appointments.length > 0 && (
        <ul>
          {appointments.map((apt) => (
            <li key={apt.id}>
              {new Date(apt.startAt).toLocaleString()} — {apt.status} · {apt.paymentStatus}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
