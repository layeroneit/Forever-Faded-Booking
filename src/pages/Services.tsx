import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Scissors, Plus, Star, Pencil } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    category: string;
    description: string;
    durationMinutes: string;
    priceCents: string;
    isSpecial: boolean;
    isActive: boolean;
  } | null>(null);
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

  const loadServices = () => {
    return client.models.Service.list()
      .then((res) => setServices(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  };

  useEffect(() => {
    if (!userId) {
      loadServices().finally(() => setLoading(false));
      return;
    }
    let cancelled = false;
    Promise.all([
      client.models.UserProfile.list(),
      client.models.Service.list(),
    ])
      .then(([profRes, svcRes]) => {
        if (cancelled) return;
        const mine = (profRes.data ?? []).find((p) => p.userId === userId) as Schema['UserProfile']['type'] | undefined;
        setProfile(mine ?? null);
        setServices(svcRes.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const isOwner = ['owner', 'admin'].includes(profile?.role ?? '');
  const canEditServices = ['owner', 'barber'].includes((profile?.role ?? '').toLowerCase());

  const startEdit = (svc: Schema['Service']['type']) => {
    setAddError('');
    setEditingId(svc.id);
    setEditForm({
      name: svc.name ?? '',
      category: svc.category ?? '',
      description: svc.description ?? '',
      durationMinutes: String(svc.durationMinutes ?? 30),
      priceCents: String(((svc.priceCents ?? 0) / 100).toFixed(2)),
      isSpecial: svc.isSpecial ?? false,
      isActive: svc.isActive ?? true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    if (!editForm.name.trim()) {
      setAddError('Name is required.');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await client.models.Service.update({
        id: editingId,
        name: editForm.name.trim(),
        category: editForm.category.trim() || undefined,
        description: editForm.description.trim() || undefined,
        durationMinutes: parseInt(editForm.durationMinutes, 10) || 30,
        priceCents: Math.round(parseFloat(editForm.priceCents) * 100) || 0,
        isSpecial: editForm.isSpecial,
        isActive: editForm.isActive,
      });
      cancelEdit();
      loadServices();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

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
      <p className="page-subtitle">Services and pricing. Owners and barbers can edit any service (e.g. Full Facial)—change price, duration, name, or deactivate.</p>

      {canEditServices && (
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
          <li key={svc.id}>
            {editingId === svc.id && editForm ? (
              <form onSubmit={handleUpdateService} style={{ background: 'var(--ff-card)', border: '1px solid var(--ff-gold)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--ff-gold)', fontSize: '0.95rem' }}>Edit: {editForm.name || 'Service'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>Name *</span>
                    <input type="text" className="book-input" value={editForm.name} onChange={(e) => setEditForm((f) => f && { ...f, name: e.target.value })} required />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>Category</span>
                    <input type="text" className="book-input" value={editForm.category} onChange={(e) => setEditForm((f) => f && { ...f, category: e.target.value })} />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>Description</span>
                    <input type="text" className="book-input" value={editForm.description} onChange={(e) => setEditForm((f) => f && { ...f, description: e.target.value })} />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>Duration (min)</span>
                    <input type="number" className="book-input" value={editForm.durationMinutes} onChange={(e) => setEditForm((f) => f && { ...f, durationMinutes: e.target.value })} min={5} />
                  </label>
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.85rem' }}>Price ($)</span>
                    <input type="number" className="book-input" value={editForm.priceCents} onChange={(e) => setEditForm((f) => f && { ...f, priceCents: e.target.value })} min={0} step="0.01" />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={editForm.isSpecial} onChange={(e) => setEditForm((f) => f && { ...f, isSpecial: e.target.checked })} />
                    <span style={{ fontSize: '0.9rem' }}>Special (custom price at checkout)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((f) => f && { ...f, isActive: e.target.checked })} />
                    <span style={{ fontSize: '0.9rem' }}>Active (visible to clients)</span>
                  </label>
                </div>
                {addError && <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.5rem' }}>{addError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </form>
            ) : (
              <div
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
                    {svc.isActive === false && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ff-red)' }}>Inactive</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ff-gold)', textAlign: 'right' }}>
                    {svc.isSpecial ? (
                      <span style={{ fontSize: '0.9rem' }}>Custom</span>
                    ) : (
                      `$${((svc.priceCents ?? 0) / 100).toFixed(2)}`
                    )}
                  </div>
                  {canEditServices && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => startEdit(svc)}
                      title="Edit price and details"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem' }}
                    >
                      <Pencil size={18} /> Edit
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
