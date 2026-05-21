import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

/**
 * Matchs amicaux — maquette : proposer / rechercher, liste à venir
 */
export const MatchsScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Matchs amicaux</Text>
    <Text style={styles.subtitle}>Jouez. Progressez. Créez du lien.</Text>

    <View style={styles.quickRow}>
      <TouchableOpacity style={[styles.quickCard, shadows.card]}>
        <Text style={styles.quickTitle}>Proposer un match</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.quickCard, shadows.card]}>
        <Text style={styles.quickTitle}>Rechercher un match</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.section}>Matchs à venir</Text>
    <MatchRow teams="ProDay FC vs AS Cannes" status="À confirmer" statusColor={colors.warning} />
    <MatchRow teams="FC Lyon vs US Villeurbanne" status="Confirmé" statusColor={colors.success} />
    <MatchRow teams="AS Nice vs OC Antibes" status="En attente" statusColor={colors.textMuted} />
  </ScrollView>
);

const MatchRow: React.FC<{
  teams: string;
  status: string;
  statusColor: string;
}> = ({ teams, status, statusColor }) => (
  <View style={[styles.matchCard, shadows.card]}>
    <Text style={styles.matchTeams}>{teams}</Text>
    <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
      <Text style={[styles.badgeText, { color: statusColor }]}>{status}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  quickTitle: { color: colors.bluePrimary, fontWeight: '700', fontSize: 14 },
  section: { color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeams: { color: colors.text, fontWeight: '600', flex: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
