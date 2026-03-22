// app/(tabs)/forum/_components/CommunityTab.tsx
'use client';

import { colors, spacing } from '@/constants/tokens';

interface Props {
  userId: string | null;
}

// Full implementation in Task 8
export function CommunityTab({ userId: _userId }: Props) {
  return (
    <div style={{ padding: spacing[4], textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>
      Community lädt...
    </div>
  );
}
