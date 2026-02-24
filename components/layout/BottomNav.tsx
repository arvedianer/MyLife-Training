'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Plus, BarChart2, Layers } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';

const tabs = [
  { href: '/dashboard', icon: Home,     label: 'Home'    },
  { href: '/splits',    icon: Layers,   label: 'Splits'  },
  // Mitte: Start-Button (separat gerendert)
  { href: '/exercises', icon: Dumbbell, label: 'Übungen' },
  { href: '/stats',     icon: BarChart2, label: 'Stats'  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname.startsWith(href);
  }

  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: colors.bgSecondary,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}
    >
      {/* Home + Log */}
      {tabs.slice(0, 2).map((tab) => (
        <NavTab
          key={tab.href}
          href={tab.href}
          icon={<tab.icon size={22} color={isActive(tab.href) ? colors.accent : colors.textDisabled} />}
          label={tab.label}
          active={isActive(tab.href)}
        />
      ))}

      {/* Center FAB — Start */}
      <Link
        href="/start"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: isActive('/start') ? colors.accentDark : colors.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-20px',
          boxShadow: `0 0 24px ${colors.accent}50`,
          transition: 'background-color 0.2s, transform 0.1s, box-shadow 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        }}
      >
        <Plus size={26} color={colors.bgPrimary} strokeWidth={2.5} />
      </Link>

      {/* Stats + Splits */}
      {tabs.slice(2).map((tab) => (
        <NavTab
          key={tab.href}
          href={tab.href}
          icon={<tab.icon size={22} color={isActive(tab.href) ? colors.accent : colors.textDisabled} />}
          label={tab.label}
          active={isActive(tab.href)}
        />
      ))}
    </nav>
  );
}

interface NavTabProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavTab({ href, icon, label, active }: NavTabProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: `${spacing[1]} ${spacing[3]}`,
        minWidth: '60px',
        transition: 'opacity 0.15s',
      }}
    >
      {icon}
      <span
        style={{
          ...typography.label,
          fontSize: '10px',
          color: active ? colors.accent : colors.textDisabled,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </span>
    </Link>
  );
}
