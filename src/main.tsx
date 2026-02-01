import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { AuthProvider } from 'react-oidc-context';
import App from './App';
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
    .catch(() => ({}));
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

loadAmplifyConfig().then((outputs) => {
  Amplify.configure(outputs as Parameters<typeof Amplify.configure>[0]);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AuthProvider {...cognitoAuthConfig}>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    </React.StrictMode>
  );
});
