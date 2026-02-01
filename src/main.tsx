import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import App from './App';
import AuthHeader from './components/AuthHeader';
import './index.css';
import './styles/Login.css';
import './styles/Book.css';
import '@aws-amplify/ui-react/styles.css';

// Load Amplify config (amplify_outputs.json). Placeholder in repo; Amplify injects real one at build.
function loadAmplifyConfig(): Promise<Record<string, unknown>> {
  return import('../amplify_outputs.json')
    .then((m) => (m?.default ?? m) as Record<string, unknown>)
    .catch(() => ({}));
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Platform-matching auth screen: logo + FOREVER FADED + For The Culture above sign-in/sign-up
const authComponents = {
  SignIn: { Header: AuthHeader },
  SignUp: { Header: AuthHeader },
};

loadAmplifyConfig().then((outputs) => {
  Amplify.configure(outputs as Parameters<typeof Amplify.configure>[0]);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Authenticator components={authComponents}>
        <App />
      </Authenticator>
    </React.StrictMode>
  );
});
