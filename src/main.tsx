import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import ErrorBoundary from './components/ErrorBoundary';
import AuthHeader from './components/AuthHeader';
import AuthFooter from './components/AuthFooter';
import { getLogoUrl } from './lib/logo';
import './index.css';
import './styles/Login.css';
import './styles/Book.css';
import '@aws-amplify/ui-react/styles.css';
import './styles/AuthTheme.css';

function isAuthConfigured(outputs: Record<string, unknown>): boolean {
  const auth = outputs?.auth as { user_pool_id?: string } | undefined;
  const id = auth?.user_pool_id ?? '';
  return typeof id === 'string' && id.length > 0 && !id.includes('PLACEHOLDER');
}

// Load Amplify config (amplify_outputs.json) for Data API. Placeholder in repo; Amplify injects real one at build.
function loadAmplifyConfig(): Promise<Record<string, unknown>> {
  return import('../amplify_outputs.json')
    .then((m) => (m?.default ?? m) as Record<string, unknown>)
    .catch((err) => {
      console.warn('Amplify config not loaded (expected if backend not deployed):', err);
      return {};
    });
}

const BUILD_ID_KEY = 'ff_build_id';

/** If a new deploy is live (build id changed), sign out and reload so user gets fresh code/session. */
async function ensureBuildIdAndLogoutIfNewDeploy(): Promise<void> {
  const current = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : '';
  if (!current) return;
  const { getCurrentUser, signOut } = await import('aws-amplify/auth');
  try {
    await getCurrentUser();
  } catch {
    sessionStorage.setItem(BUILD_ID_KEY, current);
    return;
  }
  const stored = sessionStorage.getItem(BUILD_ID_KEY);
  if (stored !== null && stored !== '' && stored !== current) {
    await signOut();
    sessionStorage.setItem(BUILD_ID_KEY, current);
    window.location.reload();
    return;
  }
  sessionStorage.setItem(BUILD_ID_KEY, current);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Surface uncaught errors so you can see what's causing "something went wrong"
function showGlobalError(label: string, err: unknown) {
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  const banner = document.getElementById('global-error-banner');
  if (banner) {
    banner.textContent = `[FOREVER FADED DEBUG] ${label}\n\n${msg}`;
    banner.style.display = 'block';
  }
  console.error(`[FOREVER FADED DEBUG] ${label}`, err);
}

window.onerror = (message, source, lineno, colno, error) => {
  showGlobalError('Uncaught error', error ?? message);
  return false;
};

window.onunhandledrejection = (event) => {
  showGlobalError('Unhandled promise rejection', event.reason);
};

// Configure Amplify BEFORE importing App/Layout so generateClient() never runs unconfigured.
loadAmplifyConfig().then(async (outputs) => {
  Amplify.configure(outputs as Parameters<typeof Amplify.configure>[0]);

  const authReady = isAuthConfigured(outputs);
  const { default: App } = await import('./App');

  if (!authReady) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <div className="auth-setup-page">
            <div className="auth-setup-card">
              <AuthHeader />
              <h1>Backend not configured</h1>
              <p>Run the Amplify sandbox to create the auth backend.</p>
              <p>In the project folder, run:</p>
              <code>npx ampx sandbox</code>
              <p style={{ marginTop: '1rem' }}>
                Then refresh this page. Use Sign up to create an account, then sign in.
              </p>
            </div>
          </div>
        </ErrorBoundary>
      </React.StrictMode>
    );
    return;
  }

  await ensureBuildIdAndLogoutIfNewDeploy();

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <div className="auth-portal-theme">
          <div className="auth-portal-split">
            <div className="auth-portal-left">
              <img
                src={getLogoUrl()}
                alt="Forever Faded — Est. 2008"
                decoding="async"
              />
              <p className="auth-portal-logo-tagline">ESTD 2008 · For the Culture</p>
            </div>
            <div className="auth-portal-right">
              <Authenticator
                loginMechanisms={['email']}
                signUpAttributes={['preferred_username']}
                hideSignUp={false}
                components={{
                  Header: () => null,
                  Footer: AuthFooter,
                }}
              >
                <App />
              </Authenticator>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </React.StrictMode>
  );
});
