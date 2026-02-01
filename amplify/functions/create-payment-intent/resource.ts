import { defineFunction } from '@aws-amplify/backend';

export const createPaymentIntent = defineFunction({
  name: 'create-payment-intent',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  },
});
