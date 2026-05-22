import React, { useEffect, useState } from 'react';
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
import { Icon } from '../components/ui/Icon';
import { ProposeMatchScreen } from './ProposeMatchScreen';
import { SearchMatchScreen } from './SearchMatchScreen';
import { useFriendlyMatches } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { useMatchActions } from '../hooks/useMatchActions';
import {
  formatMatchDateTime,
  formatMatchTeams,
  matchStatusStyle,
} from '../utils/matchDisplay';

type MatchView = 'home' | 'propose' | 'search';

export const MatchsScreen: React.FC = () => {
  const [view, setView] = useState<MatchView>('home');
  const { profile } = useAuth();
  const { matches, loading, refresh } = useFriendlyMatches();
  const { acceptMatch, cancelMatch, markPlayed, canAccept } = useMatchActions(profile);
  const [myClubId, setMyClubId] = useState<string | null>(null);

  useEffect(() => {
    setMyClubId(profile ? profile.profile.club_id ?? profile.uid : null);
  }, [profile]);

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
    return (
      <SearchMatchScreen
        onBack={() => setView('home')}
        onAccepted={refresh}
      />
    );
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
        showBrandLogo
      />

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.actionCard, shadows.card]}
          onPress={() => setView('propose')}
        >
          <View style={styles.actionIconWrap}>
            <Icon name="calendar" size={28} color={colors.brand} />
          </View>
          <Text style={styles.actionTitle}>Proposer un match</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, shadows.card]}
          onPress={() => setView('search')}
        >
          <View style={styles.actionIconWrap}>
            <Icon name="search" size={28} color={colors.brand} />
          </View>
          <Text style={styles.actionTitle}>Rechercher un match</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Matchs à venir</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : matches.length === 0 ? (
        <Text style={styles.empty}>
          Aucun match. Connectez-vous et proposez un match pour commencer.
        </Text>
      ) : (
        matches.map((m) => {
          const st = matchStatusStyle(m.status);
          const isMine = myClubId != null && m.requester_club_id === myClubId;
          const showAccept = canAccept(m) && !isMine && profile;
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
              <View style={styles.actions}>
                {showAccept && (
                  <TouchableOpacity
                    style={styles.btnAccept}
                    onPress={() => acceptMatch(m, refresh)}
                  >
                    <Text style={styles.btnAcceptText}>Accepter</Text>
                  </TouchableOpacity>
                )}
                {isMine && m.status === 'OPEN' && (
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => cancelMatch(m, refresh)}
                  >
                    <Text style={styles.btnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                )}
                {isMine && m.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={styles.btnPlayed}
                    onPress={() => markPlayed(m, refresh)}
                  >
                    <Text style={styles.btnPlayedText}>Marquer joué</Text>
                  </TouchableOpacity>
                )}
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
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  btnAccept: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnAcceptText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  btnCancel: {
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnCancelText: { color: colors.error, fontWeight: '700', fontSize: 13 },
  btnPlayed: {
    borderWidth: 1,
    borderColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnPlayedText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
});
