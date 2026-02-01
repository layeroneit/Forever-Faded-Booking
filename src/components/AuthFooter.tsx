/**
 * Test accounts for Forever Faded Booking (same 4 users as platform).
 * Shown on sign-in/sign-up screen so users can create or use these accounts.
 */
export default function AuthFooter() {
  return (
    <div className="auth-footer">
      <p className="auth-footer-title">Preconfigured test accounts (4 users)</p>
      <p className="auth-footer-accounts">
        <code>owner@foreverfaded.com</code>, <code>mike@foreverfaded.com</code>,{' '}
        <code>chris@foreverfaded.com</code>, <code>john@example.com</code>
      </p>
      <p className="auth-footer-password">Password: <code>password123</code></p>
      <p className="auth-footer-hint">Create account first if you haven’t. Then sign in with the same email and password.</p>
    </div>
  );
}
