import { colors, typography, radius, spacing } from '@/constants/tokens';

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: colors.bgHighest,
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
  },
  accent: {
    backgroundColor: colors.accentBg,
    color: colors.accent,
    border: `1px solid ${colors.accent}20`,
  },
  success: {
    backgroundColor: colors.successBg,
    color: colors.success,
    border: `1px solid ${colors.success}20`,
  },
  danger: {
    backgroundColor: colors.dangerBg,
    color: colors.danger,
    border: `1px solid ${colors.danger}20`,
  },
  muted: {
    backgroundColor: 'transparent',
    color: colors.textMuted,
    border: `1px solid ${colors.borderLight}`,
  },
};

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing[1]} ${spacing[2]}`,
        borderRadius: radius.full,
        ...typography.label,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
