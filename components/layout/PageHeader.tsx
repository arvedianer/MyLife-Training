'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backHref,
  onBack,
  rightElement,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: `${spacing[4]} ${spacing[4]}`,
        paddingTop: `calc(${spacing[4]} + env(safe-area-inset-top))`,
        borderBottom: `1px solid ${colors.borderLight}`,
        minHeight: 56,
      }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              colors.bgElevated;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              colors.bgCard;
          }}
        >
          <ChevronLeft size={20} color={colors.textSecondary} />
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            ...typography.h3,
            color: colors.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              ...typography.bodySm,
              color: colors.textMuted,
              marginTop: '2px',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {rightElement && (
        <div style={{ flexShrink: 0 }}>{rightElement}</div>
      )}
    </div>
  );
}
