import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Catches React render errors and displays the actual error message and stack
 * so "Something went wrong" is replaced with the real cause.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState((s) => ({ ...s, errorInfo }));
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (error) {
      const message = error.message || String(error);
      const stack = error.stack ?? errorInfo?.componentStack ?? '';

      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-subtitle">Here’s what happened:</p>
            <div className="error-boundary-message" role="alert">
              {message}
            </div>
            {stack && (
              <details className="error-boundary-details">
                <summary>Technical details</summary>
                <pre className="error-boundary-stack">{stack}</pre>
              </details>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
