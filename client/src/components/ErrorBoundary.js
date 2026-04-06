/**
 * components/ErrorBoundary.jsx
 * ─────────────────────────────
 * Class component — the only way to catch render-time JS errors in React.
 * Wrap your entire app (or individual page sections) with this.
 *
 * Usage:
 *   // Global (in main.jsx)
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 *   // Per-section with custom fallback
 *   <ErrorBoundary fallback={<p>Widget failed to load.</p>}>
 *     <HeavyWidget />
 *   </ErrorBoundary>
 */

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // ── Send to error tracking service ─────────────────────────────────
    // Replace this with Sentry, Datadog, LogRocket, etc.
    if (import.meta.env.PROD) {
      console.error("[ErrorBoundary]", error, errorInfo);
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Custom fallback prop
    if (this.props.fallback) return this.props.fallback;

    // Default full-page error UI
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          {/* Error icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 mt-2">
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>

          {/* Show error details in development only */}
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-200">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error details (dev only)
              </summary>
              <pre className="whitespace-pre-wrap overflow-auto max-h-48">
                {this.state.error.toString()}
                {"\n\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;