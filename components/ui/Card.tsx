'use client';

import { colors, radius, spacing } from '@/constants/tokens';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  style?: React.CSSProperties;
  padding?: string;
}

export function Card({ children, onPress, elevated = false, style, padding }: CardProps) {
  const baseStyle: React.CSSProperties = {
    backgroundColor: elevated ? colors.bgElevated : colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: padding ?? spacing[4],
    transition: 'background-color 0.15s',
    ...style,
  };

  if (onPress) {
    return (
      <button
        onClick={onPress}
        style={{
          ...baseStyle,
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          textAlign: 'left',
          border: `1px solid ${colors.border}`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            colors.bgElevated;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            elevated ? colors.bgElevated : colors.bgCard;
        }}
      >
        {children}
      </button>
    );
  }

  return <div style={baseStyle}>{children}</div>;
}
