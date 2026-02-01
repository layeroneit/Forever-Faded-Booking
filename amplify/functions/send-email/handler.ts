/**
 * Lambda: send email via AWS SES (or SMTP via env).
 * Configure MAIL_FROM and optionally SMTP_* in Amplify env.
 */
import type { Handler } from 'aws-lambda';

type SendEmailEvent = {
  arguments: { to: string; subject: string; text: string };
};

export const handler: Handler<SendEmailEvent> = async (event) => {
  const { to, subject, text } = event.arguments ?? {};
  if (!to || !subject || !text) {
    return { sent: false, error: 'to, subject, and text required' };
  }
  try {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const client = new SESClient({});
    const from = process.env.MAIL_FROM ?? 'noreply@foreverfaded.com';
    await client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: text },
          },
        },
      })
    );
    return { sent: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Send failed';
    return { sent: false, error: message };
  }
};
