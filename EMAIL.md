# Email setup (Forever Faded Booking)

The app sends **invite emails** (and optional owner notifications) via a **Lambda function** that uses **AWS SES**. If SES is not configured, the mutation returns `{ sent: false, error: "…" }` and the invite is still saved (recipient just won’t get an email).

## Backend (Amplify / Lambda)

Set these in **Amplify Console** → your app → **Environment variables** (or use `npx ampx sandbox --config env.json` / secrets):

| Variable   | Example                     | Notes |
|-----------|-----------------------------|--------|
| `MAIL_FROM` | `noreply@foreverfaded.com` | Must be a **verified** SES identity (domain or email). |

The **send-email** Lambda is granted `ses:SendEmail` and `ses:SendRawEmail` in `amplify/backend.ts`. No extra IAM is required if you use the project’s backend as-is.

## AWS SES

1. In **AWS SES** (same region as your Amplify app), verify a **domain** or **email address**.
2. Use that identity as `MAIL_FROM` (e.g. `noreply@yourdomain.com`).
3. If the account is in **SES Sandbox**, you can only send **to verified addresses** until you request production access.

## “Invite not received” checklist

If the invite flow runs but the recipient never gets the email:

1. **SES sender** — In AWS SES (correct region), ensure the **From** identity is **Verified** (domain or email matching `MAIL_FROM`).
2. **SES Sandbox** — If SES is in Sandbox, either verify the **recipient** email in SES or request **production access**.
3. **MAIL_FROM** — In Amplify env, set `MAIL_FROM` to the exact verified identity (e.g. `noreply@foreverfaded.com`). Redeploy/restart sandbox after changing env.
4. **Region** — Lambda and SES must be in the same region (Lambda uses `AWS_REGION`; SES identity must exist there).
5. **Spam** — Ask the recipient to check spam/junk and “Not spam” if needed.
6. **UI error** — After sending an invite, if the message says “Invite email could not be sent: …”, use that error (e.g. “Email address is not verified”, “AccessDenied”) to fix config above.

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
- **"AccessDenied"** / **"User is not authorized"** — The Lambda must have `ses:SendEmail` (see `amplify/backend.ts`). Redeploy the backend after adding the policy.
