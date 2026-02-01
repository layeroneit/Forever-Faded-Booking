import { defineAuth } from '@aws-amplify/backend';

/**
 * Cognito auth — email/password. Use UserProfile (Data) for role (client, barber, owner).
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    password: true,
  },
  userAttributes: {
    preferredUsername: { mutable: true },
    profilePicture: { mutable: true },
  },
});
