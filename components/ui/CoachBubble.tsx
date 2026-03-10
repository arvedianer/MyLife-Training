'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { colors, radius } from '@/constants/tokens';
import { CoachSheet } from './CoachSheet';

export function CoachBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Coach Arved öffnen"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: radius.full,
          background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 40,
          boxShadow: `0 0 0 3px ${colors.bgPrimary}, 0 4px 20px ${colors.accent}50`,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <Bot size={24} color={colors.bgPrimary} />
      </button>

      {/* Coach Sheet */}
      <CoachSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
