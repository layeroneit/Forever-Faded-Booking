import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { MapPin, Plus, UserPlus } from 'lucide-react';
import '../styles/Book.css';

const client = generateClient<Schema>();

const STAFF_ROLES = ['barber', 'manager', 'owner', 'admin'];

export default function Staff() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [profiles, setProfiles] = useState<Schema['UserProfile']['type'][]>([]);
  const [pendingBarbers, setPendingBarbers] = useState<Schema['PendingBarber']['type'][]>([]);
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    locationId: '',
  });

  useEffect(() => {
    getCurrentUser().then((u) => setUserId(u.userId)).catch(() => setUserId(''));
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    client.models.UserProfile.list()
      .then(({ data }) => {
        const mine = (data ?? []).find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        setProfile(mine ?? null);
      })
      .catch(() => setProfile(null));
  }, [userId]);

  const load = () => {
    Promise.all([
      client.models.UserProfile.list(),
      client.models.Location.list(),
      client.models.PendingBarber.list(),
    ])
      .then(([profRes, locRes, pendingRes]) => {
        const staff = (profRes.data ?? []).filter((p) => STAFF_ROLES.includes(p.role ?? '')) as Schema['UserProfile']['type'][];
        setProfiles(staff);
        setLocations(locRes.data ?? []);
        setPendingBarbers((pendingRes.data ?? []).filter((p) => p.status === 'pending'));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isOwner = ['owner', 'admin'].includes(profile?.role ?? '');

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setAddError('Name and email are required.');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await client.models.PendingBarber.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        locationId: form.locationId || undefined,
        status: 'pending',
      });
      setForm({ name: '', email: '', phone: '', locationId: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add barber');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading staff…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const locById = Object.fromEntries(locations.map((l) => [l.id, l]));

  return (
    <div>
      <h1 className="page-title">Staff</h1>
      <p className="page-subtitle">Barbers and staff. Add barbers below; they will get barber access when they sign up with that email.</p>

      {isOwner && (
        <div style={{ marginBottom: '1.5rem' }}>
          {!showAdd ? (
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Add barber
            </button>
          ) : (
            <form onSubmit={handleAddBarber} className="page-card" style={{ maxWidth: 480, padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--ff-gold)' }}>Add barber</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--ff-gray)', marginBottom: '1rem' }}>
                Enter barber details. When they sign up with this email, their profile will be created with role &quot;barber&quot; and this location.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Name *</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Email *</span>
                  <input
                    type="email"
                    className="book-input"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="barber@example.com"
                    required
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Phone</span>
                  <input
                    type="tel"
                    className="book-input"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Barber location</span>
                  <select
                    className="book-select"
                    value={form.locationId}
                    onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                    aria-label="Barber location"
                  >
                    <option value="">— Select location —</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </label>
                {addError && <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{addError}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding…' : 'Add barber'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAdd(false); setAddError(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {pendingBarbers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--ff-gold)', marginBottom: '0.75rem' }}>Pending (not signed up yet)</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pendingBarbers.map((p) => (
              <li
                key={p.id}
                style={{
                  background: 'var(--ff-card)',
                  border: '1px solid var(--ff-gold)',
                  borderRadius: 12,
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <UserPlus size={20} color="var(--ff-gold)" />
                <div>
                  <strong>{p.name}</strong> — {p.email}
                  {p.phone && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--ff-gray)' }}>{p.phone}</span>}
                  {p.locationId && locById[p.locationId] && (
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <MapPin size={12} /> {locById[p.locationId].name}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profiles.length === 0 && pendingBarbers.length === 0 && !showAdd && (
        <p>No staff yet. Add barbers above or set roles in Profile.</p>
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
              {p.phone && <div style={{ fontSize: '0.85rem', color: 'var(--ff-gray)' }}>{p.phone}</div>}
              {p.locationId && locById[p.locationId] ? (
                <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={14} /> {locById[p.locationId].name}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--ff-gray)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                  Not pinned to a location — barber can set in Profile
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
