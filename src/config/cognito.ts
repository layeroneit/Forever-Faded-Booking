/**
 * AWS Cognito OIDC configuration for react-oidc-context.
 * Override via env: VITE_OIDC_AUTHORITY, VITE_OIDC_CLIENT_ID, VITE_OIDC_REDIRECT_URI.
 * Logout redirect: set VITE_COGNITO_DOMAIN (e.g. https://your-domain.auth.us-east-1.amazoncognito.com) and VITE_COGNITO_LOGOUT_URI.
 */

const authority =
  import.meta.env.VITE_OIDC_AUTHORITY ??
  'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_3dMOmdo13';

const clientId =
  import.meta.env.VITE_OIDC_CLIENT_ID ?? '6rucf71eg2i7eabiddingffrui';

const redirectUri =
  import.meta.env.VITE_OIDC_REDIRECT_URI ??
  (typeof window !== 'undefined' ? window.location.origin : 'https://d84l1y8p4kdic.cloudfront.net');

export const cognitoAuthConfig = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code' as const,
  scope: 'phone openid email',
  automaticSilentRenew: true,
};

export const cognitoLogoutConfig = {
  clientId,
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI ?? redirectUri,
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN ?? '',
};
