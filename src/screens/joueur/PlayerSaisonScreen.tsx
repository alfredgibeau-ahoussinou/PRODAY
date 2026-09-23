import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import type { PlayerRsvpStatus } from '../../services/playerRsvp.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { teamEventsService } from '../../services/teamEvents.service';
import { clubsService } from '../../services/clubs.service';
import { activeFffSeason } from '../../services/frenchFootballStandings.service';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import {
  EVENT_TYPE_LABELS,
  isCoachMatchEvent,
  userRsvp,
  type RsvpStatus,
  type TeamEvent,
} from '../../models/TeamEvent';
import { colors } from '../../theme/designTokens';
import { APPLE_FONT_STACK } from '../../theme/appleTypography';

export type SaisonTabId = 'matchs' | 'classement' | 'stats';

export function PlayerSaisonScreen() {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const [activeTab, setActiveTab] = useState<SaisonTabId>('matchs');

  /** Événements réels du joueur : null = chargement, erreur => liste vide + bandeau. */
  const [events, setEvents] = useState<TeamEvent[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [clubName, setClubName] = useState<string | null>(null);

  const clubId = profile?.profile.club_id ?? '';
  const seasonLabel = activeFffSeason().replace('-', '/');

  useEffect(() => {
    if (!profile?.uid) return;
    let alive = true;
    setEvents(null);
    setLoadError(false);
    teamEventsService
      .listForUser(profile.uid, clubId || undefined)
      .then((rows) => {
        if (!alive) return;
        setEvents(rows);
      })
      .catch(() => {
        if (!alive) return;
        setEvents([]);
        setLoadError(true);
      });
    if (clubId) {
      clubsService
        .getById(clubId)
        .then((c) => alive && setClubName(c?.name ?? null))
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [profile?.uid, clubId]);

  const reload = () => {
    if (!profile?.uid) return;
    teamEventsService
      .listForUser(profile.uid, clubId || undefined)
      .then((rows) => setEvents(rows))
      .catch(() => undefined);
  };

  const matchEvents = (events ?? []).filter(isCoachMatchEvent);
  const nextMatch =
    matchEvents
      .slice()
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
      .find((e) => e.starts_at.getTime() >= Date.now() - 2 * 3600 * 1000) ?? null;

  const pastMatches = matchEvents
    .filter((e) => e.starts_at.getTime() < Date.now() && e.live_state)
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
    .slice(0, 10);

  /** Statistiques réelles agrégées depuis les feuilles de match saisies par le staff. */
  const myStats = (() => {
    const uid = profile?.uid ?? '';
    let goals = 0;
    let assists = 0;
    const ratings: number[] = [];
    for (const e of matchEvents) {
      const s = e.player_match_stats?.[uid];
      if (!s) continue;
      goals += s.goals ?? 0;
      assists += s.assists ?? 0;
      if (typeof s.rating === 'number') ratings.push(s.rating);
    }
    return {
      goals,
      assists,
      ratedSheets: ratings.length,
      averageRating: ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null,
    };
  })();

  const RSVP_MAP: Record<PlayerRsvpStatus, RsvpStatus> = {
    present: 'yes',
    pending: 'maybe',
    absent: 'no',
  };
  function toUiRsvp(status: RsvpStatus): PlayerRsvpStatus {
    if (status === 'yes' || status === 'late_under_10' || status === 'late_over_10' || status === 'late_unknown') {
      return 'present';
    }
    if (status === 'no') return 'absent';
    if (status === 'maybe') return 'pending';
    return 'pending';
  }
  const myRsvp: PlayerRsvpStatus | null = nextMatch && profile ? toUiRsvp(userRsvp(nextMatch, profile.uid)) : null;

  const handleRsvpChange = (status: PlayerRsvpStatus) => {
    prodayHaptics.impactMedium();
    if (!nextMatch || !profile?.uid) return;
    setRsvpBusy(true);
    teamEventsService
      .updateRsvp(nextMatch.id, profile.uid, RSVP_MAP[status])
      .then(reload)
      .catch(() => undefined)
      .finally(() => setRsvpBusy(false));
  };

  const handleTabChange = (tabId: SaisonTabId) => {
    prodayHaptics.selection();
    setActiveTab(tabId);
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CONTENT_INSET + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header : Identité de la Saison (données réelles uniquement) */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Ma Saison</Text>
            <Text style={styles.headerSub}>
              {clubName ? `${clubName} · ` : ''}Saison {seasonLabel}
            </Text>
          </View>
        </View>

        {loadError ? (
          <View style={styles.honestCard}>
            <Text style={styles.honestNoteText}>
              Impossible de charger tes matchs. Vérifie ta connexion puis reviens sur cet onglet.
            </Text>
          </View>
        ) : null}

        {/* Apple Segmented Pill Rail */}
        <View style={styles.pillRail}>
          {(
            [
              { id: 'matchs', label: 'Matchs & Calendrier', icon: 'football' },
              { id: 'classement', label: 'Classement', icon: 'trophy' },
              { id: 'stats', label: 'Mes Stats', icon: 'stats-chart' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={tab.icon as any} size={13} color={isActive ? '#000000' : '#94A3B8'} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: MATCHS RÉELS & CALENDRIER */}
        {activeTab === 'matchs' ? (
          <View style={styles.tabContent}>
            {events === null ? (
              <View style={styles.honestCard}>
                <Text style={styles.honestNoteText}>Chargement de tes convocations…</Text>
              </View>
            ) : nextMatch ? (
              <LinearGradient
                colors={['#181822', '#101016']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextMatchCard}
              >
                <View style={styles.nextMatchHeader}>
                  <View style={styles.matchTagGreen}>
                    <Ionicons name="flame" size={13} color="#30D158" />
                    <Text style={styles.matchTagGreenText}>PROCHAIN MATCH</Text>
                  </View>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time" size={12} color="#FBBF24" />
                    <Text style={styles.countdownText}>{formatCalendarDate(nextMatch.starts_at)}</Text>
                  </View>
                </View>

                <View style={styles.clashRow}>
                  <Text style={styles.nextMatchTitle} numberOfLines={2}>
                    {nextMatch.title || EVENT_TYPE_LABELS[nextMatch.event_type]}
                  </Text>
                </View>

                <View style={styles.matchInfoLine}>
                  <Ionicons name="location" size={12} color="#94A3B8" />
                  <Text style={styles.matchInfoText} numberOfLines={1}>
                    {nextMatch.location_label || nextMatch.location || nextMatch.city || 'Lieu à confirmer'}
                  </Text>
                </View>

                {/* RSVP Convocations — écriture réelle via teamEventsService */}
                <View style={styles.rsvpSection}>
                  <Text style={styles.rsvpSectionTitle}>MA CONVOCATION / DISPONIBILITÉ :</Text>
                  <View style={styles.rsvpBar}>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, myRsvp === 'present' && styles.rsvpBtnPresent]}
                      onPress={() => handleRsvpChange('present')}
                      disabled={rsvpBusy}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={myRsvp === 'present' ? '#FFFFFF' : '#30D158'}
                      />
                      <Text style={[styles.rsvpBtnText, myRsvp === 'present' && styles.rsvpBtnTextActive]}>
                        Présent
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rsvpBtn, myRsvp === 'pending' && styles.rsvpBtnUncertain]}
                      onPress={() => handleRsvpChange('pending')}
                      disabled={rsvpBusy}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="help-circle"
                        size={14}
                        color={myRsvp === 'pending' ? '#FFFFFF' : '#FBBF24'}
                      />
                      <Text style={[styles.rsvpBtnText, myRsvp === 'pending' && styles.rsvpBtnTextActive]}>
                        Incertain
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rsvpBtn, myRsvp === 'absent' && styles.rsvpBtnAbsent]}
                      onPress={() => handleRsvpChange('absent')}
                      disabled={rsvpBusy}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="close-circle"
                        size={14}
                        color={myRsvp === 'absent' ? '#FFFFFF' : '#FF453A'}
                      />
                      <Text style={[styles.rsvpBtnText, myRsvp === 'absent' && styles.rsvpBtnTextActive]}>
                        Absent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.honestCard}>
                <Text style={styles.honestNoteText}>
                  Aucun match programmé pour l’instant. Les convocations créées par le staff
                  apparaîtront ici.
                </Text>
              </View>
            )}

            {/* Historique réel : scores enregistrés par le staff */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Derniers scores enregistrés</Text>
            </View>

            {events !== null && pastMatches.length === 0 ? (
              <View style={styles.honestCard}>
                <Text style={styles.honestNoteText}>
                  Aucun score enregistré. Les résultats saisis par le staff après tes matchs
                  s’afficheront ici.
                </Text>
              </View>
            ) : (
              <View style={styles.matchList}>
                {pastMatches.map((m) => {
                  const uid = profile?.uid ?? '';
                  const ls = m.live_state!;
                  const mine = m.player_match_stats?.[uid];
                  const result = ls.home_score > ls.away_score ? 'V' : ls.home_score === ls.away_score ? 'N' : 'D';
                  return (
                    <View key={m.id} style={styles.matchCard}>
                      <View style={styles.matchCardTop}>
                        <View style={styles.matchRoundBadge}>
                          <Text style={styles.matchRoundText}>{formatCalendarDate(m.starts_at)}</Text>
                        </View>

                        <View style={styles.matchCenterCol}>
                          <View style={styles.opponentRow}>
                            <Text style={styles.matchOpponent} numberOfLines={1}>
                              {ls.opponent_name || m.title || 'Match'}
                            </Text>
                          </View>
                          {mine ? (
                            <Text style={styles.matchPlayerPerformance}>
                              {mine.goals ? `${mine.goals} but${mine.goals > 1 ? 's' : ''}` : ''}
                              {mine.goals && mine.assists ? ' · ' : ''}
                              {mine.assists ? `${mine.assists} passe${mine.assists > 1 ? 's' : ''}` : ''}
                              {!mine.goals && !mine.assists ? 'Sélectionné' : ''}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.matchRightScore}>
                          <View
                            style={[
                              styles.resultScoreBadge,
                              result === 'V'
                                ? styles.resScoreWin
                                : result === 'N'
                                  ? styles.resScoreDraw
                                  : styles.resScoreLoss,
                            ]}
                          >
                            <Text style={styles.resScoreText}>
                              {ls.home_score} - {ls.away_score}
                            </Text>
                          </View>
                          {typeof mine?.rating === 'number' ? (
                            <View style={styles.ratingBox}>
                              <Text style={styles.ratingVal}>{mine.rating}</Text>
                              <Text style={styles.ratingMax}>/10</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* TAB 2: CLASSEMENT — aucun classement inventé */}
        {activeTab === 'classement' ? (
          <View style={styles.tabContent}>
            <View style={styles.honestCard}>
              <Text style={styles.honestNoteText}>
                Aucun classement officiel rattaché à ton club. Le classement de ta compétition
                apparaîtra ici dès qu’une source FFF sera validée par le club — aucun
                championnat fictif n’est affiché.
              </Text>
            </View>
          </View>
        ) : null}

        {/* TAB 3: MES STATS RÉELLES (feuilles de match saisies par le staff) */}
        {activeTab === 'stats' ? (
          <View style={styles.tabContent}>
            {myStats.ratedSheets === 0 && myStats.goals === 0 && myStats.assists === 0 ? (
              <View style={styles.honestCard}>
                <Text style={styles.honestNoteText}>
                  Aucune feuille de match saisie pour l’instant. Tes buts, passes décisives et
                  notes du staff apparaîtront ici dès leur enregistrement.
                </Text>
              </View>
            ) : (
              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiVal, { color: '#30D158' }]}>{myStats.goals}</Text>
                  <Text style={styles.kpiLbl}>BUTS SAISIS</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiVal, { color: '#0A84FF' }]}>{myStats.assists}</Text>
                  <Text style={styles.kpiLbl}>PASSES DÉCISIVES</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiVal, { color: '#FFD700' }]}>
                    {myStats.averageRating ?? '—'}
                  </Text>
                  <Text style={styles.kpiLbl}>NOTE MOYENNE</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiVal, { color: '#A855F7' }]}>{myStats.ratedSheets}</Text>
                  <Text style={styles.kpiLbl}>FEUILLES NOTÉES</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default PlayerSaisonScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  seasonBadgeText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  roundPill: {
    backgroundColor: '#16161E',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roundPillVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 14,
    fontWeight: '900',
    color: '#30D158',
  },
  roundPillSub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },

  /* Hero Banner */
  heroTeamBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  heroBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroRankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroRankText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  heroPromotionTag: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStatLbl: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Pill Rail */
  pillRail: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#30D158',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '900',
  },
  tabContent: {
    gap: 16,
  },

  /* Prochain Match Card */
  nextMatchCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  nextMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTagGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTagGreenText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countdownText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  clashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  teamCol: {
    flex: 1,
  },
  teamName: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  teamRankLeader: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
    marginTop: 2,
  },
  teamRankChallenger: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  vsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  vsText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
  },
  matchInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  matchInfoText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#94A3B8',
  },
  rsvpSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  rsvpSectionTitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rsvpBar: {
    flexDirection: 'row',
    backgroundColor: '#121218',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 11,
  },
  rsvpBtnPresent: {
    backgroundColor: '#30D158',
  },
  rsvpBtnUncertain: {
    backgroundColor: '#FBBF24',
  },
  rsvpBtnAbsent: {
    backgroundColor: '#FF453A',
  },
  rsvpBtnText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rsvpBtnTextActive: {
    color: '#000000',
    fontWeight: '900',
  },

  /* Section Titles */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#64748B',
  },

  /* Match Cards */
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  matchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchRoundBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
    width: 52,
  },
  matchRoundText: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 12,
    fontWeight: '900',
    color: '#30D158',
  },
  matchDateSub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  matchCenterCol: {
    flex: 1,
  },
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchOpponent: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchLocation: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#64748B',
  },
  matchPlayerPerformance: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  matchRightScore: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resScoreWin: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  resScoreDraw: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  resScoreLoss: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  resScoreText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFD700',
  },
  ratingMax: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    color: '#64748B',
  },
  motmTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  motmTagText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.3,
  },

  /* Upcoming list */
  upcomingList: {
    gap: 8,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  upcomingRoundBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  upcomingRoundText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingOpponent: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upcomingDate: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },

  /* STANDINGS */
  standingsHeaderBlock: {
    marginBottom: 10,
  },
  standingsNotice: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#121218',
    borderRadius: 10,
    marginBottom: 6,
  },
  thText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableBody: {
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  myClubRow: {
    backgroundColor: '#132018',
    borderColor: '#30D158',
    borderWidth: 1.5,
  },
  firstPlaceBorder: {
    borderColor: 'rgba(48, 209, 88, 0.4)',
  },
  rankCol: {
    width: 30,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: {
    backgroundColor: '#FFD700',
  },
  rankSilver: {
    backgroundColor: '#0A84FF',
  },
  rankRelegation: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  rankStandard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankNum: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  clubNameCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubNameText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myClubNameText: {
    color: '#30D158',
    fontWeight: '900',
  },
  myClubIndicator: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  myClubIndicatorText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8,
    fontWeight: '900',
    color: '#30D158',
  },
  ptsText: {
    width: 40,
    textAlign: 'center',
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mText: {
    width: 30,
    textAlign: 'center',
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#94A3B8',
  },
  diffText: {
    width: 36,
    textAlign: 'center',
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    color: '#94A3B8',
  },
  formRow: {
    width: 68,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 3,
  },
  formDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWin: {
    backgroundColor: '#30D158',
  },
  formDraw: {
    backgroundColor: '#64748B',
  },
  formLoss: {
    backgroundColor: '#FF453A',
  },
  formLetter: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9.5,
    color: '#64748B',
  },

  /* OBJECTIFS & QUÊTES */
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    alignItems: 'center',
  },
  kpiVal: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  kpiLbl: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  kpiSub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 6,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalProgressVal: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '800',
    color: '#30D158',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalRemark: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    color: '#64748B',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  questIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questTextWrap: {
    flex: 1,
  },
  questTitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  questDesc: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFD700',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedTagText: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#30D158',
  },
  trophiesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trophyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
  },
  trophyCount: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  trophyTitle: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  trophySub: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  honestCard: {
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  honestNoteText: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  nextMatchTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});

