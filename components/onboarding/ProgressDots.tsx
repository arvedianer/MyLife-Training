import { colors, spacing } from '@/constants/tokens';

interface ProgressDotsProps {
  total: number;   // always 6 for onboarding screens 2-7
  current: number; // 1-based (1=screen2, 2=screen3, ..., 6=screen7)
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: spacing[2],
      justifyContent: 'center',
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i + 1 === current ? colors.accent : colors.border,
            transition: 'width 0.2s ease, background-color 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}
