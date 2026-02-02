import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';

const sendEmailFn = defineFunction({
  name: 'send-email',
  entry: '../functions/send-email/handler.ts',
  timeoutSeconds: 15,
  environment: {
    MAIL_FROM: process.env.MAIL_FROM ?? 'noreply@foreverfaded.com',
  },
});

const createPaymentIntentFn = defineFunction({
  name: 'create-payment-intent',
  entry: '../functions/create-payment-intent/handler.ts',
  timeoutSeconds: 30,
  environment: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  },
});

const schema = a.schema({
  SendEmailResponse: a.customType({
    sent: a.boolean(),
    error: a.string(),
  }),
  CreatePaymentIntentResponse: a.customType({
    clientSecret: a.string(),
    paymentIntentId: a.string(),
    error: a.string(),
  }),

  sendEmail: a
    .mutation()
    .arguments({ to: a.string().required(), subject: a.string().required(), text: a.string().required() })
    .returns(a.ref('SendEmailResponse'))
    .handler(a.handler.function(sendEmailFn))
    .authorization((allow) => [allow.authenticated()]),

  createPaymentIntent: a
    .mutation()
    .arguments({ appointmentId: a.string().required(), amountCents: a.integer() })
    .returns(a.ref('CreatePaymentIntentResponse'))
    .handler(a.handler.function(createPaymentIntentFn))
    .authorization((allow) => [allow.authenticated()]),

  /** Pending barber: owner adds barber (name, email, phone, location); when they sign up, profile is created from this. */
  PendingBarber: a
    .model({
      email: a.string().required(),
      name: a.string().required(),
      phone: a.string(),
      locationId: a.string(),
      status: a.string().default('pending'),
    })
    .authorization((allow) => [allow.authenticated()]),

  /** User profile: links Cognito sub to role and location (client | barber | manager | owner | admin). */
  UserProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      name: a.string().required(),
      phone: a.string(),
      role: a.string().required(),
      locationId: a.string(),
      preferredBarberId: a.string(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  Location: a
    .model({
      name: a.string().required(),
      address: a.string().required(),
      city: a.string().required(),
      state: a.string(),
      zip: a.string(),
      phone: a.string(),
      timezone: a.string().default('America/New_York'),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [allow.authenticated()]),

  Service: a
    .model({
      locationId: a.string(),
      name: a.string().required(),
      category: a.string(),
      description: a.string(),
      durationMinutes: a.integer().required(),
      priceCents: a.integer().required(),
      isSpecial: a.boolean().default(false),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [allow.authenticated()]),

  Appointment: a
    .model({
      locationId: a.string().required(),
      clientId: a.string().required(),
      barberId: a.string().required(),
      serviceId: a.string().required(),
      startAt: a.datetime().required(),
      endAt: a.datetime().required(),
      status: a.string().default('pending'),
      paymentStatus: a.string().default('unpaid'),
      totalCents: a.integer().required(),
      discountCents: a.integer().default(0),
      refundCents: a.integer().default(0),
      stripePaymentIntentId: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
