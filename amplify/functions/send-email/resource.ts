import { defineFunction } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  timeoutSeconds: 15,
  environment: {
    MAIL_FROM: process.env.MAIL_FROM ?? 'noreply@foreverfaded.com',
  },
});
