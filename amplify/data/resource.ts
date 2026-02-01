import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
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
