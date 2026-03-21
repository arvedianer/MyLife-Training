import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore } from '@/types/score';
import { colors } from '@/constants/tokens';

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bgPrimary, padding: 30, color: colors.textPrimary, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: colors.border, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.accent },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  scoreContainer: { alignItems: 'center', marginVertical: 20 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: colors.accent },
  scoreLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  exerciseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottom: 1, borderBottomColor: colors.borderLight,
  },
  exerciseName: { fontSize: 12, color: colors.textPrimary },
  exerciseStats: { fontSize: 11, color: colors.textMuted },
  tip: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  footer: {
    position: 'absolute', bottom: 20, left: 30, right: 30,
    textAlign: 'center', fontSize: 9, color: colors.textFaint,
  },
});

interface Props {
  session: WorkoutSession;
  score?: WorkoutScore | null;
  userName?: string;
}

export function WorkoutSummaryPDF({ session, score, userName }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{session.splitName ?? 'Freies Training'}</Text>
          <Text style={styles.subtitle}>
            {userName ? `Training von ${userName} · ` : ''}
            {new Date(session.date).toLocaleDateString('de-DE', { dateStyle: 'full' })}
          </Text>
        </View>

        {score && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreNumber}>{score.total} / 100</Text>
            <Text style={styles.scoreLabel}>Workout Score</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>ÜBUNGEN</Text>
        {session.exercises.map((ex, i) => {
          const done = ex.sets.filter((s) => s.isCompleted);
          const maxW = done.length > 0 ? Math.max(...done.map((s) => s.weight)) : 0;
          return (
            <View key={String(i)} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.exercise.nameDE}</Text>
              <Text style={styles.exerciseStats}>{done.length} Sätze · {maxW > 0 ? `${maxW}kg` : 'EG'} max</Text>
            </View>
          );
        })}

        {score?.tips && score.tips.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>TIPPS FÜR NÄCHSTES MAL</Text>
            {score.tips.map((tip, i) => (
              <Text key={String(i)} style={styles.tip}>› {tip}</Text>
            ))}
          </View>
        )}

        <Text style={styles.footer}>MY LIFE Training App</Text>
      </Page>
    </Document>
  );
}
