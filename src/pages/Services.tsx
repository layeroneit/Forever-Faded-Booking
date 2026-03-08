import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Scissors, Plus, Star } from 'lucide-react';
import '../styles/Book.css';

const client = generateClient<Schema>();

export default function Services() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [services, setServices] = useState<Schema['Service']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Special',
    description: '',
    durationMinutes: '30',
    priceCents: '0',
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

  const loadServices = () => {
    client.models.Service.list()
      .then((res) => setServices(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const isOwner = ['owner', 'admin'].includes(profile?.role ?? '');

  const handleAddSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setAddError('Name is required.');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await client.models.Service.create({
        name: form.name.trim(),
        category: form.category.trim() || 'Special',
        description: form.description.trim() || undefined,
        durationMinutes: parseInt(form.durationMinutes, 10) || 30,
        priceCents: Math.round(parseFloat(form.priceCents) * 100) || 0,
        isSpecial: true,
        isActive: true,
      });
      setForm({ name: '', category: 'Special', description: '', durationMinutes: '30', priceCents: '0' });
      setShowAdd(false);
      loadServices();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading services…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Services</h1>
      <p className="page-subtitle">Services and pricing. Special services allow custom pricing at checkout.</p>

      {isOwner && (
        <div style={{ marginBottom: '1.5rem' }}>
          {!showAdd ? (
            <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Add special service
            </button>
          ) : (
            <form onSubmit={handleAddSpecial} className="page-card" style={{ maxWidth: 480, padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--ff-gold)' }}>New special service</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--ff-gray)', marginBottom: '1rem' }}>
                Special services allow the client to enter a custom price at checkout.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Name *</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Custom Design"
                    required
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Category</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Special"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Description</span>
                  <input
                    type="text"
                    className="book-input"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Duration (minutes)</span>
                  <input
                    type="number"
                    className="book-input"
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    min="5"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Default price ($)</span>
                  <input
                    type="number"
                    className="book-input"
                    value={form.priceCents}
                    onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </label>
                {addError && <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{addError}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding…' : 'Add special service'}
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

      {services.length === 0 && !showAdd && <p>No services yet. Seed from Dashboard or add a special service above.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {services.map((svc) => (
          <li
            key={svc.id}
            style={{
              background: 'var(--ff-card)',
              border: svc.isSpecial ? '1px solid var(--ff-gold)' : '1px solid var(--ff-border)',
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
              {svc.isSpecial ? <Star size={20} color="var(--ff-gold)" /> : <Scissors size={20} color="var(--ff-gold)" />}
              <div>
                <strong>{svc.name}</strong>
                {svc.isSpecial && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--ff-gold)', background: 'rgba(201,162,39,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                    Custom price
                  </span>
                )}
                {svc.category && !svc.isSpecial && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--ff-gray)' }}>
                    {svc.category}
                  </span>
                )}
                {svc.category && svc.isSpecial && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--ff-gray)' }}>
                    {svc.category}
                  </span>
                )}
                {(svc.durationMinutes ?? 0) > 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--ff-gray)' }}>{svc.durationMinutes} min</div>
                )}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--ff-gold)', textAlign: 'right' }}>
              {svc.isSpecial ? (
                <span style={{ fontSize: '0.9rem' }}>Custom</span>
              ) : (
                `$${((svc.priceCents ?? 0) / 100).toFixed(2)}`
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
