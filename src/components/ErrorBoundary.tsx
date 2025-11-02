import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode; // optional custom fallback
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-fallback"
          role="alert"
          style={{
            color: 'red',
            padding: '1rem',
            border: '1px solid red',
            borderRadius: '4px',
            background: '#ffe6e6',
          }}
        >
          {this.props.fallback ?? '⚠️ This module failed to load.'}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
