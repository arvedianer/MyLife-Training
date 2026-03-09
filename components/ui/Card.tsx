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
    borderRadius: radius.xl,
    padding: padding ?? spacing[4],
    boxShadow: colors.shadowCard,
    transition: 'background-color 0.15s, box-shadow 0.15s',
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
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.backgroundColor = colors.bgElevated;
          el.style.boxShadow = colors.shadowCardHover;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.backgroundColor = elevated ? colors.bgElevated : colors.bgCard;
          el.style.boxShadow = colors.shadowCard;
        }}
      >
        {children}
      </button>
    );
  }

  return <div style={baseStyle}>{children}</div>;
}
