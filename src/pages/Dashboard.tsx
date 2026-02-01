import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { SEED_LOCATION, SEED_SERVICES } from '../seed-data';
import { Calendar, DollarSign, Users } from 'lucide-react';
import '../styles/Dashboard.css';

const client = generateClient<Schema>();

type Stats = {
  completedToday: number;
  totalAppointments: number;
  totalRevenueCents: number;
  staffCount: number;
};

export default function Dashboard() {
  const { user } = useAuthenticator((context) => [context.user]);
  const email = (user?.signInDetails?.loginId as string) ?? '';
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const role = profile?.role ?? 'client';
  const displayName = profile?.name ?? email?.split('@')[0] ?? '';
  const isOwnerOrAdmin = role === 'owner' || role === 'admin' || role === 'manager';

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => setUserId(''));
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: profiles } = await client.models.UserProfile.list();
        const mine = (profiles ?? []).find((p) => p.userId === userId);
        if (!cancelled && mine) setProfile(mine as Schema['UserProfile']['type']);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!isOwnerOrAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const [aptRes, profRes] = await Promise.all([
          client.models.Appointment.list(),
          client.models.UserProfile.list(),
        ]);
        if (cancelled) return;
        const appointments = aptRes.data ?? [];
        const completed = appointments.filter((a) => a.status === 'completed');
        const today = new Date().toDateString();
        const completedToday = completed.filter((a) => new Date(a.startAt).toDateString() === today).length;
        const totalRevenueCents = completed.reduce((sum, a) => sum + (a.totalCents ?? 0) - (a.discountCents ?? 0), 0);
        const staff = (profRes.data ?? []).filter((p) => ['barber', 'manager', 'owner', 'admin'].includes(p.role ?? ''));
        setStats({
          completedToday,
          totalAppointments: completed.length,
          totalRevenueCents,
          staffCount: staff.length,
        });
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwnerOrAdmin]);

  const runSeed = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const { data: locations } = await client.models.Location.list();
      let locationId: string | undefined;
      if (locations && locations.length > 0) {
        locationId = (locations[0] as { id: string }).id;
        setSeedMessage('Location already exists. Adding services…');
      } else {
        const { data: created } = await client.models.Location.create({
          name: SEED_LOCATION.name,
          address: SEED_LOCATION.address,
          city: SEED_LOCATION.city,
          state: SEED_LOCATION.state,
          zip: SEED_LOCATION.zip,
          phone: SEED_LOCATION.phone,
          timezone: SEED_LOCATION.timezone,
          isActive: SEED_LOCATION.isActive,
        });
        locationId = (created as { id: string })?.id;
        setSeedMessage('Location created. Adding services…');
      }

      const { data: existingServices } = await client.models.Service.list();
      const existingNames = new Set((existingServices ?? []).map((s) => s.name));
      let added = 0;
      for (const s of SEED_SERVICES) {
        if (existingNames.has(s.name)) continue;
        await client.models.Service.create({
          locationId: undefined,
          name: s.name,
          category: s.category,
          description: s.description ?? undefined,
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          isActive: true,
        });
        added++;
      }
      setSeedMessage(
        added > 0
          ? `Done. Location ready. ${added} new service(s) added.`
          : locationId
            ? 'Done. Location and all services already exist.'
            : 'Location and services created.'
      );
    } catch (e) {
      setSeedMessage(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="dashboard-page ff-bg-waves">
      <header className="dashboard-hero">
        <h1 className="dashboard-hero-title">DASHBOARD</h1>
        <p className="dashboard-hero-subtitle">Welcome back, {displayName || email}.</p>
      </header>

      {isOwnerOrAdmin && stats && (
        <div className="dashboard-stats">
          <div className="stat-card stat-card-gold">
            <div className="stat-icon"><Calendar size={26} /></div>
            <div className="stat-value">{stats.completedToday}</div>
            <div className="stat-label">Completed Today</div>
          </div>
          <div className="stat-card stat-card-blue">
            <div className="stat-icon"><Calendar size={26} /></div>
            <div className="stat-value">{stats.totalAppointments}</div>
            <div className="stat-label">Total Completed</div>
          </div>
          <div className="stat-card stat-card-red">
            <div className="stat-icon"><DollarSign size={26} /></div>
            <div className="stat-value">${(stats.totalRevenueCents / 100).toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <Link to="/staff" className="stat-card stat-card-link stat-card-gold">
            <div className="stat-icon"><Users size={26} /></div>
            <div className="stat-value">{stats.staffCount}</div>
            <div className="stat-label">Staff</div>
          </Link>
        </div>
      )}

      <section className="dashboard-tools">
        <h2 className="dashboard-section">Setup</h2>
        <p className="page-subtitle" style={{ marginBottom: '0.5rem' }}>
          Same location and services as the platform: Waukesha + Test Service, Face, Adults, Teens, Children, Seniors &amp; Military.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={seeding}
          onClick={runSeed}
        >
          {seeding ? 'Seeding…' : 'Seed location & services'}
        </button>
        {seedMessage && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--ff-gold)' }}>{seedMessage}</p>
        )}
      </section>

      <p className="dashboard-footer-note">
        Test users (sign up with these): see <strong>TEST-USERS.md</strong> — owner@foreverfaded.com, mike@foreverfaded.com, chris@foreverfaded.com, john@example.com (password: password123).
      </p>
    </div>
  );
}
