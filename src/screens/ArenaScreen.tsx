import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TournamentCard } from '../components/TournamentCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useArenaData } from '../hooks/useAppData';
import { colors, spacing, radius } from '../theme/designTokens';

interface ArenaScreenProps {
  onBack?: () => void;
}

export const ArenaScreen: React.FC<ArenaScreenProps> = ({ onBack }) => {
  const { tournaments, honorTournament, loading } = useArenaData();
  const awards = honorTournament?.awards_names;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onBack ? (
        <ScreenHeader title="Arena" subtitle="Tournois & tableau d'honneur" onBack={onBack} />
      ) : (
        <Text style={styles.title}>Arena</Text>
      )}

      <Text style={styles.section}>Tournois proches</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : tournaments.length === 0 ? (
        <Text style={styles.hint}>
          Aucun tournoi — lancez{' '}
          Les tournois publiés par les clubs apparaîtront ici.
        </Text>
      ) : (
        tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)
      )}

      <Text style={[styles.section, styles.mt]}>Tableau d&apos;honneur</Text>
      <View style={styles.honor}>
        <HonorSlot label="Meilleur joueur" name={awards?.best_player ?? '—'} />
        <HonorSlot label="Buteur" name={awards?.top_scorer ?? '—'} />
        <HonorSlot label="Gardien" name={awards?.best_goalkeeper ?? '—'} />
      </View>
      {!loading && !honorTournament && (
        <Text style={styles.hintSmall}>Publié après clôture d&apos;un tournoi.</Text>
      )}
    </ScrollView>
  );
};

const HonorSlot: React.FC<{ label: string; name: string }> = ({ label, name }) => (
  <View style={styles.honorItem}>
    <Text style={styles.honorLabel}>{label}</Text>
    <Text style={styles.honorName}>{name}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  section: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  mt: { marginTop: spacing.xl },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  hintCode: { fontFamily: 'monospace', color: colors.brand },
  hintSmall: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
  honor: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  honorItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  honorLabel: { color: colors.textMuted, fontSize: 11 },
  honorName: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
});
