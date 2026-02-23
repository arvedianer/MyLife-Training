import { colors, spacing } from '@/constants/tokens';

interface DividerProps {
  style?: React.CSSProperties;
  marginY?: string;
}

export function Divider({ style, marginY = spacing[4] }: DividerProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '1px',
        backgroundColor: colors.border,
        marginTop: marginY,
        marginBottom: marginY,
        ...style,
      }}
    />
  );
}
