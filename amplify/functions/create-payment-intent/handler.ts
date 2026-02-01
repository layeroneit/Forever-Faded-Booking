/**
 * Lambda: create Stripe PaymentIntent for an appointment.
 * Set STRIPE_SECRET_KEY in Amplify env / secrets.
 */
import type { Handler } from 'aws-lambda';

type CreatePaymentIntentEvent = {
  arguments: { appointmentId: string; amountCents?: number };
};

export const handler: Handler<CreatePaymentIntentEvent> = async (event) => {
  const { appointmentId, amountCents } = event.arguments ?? {};
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith('sk_')) {
    return { clientSecret: null, error: 'Stripe not configured' };
  }
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' });
    const amount = Math.max(50, amountCents ?? 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { appointmentId, source: 'forever-faded-booking' },
      automatic_payment_methods: { enabled: true },
    });
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Payment intent failed';
    return { clientSecret: null, error: message };
  }
};
