import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { MapPin, Plus, UserPlus, Trash2, Clock } from 'lucide-react';
import '../styles/Book.css';

const client = generateClient<Schema>();

const STAFF_ROLES = ['barber', 'manager', 'owner', 'admin'];
const INVITE_EXPIRY_HOURS = 48;

function isInviteExpired(createdAt: string | null | undefined): boolean {
  if (!createdAt) return true;
  const created = new Date(createdAt).getTime();
  const expiry = created + INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  return Date.now() > expiry;
}

function getExpiryLabel(createdAt: string | null | undefined): string {
  if (!createdAt) return 'Expired';
  const created = new Date(createdAt).getTime();
  const expiry = created + INVITE_EXPIRY_HOURS * 60 * 60 * 1000;
  if (Date.now() > expiry) return 'Expired';
  const d = new Date(expiry);
  return `Expires ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingExpired, setClearingExpired] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    locationId: '',
    invitedRole: 'barber' as 'barber' | 'owner',
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
  const isOwnerRole = (profile?.role ?? '').toLowerCase() === 'owner';

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setAddError('Name and email are required.');
      return;
    }
    setSaving(true);
    setAddError('');
    setInviteSuccess(null);
    const invitedEmail = form.email.trim().toLowerCase();
    const invitedRole = form.invitedRole;
    const invitedName = form.name.trim();
    try {
      await client.models.PendingBarber.create({
        name: invitedName,
        email: invitedEmail,
        phone: form.phone.trim() || undefined,
        locationId: form.locationId || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        invitedRole,
      });
      setForm({ name: '', email: '', phone: '', locationId: '', invitedRole: 'barber' });
      setShowAdd(false);

      const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const roleLabel = invitedRole === 'owner' ? 'owner' : 'barber';

      try {
        await client.mutations.sendEmail({
          to: invitedEmail,
          subject: "You're invited to Forever Faded",
          text: `Hi ${invitedName},\n\nYou've been invited to join Forever Faded as a ${roleLabel}. Sign up within 48 hours to accept:\n\n${appUrl}\n\nUse this email address when creating your account. After you sign in, your ${roleLabel} profile will be set up automatically.\n\n— Forever Faded`,
        });
      } catch (emailErr) {
        console.warn('Invite email failed:', emailErr);
      }

      const { data: allProfiles } = await client.models.UserProfile.list();
      const ownerEmails = (allProfiles ?? [])
        .filter((p) => ['owner', 'admin'].includes((p.role ?? '').toLowerCase()))
        .map((p) => p.email)
        .filter((e): e is string => !!e && e !== invitedEmail);
      const loginEmail = (user?.signInDetails?.loginId as string)?.trim()?.toLowerCase();
      if (loginEmail && isOwner && loginEmail !== invitedEmail && !ownerEmails.includes(loginEmail)) {
        ownerEmails.push(loginEmail);
      }
      const uniqueOwnerEmails = [...new Set(ownerEmails)];
      let ownerNotifyCount = 0;
      for (const to of uniqueOwnerEmails) {
        try {
          await client.mutations.sendEmail({
            to,
            subject: 'Forever Faded — New staff invite',
            text: `A new ${roleLabel} invitation was sent to ${invitedEmail} (${invitedName}). They will appear in Pending invites until they sign up. Invite expires in ${INVITE_EXPIRY_HOURS} hours.\n\n— Forever Faded`,
          });
          ownerNotifyCount += 1;
        } catch (ownerEmailErr) {
          console.warn('Owner notification email failed:', ownerEmailErr);
        }
      }

      const notifyNote = ownerNotifyCount > 0
        ? ` Owners have been notified by email.`
        : '';
      setInviteSuccess(`Invite sent to ${invitedEmail}. They'll receive an email to sign up. Invite expires in ${INVITE_EXPIRY_HOURS} hours. They appear below under Pending until they accept.${notifyNote}`);
      load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add barber');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePending = async (id: string) => {
    if (!window.confirm('Remove this pending invite? They will need to be re-invited to sign up as barber.')) return;
    setDeletingId(id);
    try {
      await client.models.PendingBarber.delete({ id });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveExpired = async () => {
    const expired = pendingBarbers.filter((p) => isInviteExpired(p.createdAt));
    if (expired.length === 0) return;
    if (!window.confirm(`Remove ${expired.length} expired invite(s)?`)) return;
    setClearingExpired(true);
    try {
      await Promise.all(expired.map((p) => client.models.PendingBarber.delete({ id: p.id })));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove expired');
    } finally {
      setClearingExpired(false);
    }
  };

  const handleClearAllPending = async () => {
    if (pendingBarbers.length === 0) return;
    if (!window.confirm(`Remove all ${pendingBarbers.length} pending invite(s)? They will need to be re-invited.`)) return;
    setClearingAll(true);
    try {
      await Promise.all(pendingBarbers.map((p) => client.models.PendingBarber.delete({ id: p.id })));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear pending');
    } finally {
      setClearingAll(false);
    }
  };

  const expiredCount = pendingBarbers.filter((p) => isInviteExpired(p.createdAt)).length;

  if (loading) return <div className="page-loading">Loading staff…</div>;
  if (error) return <div className="page-error">{error}</div>;

  const locById = Object.fromEntries(locations.map((l) => [l.id, l]));

  return (
    <div>
      <h1 className="page-title">Staff</h1>
      <p className="page-subtitle">Barbers and staff. Add barbers below; they will get barber access when they sign up with that email.</p>

      {inviteSuccess && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(30, 90, 168, 0.2)',
            border: '1px solid var(--ff-border-blue)',
            borderRadius: 12,
            color: '#93c5fd',
            fontSize: '0.95rem',
          }}
        >
          {inviteSuccess}
          <button
            type="button"
            onClick={() => setInviteSuccess(null)}
            aria-label="Dismiss"
            style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

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
                Enter barber details. When they sign up with this email, their profile will be created with role &quot;barber&quot; and this location. Invite expires in {INVITE_EXPIRY_HOURS} hours.
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
                {isOwnerRole && (
                  <label>
                    <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Invite as</span>
                    <select
                      className="book-select"
                      value={form.invitedRole}
                      onChange={(e) => setForm((f) => ({ ...f, invitedRole: e.target.value as 'barber' | 'owner' }))}
                      aria-label="Invite as role"
                    >
                      <option value="barber">Barber</option>
                      <option value="owner">Owner</option>
                    </select>
                    <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--ff-gray)' }}>
                      Only owners can invite another owner. They will get this role when they sign up.
                    </span>
                  </label>
                )}
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

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--ff-gold)', marginBottom: '0.75rem' }}>
          Pending invites (expire after {INVITE_EXPIRY_HOURS}h)
        </h3>
        {pendingBarbers.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--ff-gray)' }}>
            No pending invites. Use &quot;Add barber&quot; above to send an invite; they will appear here until they sign up.
          </p>
        ) : (
          <>
            {isOwner && (expiredCount > 0 || pendingBarbers.length > 0) && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {expiredCount > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleRemoveExpired}
                    disabled={clearingExpired}
                  >
                    {clearingExpired ? 'Removing…' : `Remove expired (${expiredCount})`}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearAllPending}
                  disabled={clearingAll}
                >
                  {clearingAll ? 'Removing…' : 'Clear all pending'}
                </button>
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pendingBarbers.map((p) => {
                const expired = isInviteExpired(p.createdAt);
                return (
                  <li
                    key={p.id}
                    style={{
                      background: expired ? 'rgba(185, 28, 28, 0.12)' : 'var(--ff-card)',
                      border: `1px solid ${expired ? 'var(--ff-red)' : 'var(--ff-gold)'}`,
                      borderRadius: 12,
                      padding: '0.75rem 1rem',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <UserPlus size={20} color={expired ? 'var(--ff-red)' : 'var(--ff-gold)'} />
                      <div>
                        <strong>{p.name}</strong> — {p.email}
                        {(p as { invitedRole?: string }).invitedRole === 'owner' && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ff-gold)', textTransform: 'uppercase' }}>Owner</span>
                        )}
                        {p.phone && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--ff-gray)' }}>{p.phone}</span>}
                        <div style={{ fontSize: '0.8rem', color: 'var(--ff-gray)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={12} />
                          {getExpiryLabel(p.createdAt)}
                          {expired && <span style={{ color: 'var(--ff-red)', fontWeight: 600 }}>— Expired</span>}
                        </div>
                        {p.locationId && locById[p.locationId] && (
                          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <MapPin size={12} /> {locById[p.locationId].name}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleDeletePending(p.id)}
                        disabled={deletingId === p.id}
                        title="Remove this pending invite"
                        style={{ flexShrink: 0, padding: '0.5rem' }}
                      >
                        {deletingId === p.id ? '…' : <Trash2 size={18} />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

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
