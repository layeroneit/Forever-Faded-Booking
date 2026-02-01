import { useAuth } from 'react-oidc-context';
import AuthHeader from './AuthHeader';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <AuthHeader />
          <p className="page-subtitle">Loading…</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    // Log so you can see the full error in DevTools → Console
    console.error('[FOREVER FADED DEBUG] auth.error:', auth.error);

    // Show full error: OIDC can return Error or object with error_description
    const err = auth.error;
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as Error).message)
        : '';
    const desc =
      typeof err === 'object' && err !== null && 'error_description' in err
        ? String((err as { error_description?: string }).error_description)
        : '';
    const code =
      typeof err === 'object' && err !== null && 'error' in err
        ? String((err as { error?: string }).error)
        : '';
    const display = [message, desc, code].filter(Boolean).join(' — ') || JSON.stringify(err);

    return (
      <div className="login-page">
        <div className="login-card">
          <AuthHeader />
          <div className="login-error" role="alert">
            <strong>Sign-in error</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{display}</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => auth.signinRedirect()}
          >
            Try again — Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <AuthHeader />
          <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
            Sign in with your account.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => auth.signinRedirect()}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
