import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { MapPin, Plus } from 'lucide-react';

const client = generateClient<Schema>();

export default function Locations() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    timezone: 'America/New_York',
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

  useEffect(() => {
    client.models.Location.list()
      .then((res) => setLocations(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const isOwner = ['owner', 'admin'].includes(profile?.role ?? '');

  const loadLocations = () => {
    client.models.Location.list().then((res) => setLocations(res.data ?? []));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim()) {
      setAddError('Name, address, city, state, and zip are required.');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await client.models.Location.create({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        phone: form.phone.trim() || undefined,
        timezone: form.timezone.trim() || 'America/New_York',
      });
      setForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', timezone: 'America/New_York' });
      setShowAdd(false);
      loadLocations();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add location');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading locations…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Locations</h1>
      <p className="page-subtitle">Shop locations.</p>
      {isOwner && (
        <div style={{ marginBottom: '1.5rem' }}>
          {!showAdd ? (
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Add location
            </button>
          ) : (
            <form onSubmit={handleAdd} className="page-card" style={{ maxWidth: 480, padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--ff-gold)' }}>New location</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Name *</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Main Street"
                    required
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Address *</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Street address"
                    required
                  />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>City *</span>
                    <input
                      type="text"
                      className="book-input"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>State *</span>
                    <input
                      type="text"
                      className="book-input"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="e.g. WI"
                      required
                    />
                  </label>
                </div>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>ZIP *</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    placeholder="12345"
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
                {addError && <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{addError}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding…' : 'Add location'}
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
      {locations.length === 0 && !showAdd && (
        <p>No locations yet. Seed from Dashboard or add a location above.</p>
      )}
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
