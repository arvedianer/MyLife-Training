'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
      {label && (
        <label
          style={{
            ...typography.label,
            color: colors.textMuted,
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: `${spacing[3]} ${spacing[4]}`,
          backgroundColor: colors.bgHighest,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          borderRadius: radius.md,
          ...typography.body,
          color: colors.textPrimary,
          outline: 'none',
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? colors.danger : colors.accent;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? colors.danger : colors.border;
          props.onBlur?.(e);
        }}
        {...props}
      />
      {(error || hint) && (
        <span
          style={{
            ...typography.bodySm,
            color: error ? colors.danger : colors.textMuted,
          }}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
}

// Numerisches Input speziell für Sets (Gewicht, Reps)
interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function NumericInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  placeholder = '0',
  style,
}: NumericInputProps) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value || ''}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
        else if (e.target.value === '') onChange(0);
      }}
      style={{
        width: '100%',
        padding: `${spacing[2]} ${spacing[3]}`,
        backgroundColor: colors.bgHighest,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        ...typography.mono,
        color: colors.textPrimary,
        outline: 'none',
        textAlign: 'center',
        transition: 'border-color 0.15s',
        MozAppearance: 'textfield',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = colors.accent;
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = colors.border;
      }}
    />
  );
}
