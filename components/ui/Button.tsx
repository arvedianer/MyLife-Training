'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.accent,
    color: colors.bgPrimary,
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: 'none',
  },
  danger: {
    backgroundColor: colors.dangerBg,
    color: colors.danger,
    border: `1px solid ${colors.danger}`,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: `${spacing[2]} ${spacing[3]}`,
    ...typography.bodySm,
    fontWeight: '600',
    borderRadius: radius.md,
    minHeight: '32px',
  },
  md: {
    padding: `${spacing[3]} ${spacing[5]}`,
    ...typography.body,
    fontWeight: '600',
    borderRadius: radius.lg,
    minHeight: '44px',
  },
  lg: {
    padding: `${spacing[4]} ${spacing[6]}`,
    ...typography.bodyLg,
    fontWeight: '700',
    borderRadius: radius.lg,
    minHeight: '52px',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s, background-color 0.15s',
        width: fullWidth ? '100%' : 'auto',
        userSelect: 'none',
        letterSpacing: '0.01em',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
        }
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        props.onMouseLeave?.(e);
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid currentColor`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        children
      )}
    </button>
  );
}
