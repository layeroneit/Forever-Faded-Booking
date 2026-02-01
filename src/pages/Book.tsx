import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export default function Book() {
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [services, setServices] = useState<Schema['Service']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [locRes, svcRes] = await Promise.all([
        client.models.Location.list(),
        client.models.Service.list(),
      ]);
      setLocations(locRes.data ?? []);
      setServices(svcRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">Book Appointment</h1>
      <p className="page-subtitle">Choose location and service.</p>
      {locations.length === 0 && <p>No locations yet. Add data via Amplify Data manager or seed.</p>}
      {locations.length > 0 && (
        <ul>
          {locations.map((loc) => (
            <li key={loc.id}>{loc.name} — {loc.address}</li>
          ))}
        </ul>
      )}
      {services.length > 0 && (
        <ul>
          {services.map((svc) => (
            <li key={svc.id}>{svc.name} — ${((svc.priceCents ?? 0) / 100).toFixed(2)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
