import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Clock, ChevronRight } from 'lucide-react';
import '../styles/Book.css';

const client = generateClient<Schema>();

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '';

function CheckoutForm({
  appointmentId,
  amountCents,
  onSuccess,
  onPayAtShop,
}: {
  appointmentId: string;
  amountCents: number;
  onSuccess: () => void;
  onPayAtShop: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');
    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/book',
        },
      });
      if (submitError) {
        setError(submitError.message ?? 'Payment failed');
        setProcessing(false);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="book-panel">
      <h2 className="dashboard-section">Pay now</h2>
      <p className="book-hint">${(amountCents / 100).toFixed(2)} — secure payment via Stripe.</p>
      <PaymentElement />
      {error && (
        <div className="login-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
      <div className="book-actions" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onPayAtShop}>
          I&apos;ll pay at the shop
        </button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || processing}>
          {processing ? 'Processing…' : 'Pay now'}
        </button>
      </div>
    </form>
  );
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function Book() {
  const auth = useAuth();
  const userId = (auth.user?.profile?.sub as string) ?? '';

  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<Schema['Location']['type'][]>([]);
  const [services, setServices] = useState<Schema['Service']['type'][]>([]);
  const [barbers, setBarbers] = useState<Schema['UserProfile']['type'][]>([]);
  const [locationId, setLocationId] = useState('');
  const [service, setService] = useState<Schema['Service']['type'] | null>(null);
  const [barber, setBarber] = useState<Schema['UserProfile']['type'] | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<Schema['Appointment']['type'] | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [paymentPreparing, setPaymentPreparing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [locRes, svcRes, profileRes] = await Promise.all([
        client.models.Location.list(),
        client.models.Service.list(),
        client.models.UserProfile.list(),
      ]);
      setLocations(locRes.data ?? []);
      setServices(svcRes.data ?? []);
      const barberProfiles = (profileRes.data ?? []).filter(
        (p) => p.role === 'barber' && p.isActive !== false
      );
      setBarbers(barberProfiles);
      if ((locRes.data ?? []).length > 0) setLocationId((locRes.data![0] as { id: string }).id);
      setLoading(false);
    };
    fetchData();
  }, []);

  const barbersAtLocation = locationId
    ? barbers.filter((b) => !b.locationId || b.locationId === locationId)
    : barbers;
  const servicesAtLocation = locationId
    ? services.filter((s) => !s.locationId || s.locationId === locationId)
    : services;

  const handleBook = async (payNow: boolean = false) => {
    if (!service || !barber || !date || !time || !userId) return;
    setSubmitting(true);
    setError('');
    setBookingSuccess('');
    try {
      const startAt = new Date(`${date}T${time}`);
      const duration = service.durationMinutes ?? 15;
      const endAt = new Date(startAt.getTime() + duration * 60 * 1000);
      const totalCents = service.priceCents ?? 0;

      const { data: apt } = await client.models.Appointment.create({
        locationId,
        clientId: userId,
        barberId: barber.id,
        serviceId: service.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        totalCents,
        status: 'pending',
        paymentStatus: 'unpaid',
      });

      const appointment = apt as Schema['Appointment']['type'];
      if (!payNow) {
        setBookingSuccess('Booking confirmed. Pay at the shop.');
        resetAfterBook();
        return;
      }

      setBookedAppointment(appointment);
      setPaymentPreparing(true);
      try {
        const { data: pi } = await client.mutations.createPaymentIntent({
          appointmentId: appointment.id,
          amountCents: totalCents,
        });
        const secret = (pi as { clientSecret?: string })?.clientSecret;
        const err = (pi as { error?: string })?.error;
        if (err || !secret) {
          setBookingSuccess('Booking confirmed. Online payment is not configured — please pay at the shop.');
          resetAfterBook();
          return;
        }
        if (publishableKey) {
          const stripe = await loadStripe(publishableKey);
          setStripePromise(stripe);
          setPaymentClientSecret(secret);
        } else {
          setBookingSuccess('Booking confirmed. Set VITE_STRIPE_PUBLISHABLE_KEY for online payment.');
          resetAfterBook();
        }
      } catch {
        setBookingSuccess('Booking confirmed. Payment unavailable — please pay at the shop.');
        resetAfterBook();
      } finally {
        setPaymentPreparing(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAfterBook = () => {
    setBookedAppointment(null);
    setPaymentClientSecret('');
    setStep(1);
    setService(null);
    setBarber(null);
    setDate('');
    setTime('');
  };

  const handlePaymentSuccess = () => {
    setBookingSuccess('Booking confirmed. Payment received.');
    resetAfterBook();
  };

  const handlePayAtShop = () => {
    setBookingSuccess('Booking confirmed. Pay at the shop.');
    resetAfterBook();
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error && step === 1) return <div className="page-error">{error}</div>;

  if (bookingSuccess) {
    return (
      <div className="book-page">
        <h1 className="page-title">Book Appointment</h1>
        <div className="login-success" style={{ marginTop: '1rem' }}>
          {bookingSuccess}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => setBookingSuccess('')}
        >
          Book another
        </button>
      </div>
    );
  }

  if (paymentPreparing) {
    return (
      <div className="book-page">
        <h1 className="page-title">Book Appointment</h1>
        <div className="page-loading">Booking confirmed. Preparing payment…</div>
      </div>
    );
  }

  if (bookedAppointment && paymentClientSecret && stripePromise) {
    const amountCents = bookedAppointment.totalCents ?? 0;
    return (
      <div className="book-page">
        <h1 className="page-title">Book Appointment</h1>
        <p className="page-subtitle">Complete payment for your booking.</p>
        <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
          <CheckoutForm
            appointmentId={bookedAppointment.id}
            amountCents={amountCents}
            onSuccess={handlePaymentSuccess}
            onPayAtShop={handlePayAtShop}
          />
        </Elements>
      </div>
    );
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="book-page">
      <h1 className="page-title">Book Appointment</h1>
      <p className="page-subtitle">Choose location, barber, service, and time.</p>

      <div className="book-steps">
        <div className={`book-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <span className="book-step-num">1</span>
          <span>Location</span>
        </div>
        <div className={`book-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
          <span className="book-step-num">2</span>
          <span>Barber</span>
        </div>
        <div className={`book-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`}>
          <span className="book-step-num">3</span>
          <span>Service</span>
        </div>
        <div className={`book-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'done' : ''}`}>
          <span className="book-step-num">4</span>
          <span>Date & Time</span>
        </div>
        <div className={`book-step ${step >= 5 ? 'active' : ''}`}>
          <span className="book-step-num">5</span>
          <span>Confirm</span>
        </div>
      </div>

      {step === 1 && (
        <div className="book-panel">
          <label className="book-label">Choose location</label>
          <select
            className="book-select"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <div className="book-actions">
            <span />
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="book-panel">
          <label className="book-label">
            Choose barber at {locations.find((l) => l.id === locationId)?.name ?? 'location'}
          </label>
          <div className="book-grid barbers">
            {barbersAtLocation.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`book-card barber ${barber?.id === b.id ? 'selected' : ''}`}
                onClick={() => setBarber(b)}
              >
                <div className="book-avatar">
                  {b.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="book-card-name">{b.name}</div>
              </button>
            ))}
          </div>
          {barbersAtLocation.length === 0 && (
            <p className="book-empty">No barbers at this location yet.</p>
          )}
          <div className="book-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!barber}
              onClick={() => setStep(3)}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="book-panel">
          <label className="book-label">Choose service</label>
          <div className="book-grid">
            {servicesAtLocation.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className={`book-card ${service?.id === svc.id ? 'selected' : ''}`}
                onClick={() => setService(svc)}
              >
                <div className="book-card-name">{svc.name}</div>
                <div className="book-card-price">
                  ${((svc.priceCents ?? 0) / 100).toFixed(2)}
                </div>
                {(svc.durationMinutes ?? 0) > 0 && (
                  <span className="book-duration">
                    <Clock size={14} /> {svc.durationMinutes} min
                  </span>
                )}
              </button>
            ))}
          </div>
          {servicesAtLocation.length === 0 && (
            <p className="book-empty">No services at this location yet.</p>
          )}
          <div className="book-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!service}
              onClick={() => setStep(4)}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="book-panel">
          <label className="book-label">Date</label>
          <input
            type="date"
            className="book-input"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="book-label">Time</label>
          <div className="book-grid time-slots">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                className={`book-card ${time === t ? 'selected' : ''}`}
                onClick={() => setTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="book-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(3)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!date || !time}
              onClick={() => setStep(5)}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 5 && service && barber && (
        <div className="book-panel">
          <h2 className="dashboard-section">Confirm</h2>
          <p className="book-hint">
            {locations.find((l) => l.id === locationId)?.name} — {barber.name} — {service.name} —{' '}
            ${((service.priceCents ?? 0) / 100).toFixed(2)} — {date} at {time}
          </p>
          <div className="book-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => handleBook(false)}
            >
              Pay at shop
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={() => handleBook(true)}
            >
              {submitting ? 'Booking…' : 'Pay now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
