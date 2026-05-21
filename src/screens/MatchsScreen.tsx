import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { ProposeMatchScreen } from './ProposeMatchScreen';
import { SearchMatchScreen } from './SearchMatchScreen';
import { useFriendlyMatches } from '../hooks/useAppData';
import {
  formatMatchDateTime,
  formatMatchTeams,
  matchStatusStyle,
} from '../utils/matchDisplay';

type MatchView = 'home' | 'propose' | 'search';

export const MatchsScreen: React.FC = () => {
  const [view, setView] = useState<MatchView>('home');
  const { matches, loading, refresh } = useFriendlyMatches();

  if (view === 'propose') {
    return (
      <ProposeMatchScreen
        onBack={() => setView('home')}
        onCreated={() => {
          refresh();
          setView('home');
        }}
      />
    );
  }
  if (view === 'search') {
    return <SearchMatchScreen onBack={() => setView('home')} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Matchs amicaux"
        subtitle="Jouez. Progressez. Créez du lien."
      />

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.actionCard, shadows.card]}
          onPress={() => setView('propose')}
        >
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionTitle}>Proposer un match</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, shadows.card]}
          onPress={() => setView('search')}
        >
          <Text style={styles.actionIcon}>🔎</Text>
          <Text style={styles.actionTitle}>Rechercher un match</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Matchs à venir</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : matches.length === 0 ? (
        <Text style={styles.empty}>
          Aucun match — exécutez{' '}
          <Text style={styles.emptyCode}>npm run seed</Text> pour des exemples.
        </Text>
      ) : (
        matches.map((m) => {
          const st = matchStatusStyle(m.status);
          return (
            <View key={m.id} style={[styles.matchCard, shadows.card]}>
              <Text style={styles.matchDate}>
                {formatMatchDateTime(m.date, m.time_label)}
              </Text>
              <Text style={styles.matchTeams}>{formatMatchTeams(m)}</Text>
              <Text style={styles.matchPlace}>
                {m.city}
                {m.level ? ` · ${m.level}` : ''}
              </Text>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Text style={[styles.badgeText, { color: st.color }]}>
                  {st.label}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 110,
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: spacing.sm },
  actionTitle: { fontSize: 14, fontWeight: '700', color: colors.brand },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  emptyCode: { fontFamily: 'monospace', color: colors.brand },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchDate: { fontSize: 12, color: colors.brand, fontWeight: '600' },
  matchTeams: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  matchPlace: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
