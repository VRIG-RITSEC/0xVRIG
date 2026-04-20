'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          padding: '1rem',
          background: 'var(--bg-error, #2a0a0a)',
          border: '1px solid var(--border-error, #ff4444)',
          borderRadius: '4px',
          color: 'var(--text-error, #ff6666)',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}>
          <strong>Panel crashed</strong>
          <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.75rem',
              background: 'var(--bg-secondary, #333)',
              color: 'inherit',
              border: '1px solid currentColor',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
