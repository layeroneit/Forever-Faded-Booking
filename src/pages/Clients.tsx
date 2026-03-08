import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { BookUser, Plus, Trash2 } from 'lucide-react';

const client = generateClient<Schema>();

const STAFF_ROLES = ['barber', 'manager', 'owner', 'admin'];

function canManageClients(role: string) {
  return STAFF_ROLES.includes(role);
}

export default function Clients() {
  const [profiles, setProfiles] = useState<Schema['UserProfile']['type'][]>([]);
  const [appointments, setAppointments] = useState<Schema['Appointment']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myProfile, setMyProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const loadData = () => {
    Promise.all([client.models.UserProfile.list(), client.models.Appointment.list()])
      .then(([profRes, aptRes]) => {
        const clients = (profRes.data ?? []).filter((p) => p.role === 'client') as Schema['UserProfile']['type'][];
        setProfiles(clients);
        setAppointments(aptRes.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = (await getCurrentUser()).userId;
        const [profRes, aptRes] = await Promise.all([
          client.models.UserProfile.list(),
          client.models.Appointment.list(),
        ]);
        if (cancelled) return;
        const allProfiles = profRes.data ?? [];
        const myProf = allProfiles.find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        setMyProfile(myProf ?? null);

        const clients = allProfiles.filter((p) => p.role === 'client') as Schema['UserProfile']['type'][];
        setProfiles(clients);
        setAppointments(aptRes.data ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="page-loading">Loading clients…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const lastBookingByClient = appointments.reduce<Record<string, { at: string; serviceId: string }>>((acc, apt) => {
    const key = apt.clientId;
    const at = apt.startAt ?? '';
    if (!acc[key] || at > (acc[key]?.at ?? '')) acc[key] = { at, serviceId: apt.serviceId ?? '' };
    return acc;
  }, {});

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setAddError('Name and email are required.');
      return;
    }
    setAddSubmitting(true);
    try {
      await client.models.UserProfile.create({
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        phone: addForm.phone.trim() || undefined,
        role: 'client',
      });
      setAddForm({ name: '', email: '', phone: '' });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Remove this client from the list? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await client.models.UserProfile.delete({ id });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  const canManage = canManageClients(myProfile?.role ?? 'client');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Master client list. Changes by barbers appear here for owners.</p>
        </div>
        {canManage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} /> Add client
          </button>
        )}
      </div>

      {showAddForm && (
        <div
          style={{
            background: 'var(--ff-card)',
            border: '1px solid var(--ff-border)',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>New client</h3>
          <form onSubmit={handleAddClient}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 360 }}>
              <label className="input-label">
                Name <span style={{ color: 'var(--ff-red)' }}>*</span>
                <input
                  type="text"
                  className="input-field"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </label>
              <label className="input-label">
                Email <span style={{ color: 'var(--ff-red)' }}>*</span>
                <input
                  type="email"
                  className="input-field"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="client@example.com"
                  required
                />
              </label>
              <label className="input-label">
                Phone
                <input
                  type="tel"
                  className="input-field"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </label>
            </div>
            {addError && <p style={{ color: 'var(--ff-red)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{addError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={addSubmitting}>
                {addSubmitting ? 'Adding…' : 'Add client'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowAddForm(false); setAddError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {profiles.length === 0 && (
        <p>No clients yet. {canManage ? 'Use “Add client” above, or clients will appear after they sign up with a UserProfile (role client).' : 'Clients appear after they sign up and have a UserProfile with role client.'}</p>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {profiles.map((p) => {
          const clientKey = p.userId ?? p.id;
          const last = lastBookingByClient[clientKey];
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
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                <BookUser size={20} color="var(--ff-gold)" />
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>{p.email}</div>
                  {p.phone && <div style={{ fontSize: '0.85rem' }}>{p.phone}</div>}
                  {!p.userId && <span style={{ fontSize: '0.75rem', color: 'var(--ff-gray)' }}>Added by staff (no login yet)</span>}
                  {last && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ff-gray)', marginTop: '0.25rem' }}>
                      Last booking: {new Date(last.at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              {canManage && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDeleteClient(p.id)}
                  disabled={deletingId === p.id}
                  title="Remove client"
                  style={{ flexShrink: 0, padding: '0.5rem' }}
                >
                  {deletingId === p.id ? '…' : <Trash2 size={18} />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
