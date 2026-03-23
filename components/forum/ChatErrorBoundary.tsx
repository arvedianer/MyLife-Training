'use client';
import React from 'react';
import { colors, typography, spacing } from '@/constants/tokens';

interface State { hasError: boolean; error?: Error }

export class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgPrimary,
          padding: spacing[6],
          gap: spacing[4],
        }}>
          <p style={{ ...typography.h3, color: colors.textPrimary, textAlign: 'center' }}>
            Chat konnte nicht geladen werden.
          </p>
          <p style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
            Seite neu laden oder später nochmal versuchen.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: colors.accent,
              color: colors.bgPrimary,
              border: 'none',
              borderRadius: 8,
              padding: `${spacing[3]}px ${spacing[5]}px`,
              cursor: 'pointer',
              ...typography.label,
            }}
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
