// app/(tabs)/forum/_components/FreundeTab.tsx
'use client';

import { colors, spacing } from '@/constants/tokens';

interface Props {
  userId: string | null;
}

// Full implementation in Task 5
export function FreundeTab({ userId: _userId }: Props) {
  return (
    <div style={{ padding: spacing[4], textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>
      Freunde laden...
    </div>
  );
}
