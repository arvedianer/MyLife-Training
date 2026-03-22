'use client';

import { motion } from 'framer-motion';
import { colors, typography } from '@/constants/tokens';

interface TypingIndicatorProps {
  name: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: colors.textMuted,
            }}
          />
        ))}
      </div>
      <span
        style={{
          ...typography.label,
          color: colors.textMuted,
          fontSize: '11px',
        }}
      >
        {name} tippt...
      </span>
    </div>
  );
}
