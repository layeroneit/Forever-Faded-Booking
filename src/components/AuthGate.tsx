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
    return (
      <div className="login-page">
        <div className="login-card">
          <AuthHeader />
          <div className="login-error">
            Error: {auth.error.message}
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
