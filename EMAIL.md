# Email setup (Forever Faded Booking)

The app sends booking confirmation emails via a **Lambda function** that uses **AWS SES**. If SES is not configured, the mutation returns `{ sent: false, error: "…" }` and the app can still work without email.

## Backend (Amplify / Lambda)

Set these in **Amplify Console** → your app → **Environment variables** (or use `npx ampx sandbox --config env.json` / secrets):

| Variable   | Example                     | Notes |
|-----------|-----------------------------|--------|
| `MAIL_FROM` | `noreply@foreverfaded.com` | Must be a **verified** SES identity (domain or email). |

## AWS SES

1. In **AWS SES** (same region as your Amplify app), verify a **domain** or **email address**.
2. Use that identity as `MAIL_FROM` (e.g. `noreply@yourdomain.com`).
3. If the account is in **SES Sandbox**, you can only send to verified addresses until you request production access.

## Using the send-email mutation

The Data API exposes a custom mutation `sendEmail`:

- **Arguments:** `to` (string), `subject` (string), `text` (string).
- **Returns:** `{ sent: boolean, error?: string }`.

Example (after booking):

```ts
const { data } = await client.mutations.sendEmail({
  to: userEmail,
  subject: 'Appointment confirmed',
  text: `Your cut is on ${date} at ${time}.`,
});
if (data?.sent) { /* ok */ }
```

## Troubleshooting

- **"Email address is not verified"** — In SES Sandbox, add the recipient as a verified identity or move SES out of sandbox.
- **"InvalidParameterValue"** — Ensure `MAIL_FROM` is exactly a verified SES identity.
