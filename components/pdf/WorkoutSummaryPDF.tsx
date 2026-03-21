import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore } from '@/types/score';

// Note: @react-pdf/renderer uses its own style system, not CSS Modules or design tokens.
// Colors are hardcoded here intentionally — this is a static PDF document, not a React component.
const styles = StyleSheet.create({
  page: { backgroundColor: '#080808', padding: 30, color: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#262626', paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4DFFED' },
  subtitle: { fontSize: 12, color: '#888888', marginTop: 4 },
  scoreContainer: { alignItems: 'center', marginVertical: 20 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: '#4DFFED' },
  scoreLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, marginTop: 16 },
  exerciseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottom: 1, borderBottomColor: '#1E1E1E',
  },
  exerciseName: { fontSize: 12, color: '#FFFFFF' },
  exerciseStats: { fontSize: 11, color: '#888888' },
  tip: { fontSize: 11, color: '#F5F5F5', marginBottom: 4 },
  footer: {
    position: 'absolute', bottom: 20, left: 30, right: 30,
    textAlign: 'center', fontSize: 9, color: '#555555',
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
