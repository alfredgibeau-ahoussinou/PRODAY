import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { supporterProfileService } from '../../services/supporterProfile.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { isCoachMatchEvent, type TeamEvent } from '../../models/TeamEvent';
import { isInMatchWindow, resolveLiveState } from '../../utils/matchLive';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';

export const SupporterMatchCenterScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [matches, setMatches] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followedClubsCount, setFollowedClubsCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!currentUid) {
      setMatches([]);
      setFollowedClubsCount(0);
      setLoading(false);
      return;
    }

    try {
      const clubs = await supporterProfileService.getFollowedClubs(currentUid);
      setFollowedClubsCount(clubs.length);

      if (clubs.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const allMatches: TeamEvent[] = [];
      await Promise.all(
        clubs.map(async (c) => {
          try {
            const evts = await teamEventsService.listForClub(c.clubId, 40);
            const m = evts.filter(isCoachMatchEvent);
            allMatches.push(...m);
          } catch {
            // Ignorer
          }
        }),
      );

      allMatches.sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );

      setMatches(allMatches);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [currentUid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Séparation Live / À venir / Terminés
  const { liveMatches, upcomingMatches, finishedMatches, featuredMatch } = useMemo(() => {
    const live: TeamEvent[] = [];
    const upcoming: TeamEvent[] = [];
    const finished: TeamEvent[] = [];

    for (const m of matches) {
      const liveState = resolveLiveState(m);
      if (isInMatchWindow(m) || liveState.status === 'live' || liveState.status === 'halftime') {
        live.push(m);
      } else if (liveState.status === 'finished') {
        finished.push(m);
      } else {
        upcoming.push(m);
      }
    }

    // Match vedette = 1er live, sinon 1er à venir, sinon 1er terminé
    const featured = live[0] || upcoming[0] || finished[finished.length - 1] || null;

    return {
      liveMatches: live,
      upcomingMatches: upcoming,
      finishedMatches: finished.reverse(),
      featuredMatch: featured,
    };
  }, [matches]);

  const handleMatchPress = (m: TeamEvent) => {
    const d = new Date(m.starts_at);
    const dateStr = d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const title = m.title || 'Rencontre';
    const loc = m.location_label || 'Stade principal';
    const liveState = resolveLiveState(m);
    const scoreStr =
      liveState.home_score !== undefined && liveState.away_score !== undefined
        ? `Score : ${liveState.home_score} - ${liveState.away_score}`
        : 'Score non communiqué';

    Alert.alert(title, `${dateStr}\n${loc}\n\n${scoreStr}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.brand}
          />
        }
      >
        {/* En-tête */}
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Match Center</Text>
            <Text style={styles.subtitle}>
              Scores en direct, prochaines affiches et résultats de vos clubs
            </Text>
          </View>
        </AnimatedEntrance>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : followedClubsCount === 0 ? (
          <AnimatedEntrance kind="fadeUp" index={1}>
            <View style={styles.emptyCard}>
              <Icon name="football-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun club suivi</Text>
              <Text style={styles.emptySubtitle}>
                Suivez des clubs pour accéder aux scores en direct, compositions et feuilles de match.
              </Text>
              <PressableSpring
                onPress={() => setActiveTab('plus')}
                scaleTo={0.95}
                haptic
                style={styles.ctaBtn}
              >
                <Icon name="search" size={14} color="#000" />
                <Text style={styles.ctaBtnText}>Suivre un club</Text>
              </PressableSpring>
            </View>
          </AnimatedEntrance>
        ) : (
          <>
            {/* Match Vedette (Hero Card) */}
            {featuredMatch && (
              <AnimatedEntrance kind="fadeUp" index={1}>
                <View style={styles.featuredCard}>
                  <View style={styles.featuredHeader}>
                    {isInMatchWindow(featuredMatch) ? (
                      <View style={styles.livePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>EN DIRECT</Text>
                      </View>
                    ) : (
                      <Text style={styles.featuredCategory}>
                        {featuredMatch.event_type?.toUpperCase() || 'MATCH OFFICIEL'}
                      </Text>
                    )}
                    <Text style={styles.featuredDate}>
                      {new Date(featuredMatch.starts_at).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.featuredTitle}>{featuredMatch.title}</Text>

                  <View style={styles.featuredScoreRow}>
                    <View style={styles.teamCol}>
                      <Icon name="shield" size={24} color={colors.brand} />
                      <Text style={styles.teamName} numberOfLines={1}>
                        {featuredMatch.club_name || 'Club'}
                      </Text>
                    </View>

                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreText}>
                        {resolveLiveState(featuredMatch).home_score ?? '—'} :{' '}
                        {resolveLiveState(featuredMatch).away_score ?? '—'}
                      </Text>
                    </View>

                    <View style={styles.teamCol}>
                      <Icon name="football" size={24} color={colors.tone4} />
                      <Text style={styles.teamName} numberOfLines={1}>
                        {resolveLiveState(featuredMatch).opponent_name || 'Adversaire'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <Icon name="location" size={13} color={colors.textMuted} />
                    <Text style={styles.featuredLocation} numberOfLines={1}>
                      {featuredMatch.location_label || 'Stade principal'}
                    </Text>
                  </View>
                </View>
              </AnimatedEntrance>
            )}

            {/* Section 1 : Matchs en direct (si présents) */}
            {liveMatches.length > 0 && (
              <AnimatedEntrance kind="fadeUp" index={2}>
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.liveDot} />
                    <Text style={styles.sectionTitle}>En direct ({liveMatches.length})</Text>
                  </View>
                  <View style={styles.matchesList}>
                    {liveMatches.map((m) => (
                      <PressableSpring
                        key={m.id}
                        onPress={() => handleMatchPress(m)}
                        scaleTo={0.97}
                        haptic
                        style={styles.matchRow}
                      >
                        <View style={styles.matchRowLeft}>
                          <Text style={styles.matchRowTitle}>{m.title}</Text>
                          <Text style={styles.matchRowSub}>
                            {m.location_label || 'Terrain principal'}
                          </Text>
                        </View>
                        <View style={styles.liveBadge}>
                          <Text style={styles.liveBadgeText}>
                            {resolveLiveState(m).home_score ?? 0} -{' '}
                            {resolveLiveState(m).away_score ?? 0}
                          </Text>
                        </View>
                      </PressableSpring>
                    ))}
                  </View>
                </View>
              </AnimatedEntrance>
            )}

            {/* Section 2 : Prochaines Affiches */}
            <AnimatedEntrance kind="fadeUp" index={3}>
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="calendar" size={16} color={colors.brand} />
                  <Text style={styles.sectionTitle}>
                    Prochaines affiches ({upcomingMatches.length})
                  </Text>
                </View>
                {upcomingMatches.length === 0 ? (
                  <View style={styles.simpleEmptyBox}>
                    <Text style={styles.simpleEmptyText}>Aucun match à venir programmé</Text>
                  </View>
                ) : (
                  <View style={styles.matchesList}>
                    {upcomingMatches.slice(0, 5).map((m) => (
                      <PressableSpring
                        key={m.id}
                        onPress={() => handleMatchPress(m)}
                        scaleTo={0.97}
                        haptic
                        style={styles.matchRow}
                      >
                        <View style={styles.matchRowLeft}>
                          <Text style={styles.matchRowTitle}>{m.title}</Text>
                          <Text style={styles.matchRowSub}>
                            {new Date(m.starts_at).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Icon name="chevron-forward" size={16} color={colors.textMuted} />
                      </PressableSpring>
                    ))}
                  </View>
                )}
              </View>
            </AnimatedEntrance>

            {/* Section 3 : Derniers scores */}
            {finishedMatches.length > 0 && (
              <AnimatedEntrance kind="fadeUp" index={4}>
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Icon name="checkmark-circle" size={16} color={colors.tone4} />
                    <Text style={styles.sectionTitle}>Derniers résultats</Text>
                  </View>
                  <View style={styles.matchesList}>
                    {finishedMatches.slice(0, 5).map((m) => {
                      const state = resolveLiveState(m);
                      return (
                        <PressableSpring
                          key={m.id}
                          onPress={() => handleMatchPress(m)}
                          scaleTo={0.97}
                          haptic
                          style={styles.matchRow}
                        >
                          <View style={styles.matchRowLeft}>
                            <Text style={styles.matchRowTitle}>{m.title}</Text>
                            <Text style={styles.matchRowSub}>
                              Terminé ·{' '}
                              {new Date(m.starts_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </Text>
                          </View>
                          <View style={styles.scorePill}>
                            <Text style={styles.scorePillText}>
                              {state.home_score ?? '—'} - {state.away_score ?? '—'}
                            </Text>
                          </View>
                        </PressableSpring>
                      );
                    })}
                  </View>
                </View>
              </AnimatedEntrance>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: { gap: 4 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  loaderBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    minHeight: 44,
  },
  ctaBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  featuredScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  teamCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  teamName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreText: {
    color: colors.brand,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  featuredLocation: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  matchesList: {
    gap: spacing.xs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  matchRowLeft: {
    flex: 1,
    gap: 2,
  },
  matchRowTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  matchRowSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  liveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  liveBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  scorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scorePillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  simpleEmptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  simpleEmptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
