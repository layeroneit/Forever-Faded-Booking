# Stripe setup (Forever Faded Booking)

The app uses **Stripe Payment Intents** for prepaid bookings. Payment is handled by a Lambda function; the frontend uses Stripe.js and the publishable key.

## Backend (Amplify / Lambda)

Set **`STRIPE_SECRET_KEY`** in Amplify so the create-payment-intent Lambda can use it:

1. **Amplify Console:** Open your app → **Environment variables** (or **Secrets**).
2. Add a variable: name **`STRIPE_SECRET_KEY`**, value = your **secret** key (starts with `sk_live_` or `sk_test_`).
3. Prefer **Secrets** so the key is not shown in the UI. If you use a publishable key (`pk_…`) by mistake, the Lambda will return `"Stripe not configured"`.

**Local sandbox:** When you run `npx ampx sandbox`, the backend reads env from Amplify. Set `STRIPE_SECRET_KEY` in the Amplify Console for the sandbox environment, or use [Amplify sandbox secrets](https://docs.amplify.aws/react/build-a-backend/functions/secrets/) so it is never committed.

## Frontend

Set in your **local `.env`** (and in Amplify Hosting **Environment variables** for the client build):

| Variable                        | Example       | Notes |
|---------------------------------|---------------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY`   | `pk_test_…`   | Publishable key from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys). Required for the Book page payment form. |

Example `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

Do **not** commit real keys. Add `.env` to `.gitignore` (Vite projects usually ignore `.env` by default).

## Using the createPaymentIntent mutation

- **Arguments:** `appointmentId` (string), `amountCents` (optional number).
- **Returns:** `{ clientSecret?: string, paymentIntentId?: string, error?: string }`.

The client uses `clientSecret` with Stripe’s `Elements` and `confirmPayment`; after success you can show “Payment received” and optionally call a webhook or `confirmPrepaid`-style API to mark the appointment as prepaid.

## Test cards (Stripe test mode)

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry and any CVC.

## Troubleshooting

- **"Stripe not configured"** — Backend: ensure `STRIPE_SECRET_KEY` is set and starts with `sk_`.
- **"Invalid API Key"** — Use a fresh secret key from the Stripe Dashboard; check for typos and extra spaces.
