import { colors, radius } from '@/constants/tokens';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: string;
  color?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export function ProgressBar({
  progress,
  height = '4px',
  color = colors.accent,
  backgroundColor = colors.bgHighest,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <div
      style={{
        width: '100%',
        height,
        backgroundColor,
        borderRadius: radius.full,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${clampedProgress * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius.full,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
