'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Download } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { downloadMigrationExport } from '@/utils/dataExport';

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

  const handleSettingsExport = () => {
    try {
      const migrationExport = downloadMigrationExport();
      window.alert(
        `Export erfolgreich: ${migrationExport.summary.sessionCount} Trainingseinheiten wurden gesichert.`,
      );
    } catch (error) {
      console.error('Failed to export MyLife data:', error);
      window.alert('Export fehlgeschlagen. Bitte versuche es erneut.');
    }
  };

  const settingsExportButton = title === 'Einstellungen' ? (
    <button
      onClick={handleSettingsExport}
      aria-label="Daten als JSON exportieren"
      title="Daten als JSON exportieren"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[2],
        minHeight: '36px',
        padding: `0 ${spacing[3]}`,
        borderRadius: '999px',
        backgroundColor: colors.accentBg,
        border: `1px solid ${colors.accent}50`,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <Download size={17} color={colors.accent} />
      <span style={{ ...typography.label, color: colors.accent }}>Export</span>
    </button>
  ) : null;

  const resolvedRightElement = rightElement ?? settingsExportButton;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: `${spacing[4]} ${spacing[4]}`,
        paddingTop: `calc(${spacing[4]} + env(safe-area-inset-top))`,
        borderBottom: `1px solid ${colors.borderLight}`,
        minHeight: 56,
        backgroundColor: 'rgba(8, 8, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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

      {resolvedRightElement && (
        <div style={{ flexShrink: 0 }}>{resolvedRightElement}</div>
      )}
    </div>
  );
}
