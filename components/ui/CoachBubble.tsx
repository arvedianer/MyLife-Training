'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { colors, radius } from '@/constants/tokens';

export function CoachBubble() {
  const pathname = usePathname();

  // Don't show the bubble when already on the chat page
  if (pathname === '/chat') return null;

  return (
    <Link
      href="/chat"
      aria-label="Coach Arved öffnen"
      style={{
        position: 'fixed',
        bottom: '84px',
        right: '16px',
        width: '52px',
        height: '52px',
        borderRadius: radius.full,
        background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.prColor} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        boxShadow: `0 0 0 3px ${colors.bgPrimary}, 0 4px 20px ${colors.accent}50`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
      }}
    >
      <Bot size={24} color={colors.bgPrimary} />
    </Link>
  );
}
