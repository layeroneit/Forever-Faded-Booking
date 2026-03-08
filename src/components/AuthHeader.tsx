/**
 * Platform-matching auth header: Forever Faded logo + heading + tagline.
 * Used on sign-in/sign-up (Amplify Authenticator).
 */
const logoUrl = `${import.meta.env.BASE_URL || '/'}logo.png`.replace(/\/+/g, '/');

export default function AuthHeader() {
  return (
    <div className="login-logo">
      <img
        src={logoUrl}
        alt="Forever Faded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <h1 className="login-title">FOREVER FADED</h1>
      <p className="login-tagline">ESTD 2008 · For The Culture</p>
    </div>
  );
}
