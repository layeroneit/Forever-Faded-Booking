import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { AuthProvider } from 'react-oidc-context';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGate from './components/AuthGate';
import { cognitoAuthConfig } from './config/cognito';
import './index.css';
import './styles/Login.css';
import './styles/Book.css';
import '@aws-amplify/ui-react/styles.css';

// Load Amplify config (amplify_outputs.json) for Data API. Placeholder in repo; Amplify injects real one at build.
function loadAmplifyConfig(): Promise<Record<string, unknown>> {
  return import('../amplify_outputs.json')
    .then((m) => (m?.default ?? m) as Record<string, unknown>)
    .catch((err) => {
      console.warn('Amplify config not loaded (expected if backend not deployed):', err);
      return {};
    });
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

  const { default: App } = await import('./App');
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider {...cognitoAuthConfig}>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
});
