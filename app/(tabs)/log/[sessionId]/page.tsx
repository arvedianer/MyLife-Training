'use client';

import { useRouter } from 'next/navigation';
import { Clock, Dumbbell, TrendingUp, Trash2, Star, Edit2, Save, X, Share2, RefreshCw } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useHistoryStore } from '@/store/historyStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { formatWorkoutDate, formatDuration, formatVolume } from '@/utils/dates';
import { exercises } from '@/constants/exercises';
import { useState } from 'react';
import type { WorkoutSession } from '@/types/workout';

export default function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const router = useRouter();
  const { getSessionById, deleteSession, updateSession } = useHistoryStore();
  const { startWorkout, addExercise } = useWorkoutStore();
  const session = getSessionById(sessionId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState<WorkoutSession | null>(null);

  if (!session) {
    return (
      <div style={{ padding: spacing[6], textAlign: 'center' }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Session nicht gefunden.
        </p>
      </div>
    );
  }

  const handleShare = async () => {
    if (!session) return;

    let text = `🔥 Workout Rückblick: ${session.splitName || 'Freies Training'} 🔥\n\n`;
    text += `📅 Datum: ${formatWorkoutDate(session.date)}\n`;
    text += `⏱️ Dauer: ${formatDuration(session.durationSeconds)}\n`;
    text += `💪 Volumen: ${formatVolume(session.totalVolume)} kg\n`;
    text += `📊 Sätze: ${session.totalSets}\n\n`;

    if (session.newPRs.length > 0) {
      text += `🌟 ${session.newPRs.length} Neue Rekorde:\n`;
      session.newPRs.forEach(exId => {
        const ex = exercises.find(e => e.id === exId);
        if (ex) text += `- ${ex.nameDE}\n`;
      });
      text += '\n';
    }

    text += `Trainiert mit MY LIFE Training.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mein Workout',
          text: text,
        });
      } catch (error) {
        console.log('Teilen abgebrochen oder fehlgeschlagen:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Workout-Zusammenfassung kopiert!');
      } catch (err) {
        console.error('Fehler beim Kopieren', err);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Diese Einheit wirklich löschen?')) {
      deleteSession(sessionId);
      router.back();
    }
  };

  const handleRestartWorkout = () => {
    if (!session.exercises || session.exercises.length === 0) return;
    startWorkout(session.splitName ?? undefined);
    for (const ex of session.exercises) {
      addExercise(ex.exercise);
    }
    router.push('/workout/active');
  };

  const startEditing = () => {
    if (!session) return;
    setEditedSession(JSON.parse(JSON.stringify(session)));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedSession(null);
  };

  const saveEditing = async () => {
    if (!editedSession) return;

    // Recalculate volume if logic changed
    let newVolume = 0;
    editedSession.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.isCompleted) {
          newVolume += s.weight * s.reps;
        }
      });
    });
    editedSession.totalVolume = newVolume;

    await updateSession(sessionId, editedSession);
    setIsEditing(false);
  };

  const handleSetChange = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    if (!editedSession) return;
    const numValue = value === '' ? 0 : Number(value);

    setEditedSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id !== setId) return s;
              return { ...s, [field]: numValue };
            })
          };
        })
      };
    });
  };

  const displaySession = isEditing && editedSession ? editedSession : session;

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader
        title={displaySession.splitName ?? 'Freies Training'}
        subtitle={formatWorkoutDate(displaySession.date)}
        rightElement={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {isEditing ? (
              <>
                <button
                  onClick={cancelEditing}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <X size={16} color={colors.textMuted} />
                </button>
                <button
                  onClick={saveEditing}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: `${colors.accent}20`, border: `1px solid ${colors.accent}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Save size={16} color={colors.accent} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleShare}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Share2 size={16} color={colors.textMuted} />
                </button>
                <button
                  onClick={startEditing}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Edit2 size={16} color={colors.textMuted} />
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: colors.dangerBg, border: `1px solid ${colors.danger}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} color={colors.danger} />
                </button>
              </>
            )}
          </div>
        }
      />

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
          <StatItem
            icon={<Clock size={16} color={colors.accent} />}
            value={formatDuration(displaySession.durationSeconds)}
            label="Dauer"
          />
          <StatItem
            icon={<Dumbbell size={16} color={colors.accent} />}
            value={String(displaySession.totalSets)}
            label="Sätze"
          />
          <StatItem
            icon={<TrendingUp size={16} color={colors.accent} />}
            value={formatVolume(displaySession.totalVolume)}
            label="Volumen"
          />
        </div>

        {/* Nochmal trainieren */}
        {!isEditing && (
          <Button
            onClick={handleRestartWorkout}
            variant="secondary"
            disabled={!session.exercises || session.exercises.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}
          >
            <RefreshCw size={16} /> Nochmal trainieren
          </Button>
        )}

        {/* PRs */}
        {!isEditing && displaySession.newPRs.length > 0 && (
          <div>
            <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
              Personal Records
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {displaySession.newPRs.map((exId) => {
                const ex = exercises.find((e) => e.id === exId);
                return (
                  <div
                    key={exId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: colors.accentBg,
                      border: `1px solid ${colors.accent}30`,
                      borderRadius: radius.full,
                    }}
                  >
                    <Star size={12} color={colors.accent} fill={colors.accent} />
                    <span style={{ ...typography.label, color: colors.accent }}>
                      {ex?.nameDE ?? exId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Übungen
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {displaySession.exercises.map((workoutExercise) => {
              const completedSets = isEditing ? workoutExercise.sets : workoutExercise.sets.filter((s) => s.isCompleted);
              if (completedSets.length === 0) return null;

              return (
                <div
                  key={workoutExercise.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                  }}
                >
                  {/* Exercise Header */}
                  <div
                    style={{
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderBottom: `1px solid ${colors.borderLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {workoutExercise.exercise.nameDE}
                    </span>
                    <div style={{ display: 'flex', gap: spacing[2] }}>
                      {!isEditing && displaySession.newPRs.includes(workoutExercise.exercise.id) && (
                        <Badge variant="accent">PR</Badge>
                      )}
                      <Badge variant="muted">{completedSets.length} Sätze</Badge>
                    </div>
                  </div>

                  {/* Sets */}
                  <div style={{ padding: `${spacing[2]} ${spacing[4]}` }}>
                    {completedSets.map((set, idx) => (
                      <div
                        key={set.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[4],
                          padding: `${spacing[2]} 0`,
                          borderBottom: idx < completedSets.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                          opacity: set.isCompleted ? 1 : 0.5,
                        }}
                      >
                        <span style={{ ...typography.monoSm, color: colors.textDisabled, width: '20px' }}>
                          {idx + 1}
                        </span>

                        {isEditing ? (
                          <div style={{ display: 'flex', gap: spacing[2], flex: 1 }}>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => handleSetChange(workoutExercise.id, set.id, 'weight', e.target.value)}
                              style={{
                                width: '60px',
                                backgroundColor: colors.bgHighest,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.sm,
                                padding: spacing[1],
                                color: colors.textPrimary,
                                textAlign: 'center',
                                ...typography.mono
                              }}
                            />
                            <span style={{ color: colors.textMuted, alignSelf: 'center' }}>kg</span>
                            <span style={{ color: colors.textDisabled, alignSelf: 'center' }}>×</span>
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => handleSetChange(workoutExercise.id, set.id, 'reps', e.target.value)}
                              style={{
                                width: '60px',
                                backgroundColor: colors.bgHighest,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.sm,
                                padding: spacing[1],
                                color: colors.textPrimary,
                                textAlign: 'center',
                                ...typography.mono
                              }}
                            />
                            <span style={{ color: colors.textMuted, alignSelf: 'center' }}>Wdh.</span>
                          </div>
                        ) : (
                          <>
                            <span style={{ ...typography.mono, color: colors.textPrimary }}>
                              {set.weight} kg
                            </span>
                            <span style={{ ...typography.mono, color: colors.textMuted }}>
                              × {set.reps} Wdh.
                            </span>
                          </>
                        )}

                        {!isEditing && (
                          <span style={{ ...typography.monoSm, color: colors.textDisabled, marginLeft: 'auto' }}>
                            {set.weight * set.reps} Vol.
                          </span>
                        )}

                        {!isEditing && set.isPR && (
                          <Star size={12} color={colors.accent} fill={colors.accent} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: spacing[3],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {icon}
      <div style={{ ...typography.mono, color: colors.textPrimary }}>{value}</div>
      <div style={{ ...typography.label, color: colors.textMuted }}>{label}</div>
    </div>
  );
}
