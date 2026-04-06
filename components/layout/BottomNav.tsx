'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Layers, MessageCircle, Plus } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useForumStore } from '@/store/forumStore';

export function BottomNav() {
  const pathname = usePathname();
  const totalUnread = useForumStore((s) => s.totalUnread);

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
        backgroundColor: 'rgba(14, 14, 14, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}
    >
      {/* Left tabs */}
      <NavTab href="/dashboard" icon={<Home size={22} color={isActive('/dashboard') ? colors.accent : colors.textDisabled} />} label="Home" active={isActive('/dashboard')} />
      <NavTab href="/splits" dataTour="nav-splits" icon={<Layers size={22} color={isActive('/splits') ? colors.accent : colors.textDisabled} />} label="Splits" active={isActive('/splits')} />

      {/* Center FAB */}
      <Link
        href="/start"
        data-tour="nav-start"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: radius.full,
          backgroundColor: colors.accent,
          boxShadow: `0 0 0 4px ${colors.bgPrimary}, 0 4px 16px rgba(0,0,0,0.4)`,
          flexShrink: 0,
          marginBottom: '10px',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        }}
      >
        <Plus size={26} color={colors.bgPrimary} strokeWidth={2.5} />
      </Link>

      {/* Right tabs */}
      <NavTab
        href="/forum"
        dataTour="nav-forum"
        icon={
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <MessageCircle size={22} color={isActive('/forum') ? colors.accent : colors.textDisabled} />
            {totalUnread > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -6,
                backgroundColor: colors.danger,
                borderRadius: '10px',
                minWidth: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              </div>
            )}
          </div>
        }
        label="Forum"
        active={isActive('/forum')}
      />
      <NavTab href="/stats" dataTour="nav-stats" icon={<BarChart2 size={22} color={isActive('/stats') ? colors.accent : colors.textDisabled} />} label="Stats" active={isActive('/stats')} />
    </nav>
  );
}

interface NavTabProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  dataTour?: string;
}

function NavTab({ href, icon, label, active, dataTour }: NavTabProps) {
  return (
    <Link
      href={href}
      {...(dataTour ? { 'data-tour': dataTour } : {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        flex: 1,
        padding: `${spacing[1]} ${spacing[2]}`,
        transition: 'opacity 0.15s',
        position: 'relative',
      }}
    >
      {/* Active indicator line at top */}
      {active && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '2px',
          borderRadius: radius.full,
          backgroundColor: colors.accent,
        }} />
      )}
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
