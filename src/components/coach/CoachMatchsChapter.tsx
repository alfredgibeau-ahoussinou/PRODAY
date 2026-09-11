import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
  isCoachEventHubReady,
  isCoachMatchEvent,
} from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';
import type { MatchHubChapterId } from '../../content/matchHubChapters';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import {
  userCanManageConvocations,
  resolveClubCoversCoachFromMembers,
} from '../../utils/clubFeatureAccess';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';

type MatchFilter = 'all' | 'upcoming' | 'past';

export const CoachMatchsChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const clubCoversCoach = useMemo(() => resolveClubCoversCoachFromMembers(members), [members]);
  const canManage = userCanManageConvocations(profile, { clubCoversCoach });

  const [activeFilter, setActiveFilter] = useState<MatchFilter>('all');

  const allMatches = useMemo(() => {
    return [...events]
      .filter((e) => isCoachMatchEvent(e))
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    return allMatches.filter((e) => e.starts_at.getTime() > now);
  }, [allMatches]);

  const pastMatches = useMemo(() => {
    const now = Date.now();
    return allMatches
      .filter((e) => e.starts_at.getTime() <= now)
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime());
  }, [allMatches]);

  const nextMatch = upcomingMatches[0] ?? null;

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'upcoming') return upcomingMatches;
    if (activeFilter === 'past') return pastMatches;
    return allMatches;
  }, [activeFilter, allMatches, upcomingMatches, pastMatches]);

  const openNav = (id: 'entrainements' | 'gestion' | 'match_center' | 'coach_ia' | 'carpool') => {
    if (shellNav) {
      shellNav.requestNav(id);
      return;
    }
    tabNav.openMatchs(
      id === 'entrainements'
        ? { homeTab: 'season' }
        : id === 'gestion'
          ? { homeTab: 'convocations' }
          : undefined,
    );
  };

  const openCreate = () => {
    if (!canManage) {
      Alert.alert(t('coach.portal.proGate.title'), t('coach.portal.proGate.body'));
      return;
    }
    openNav('gestion');
  };

  const openHub = (eventId: string, hubChapter: MatchHubChapterId = 'apercu') => {
    tabNav.openMatchs({ eventId, hubChapter });
  };

  const yesCount = nextMatch ? countRsvpYes(nextMatch) : 0;
  const pendingCount = nextMatch ? getPendingInviteeUids(nextMatch).length : 0;
  const inviteeCount = nextMatch?.invitee_uids.length ?? 0;
  const rsvpRatio = inviteeCount > 0 ? Math.min(1, yesCount / inviteeCount) : 0;

  return (
    <CoachPane title={getCoachPageIdentity('match_center').title}>
      <CoachChapterScroll>
        {/* En-tête KPI / Action création */}
        <View style={styles.topHeaderRow}>
          <View>
            <ProDayText variant="title" style={styles.headerMainTitle}>
              Matchs & Calendrier
            </ProDayText>
            <ProDayText variant="caption" style={styles.headerSub}>
              {allMatches.length} match{allMatches.length > 1 ? 's' : ''} au calendrier · {upcomingMatches.length} à venir
            </ProDayText>
          </View>

          {canManage ? (
            <PressableSpring
              style={styles.newMatchBtn}
              onPress={openCreate}
              scaleTo={0.96}
              haptic
            >
              <Icon name="add" size={16} color="#000000" />
              <ProDayText variant="caption" style={styles.newMatchBtnText}>
                Nouveau match
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>

        {!nextMatch && allMatches.length === 0 ? (
          <CoachEmptyState
            title={t('coach.portal.matchs.empty')}
            body={t('coach.portal.matchs.emptyBody')}
            cta={t('coach.portal.matchs.emptyCta')}
            onPress={openCreate}
          />
        ) : (
          <>
            {/* HERO CARD DU PROCHAIN MATCH */}
            {nextMatch ? (
              <View style={styles.heroCard}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.liveTag}>
                    <View style={styles.liveTagDot} />
                    <ProDayText variant="caption" style={styles.liveTagText}>
                      PROCHAIN MATCH
                    </ProDayText>
                  </View>
                  <View style={styles.compBadge}>
                    <Icon name="trophy" size={12} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.compBadgeText}>
                      {EVENT_TYPE_LABELS[nextMatch.event_type] || 'CHAMPIONNAT'}
                    </ProDayText>
                  </View>
                </View>

                <ProDayText variant="title" style={styles.heroMatchTitle} numberOfLines={2}>
                  {nextMatch.title}
                </ProDayText>

                <View style={styles.heroMetaRow}>
                  <View style={styles.metaItem}>
                    <Icon name="calendar" size={13} color="#8B8B9A" />
                    <ProDayText variant="caption" style={styles.metaText}>
                      {formatCalendarDate(nextMatch.starts_at)}
                    </ProDayText>
                  </View>
                  {nextMatch.city || nextMatch.location_label ? (
                    <View style={styles.metaItem}>
                      <Icon name="location" size={13} color="#8B8B9A" />
                      <ProDayText variant="caption" style={styles.metaText} numberOfLines={1}>
                        {nextMatch.location_label || nextMatch.city}
                      </ProDayText>
                    </View>
                  ) : null}
                </View>

                {/* RSVP PROGRESS KPI BAR */}
                <View style={styles.rsvpCard}>
                  <View style={styles.rsvpStatsRow}>
                    <View style={styles.rsvpStatCol}>
                      <ProDayText variant="title" style={[styles.rsvpStatVal, { color: tokens.foreground }]}>
                        {inviteeCount}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.rsvpStatLbl}>
                        Convoqués
                      </ProDayText>
                    </View>

                    <View style={styles.rsvpDivider} />

                    <View style={styles.rsvpStatCol}>
                      <ProDayText variant="title" style={[styles.rsvpStatVal, { color: '#10B981' }]}>
                        {yesCount}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.rsvpStatLbl}>
                        Confirmés
                      </ProDayText>
                    </View>

                    <View style={styles.rsvpDivider} />

                    <View style={styles.rsvpStatCol}>
                      <ProDayText variant="title" style={[styles.rsvpStatVal, { color: '#F59E0B' }]}>
                        {pendingCount}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.rsvpStatLbl}>
                        En attente
                      </ProDayText>
                    </View>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.round(rsvpRatio * 100)}%`,
                          backgroundColor: tokens.accent,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* 4 ACTION CHIPS RAPIDES */}
                <View style={styles.actionGrid}>
                  <PressableSpring
                    style={styles.actionChip}
                    onPress={() => openHub(nextMatch.id, 'effectif')}
                    scaleTo={0.96}
                    haptic
                  >
                    <Icon name="people" size={16} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.actionChipText}>
                      Pointage
                    </ProDayText>
                  </PressableSpring>

                  <PressableSpring
                    style={styles.actionChip}
                    onPress={() => openHub(nextMatch.id, 'composition')}
                    scaleTo={0.96}
                    haptic
                  >
                    <Icon name="football" size={16} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.actionChipText}>
                      Compo
                    </ProDayText>
                  </PressableSpring>

                  <PressableSpring
                    style={styles.actionChip}
                    onPress={() => openHub(nextMatch.id, 'live')}
                    scaleTo={0.96}
                    haptic
                  >
                    <Icon name="time" size={16} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.actionChipText}>
                      Live
                    </ProDayText>
                  </PressableSpring>

                  <PressableSpring
                    style={styles.actionChip}
                    onPress={() => openHub(nextMatch.id, 'stats')}
                    scaleTo={0.96}
                    haptic
                  >
                    <Icon name="stats-chart" size={16} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.actionChipText}>
                      Stats
                    </ProDayText>
                  </PressableSpring>
                </View>

                {/* PRIMARY CTA */}
                <PressableSpring
                  style={[styles.primaryHubBtn, { backgroundColor: tokens.accent }]}
                  onPress={() => openHub(nextMatch.id, 'apercu')}
                  scaleTo={0.97}
                  haptic
                >
                  <Icon name="trophy" size={17} color="#000000" />
                  <ProDayText variant="section" style={styles.primaryHubBtnText}>
                    Ouvrir le Match Center
                  </ProDayText>
                </PressableSpring>
              </View>
            ) : null}

            {/* FILTRES PAR ONGLET HORIZONTAL */}
            <View style={styles.filterPillsRow}>
              <PressableSpring
                style={[
                  styles.filterPill,
                  activeFilter === 'all' && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter('all')}
                scaleTo={0.95}
              >
                <ProDayText
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    activeFilter === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  Tous ({allMatches.length})
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[
                  styles.filterPill,
                  activeFilter === 'upcoming' && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter('upcoming')}
                scaleTo={0.95}
              >
                <ProDayText
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    activeFilter === 'upcoming' && styles.filterPillTextActive,
                  ]}
                >
                  À venir ({upcomingMatches.length})
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                style={[
                  styles.filterPill,
                  activeFilter === 'past' && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter('past')}
                scaleTo={0.95}
              >
                <ProDayText
                  variant="caption"
                  style={[
                    styles.filterPillText,
                    activeFilter === 'past' && styles.filterPillTextActive,
                  ]}
                >
                  Terminés ({pastMatches.length})
                </ProDayText>
              </PressableSpring>
            </View>

            {/* LISTE DES MATCHS */}
            <View style={styles.matchesListWrap}>
              {filteredMatches.map((match) => {
                const isReady = isCoachEventHubReady(match);
                const isPast = match.starts_at.getTime() <= Date.now();
                const matchYes = countRsvpYes(match);
                const matchTotal = match.invitee_uids.length;

                return (
                  <PressableSpring
                    key={match.id}
                    style={styles.matchCard}
                    onPress={() => (isReady ? openHub(match.id) : openCreate())}
                    scaleTo={0.98}
                    haptic
                  >
                    <View style={styles.matchCardTop}>
                      <View style={styles.matchBadgeRow}>
                        <View style={styles.matchTypeTag}>
                          <ProDayText variant="caption" style={styles.matchTypeTagText}>
                            {EVENT_TYPE_LABELS[match.event_type] || 'MATCH'}
                          </ProDayText>
                        </View>
                        {isPast ? (
                          <View style={styles.pastTag}>
                            <ProDayText variant="caption" style={styles.pastTagText}>
                              TERMINÉ
                            </ProDayText>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.matchRsvpBadge}>
                        <Icon name="people" size={12} color="#8B8B9A" />
                        <ProDayText variant="caption" style={styles.matchRsvpBadgeText}>
                          {matchYes}/{matchTotal} confirmés
                        </ProDayText>
                      </View>
                    </View>

                    <ProDayText variant="section" style={styles.matchTitle}>
                      {match.title}
                    </ProDayText>

                    <View style={styles.matchCardBottom}>
                      <View style={styles.matchMetaLeft}>
                        <Icon name="calendar" size={13} color="#8B8B9A" />
                        <ProDayText variant="caption" style={styles.matchDateText}>
                          {formatCalendarDate(match.starts_at)}
                        </ProDayText>
                        {match.city ? (
                          <>
                            <ProDayText variant="caption" style={styles.metaDot}>
                              ·
                            </ProDayText>
                            <ProDayText variant="caption" style={styles.matchDateText}>
                              {match.city}
                            </ProDayText>
                          </>
                        ) : null}
                      </View>

                      <View style={styles.matchOpenRow}>
                        <ProDayText variant="caption" style={styles.matchOpenText}>
                          {isReady ? 'Ouvrir' : 'Gérer'}
                        </ProDayText>
                        <Icon name="chevron-forward" size={14} color={tokens.accent} />
                      </View>
                    </View>
                  </PressableSpring>
                );
              })}
            </View>

            {/* OUTILS RAPIDES MATCH COACH */}
            <View style={styles.sectionHeader}>
              <ProDayText variant="section" style={styles.sectionTitle}>
                Outils de préparation
              </ProDayText>
            </View>

            <View style={styles.toolsGrid}>
              <PressableSpring
                style={styles.toolCard}
                onPress={() => openNav('coach_ia')}
                scaleTo={0.97}
                haptic
              >
                <View style={[styles.toolIconWrap, { backgroundColor: '#8B5CF61F', borderColor: '#8B5CF640' }]}>
                  <Icon name="star-four-points" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.toolContent}>
                  <ProDayText variant="section" style={styles.toolTitle}>
                    Causerie & IA
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toolSub}>
                    Générateur de discours motivant
                  </ProDayText>
                </View>
              </PressableSpring>

              <PressableSpring
                style={styles.toolCard}
                onPress={() => openNav('gestion')}
                scaleTo={0.97}
                haptic
              >
                <View style={[styles.toolIconWrap, { backgroundColor: '#3B82F61F', borderColor: '#3B82F640' }]}>
                  <Icon name="people" size={20} color="#3B82F6" />
                </View>
                <View style={styles.toolContent}>
                  <ProDayText variant="section" style={styles.toolTitle}>
                    Convocations
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toolSub}>
                    Feuille de match & relances
                  </ProDayText>
                </View>
              </PressableSpring>

              <PressableSpring
                style={styles.toolCard}
                onPress={() => openNav('carpool')}
                scaleTo={0.97}
                haptic
              >
                <View style={[styles.toolIconWrap, { backgroundColor: `${tokens.accent}1F`, borderColor: `${tokens.accent}40` }]}>
                  <Icon name="car" size={20} color={tokens.accent} />
                </View>
                <View style={styles.toolContent}>
                  <ProDayText variant="section" style={styles.toolTitle}>
                    Covoiturage
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toolSub}>
                    Trajets & véhicules match
                  </ProDayText>
                </View>
              </PressableSpring>

              <PressableSpring
                style={styles.toolCard}
                onPress={() => openNav('entrainements')}
                scaleTo={0.97}
                haptic
              >
                <View style={[styles.toolIconWrap, { backgroundColor: '#10B9811F', borderColor: '#10B98140' }]}>
                  <Icon name="calendar" size={20} color="#10B981" />
                </View>
                <View style={styles.toolContent}>
                  <ProDayText variant="section" style={styles.toolTitle}>
                    Séances
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.toolSub}>
                    Planning des entraînements
                  </ProDayText>
                </View>
              </PressableSpring>
            </View>
          </>
        )}
      </CoachChapterScroll>
    </CoachPane>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    topHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerMainTitle: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    headerSub: {
      color: '#8B8B9A',
      fontSize: 12,
      marginTop: 2,
    },
    newMatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: tokens.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.md,
    },
    newMatchBtnText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 12.5,
    },
    heroCard: {
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
      borderRadius: 22,
      padding: 18,
      marginBottom: spacing.lg,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    liveTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(245, 197, 24, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245, 197, 24, 0.35)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    liveTagDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F5C518',
    },
    liveTagText: {
      color: '#F5C518',
      fontWeight: '900',
      fontSize: 9.5,
      letterSpacing: 0.3,
    },
    compBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${tokens.accent}14`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    compBadgeText: {
      color: tokens.accent,
      fontWeight: '800',
      fontSize: 10,
    },
    heroMatchTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.3,
      lineHeight: 26,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 8,
      marginBottom: 14,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      color: '#8B8B9A',
      fontSize: 12,
      fontWeight: '600',
    },
    rsvpCard: {
      backgroundColor: '#101015',
      borderWidth: 1,
      borderColor: '#1C1C24',
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
    },
    rsvpStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 10,
    },
    rsvpStatCol: {
      alignItems: 'center',
    },
    rsvpStatVal: {
      fontSize: 18,
      fontWeight: '900',
    },
    rsvpStatLbl: {
      color: '#8B8B9A',
      fontSize: 10.5,
      fontWeight: '600',
      marginTop: 2,
    },
    rsvpDivider: {
      width: 1,
      height: 24,
      backgroundColor: '#22222E',
    },
    progressBarTrack: {
      width: '100%',
      height: 5,
      borderRadius: 3,
      backgroundColor: '#22222E',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    actionGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    actionChip: {
      flex: 1,
      backgroundColor: '#1A1A22',
      borderWidth: 1,
      borderColor: '#262634',
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    actionChipText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 11,
    },
    primaryHubBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
    },
    primaryHubBtnText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 14,
    },
    filterPillsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    filterPill: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
    },
    filterPillActive: {
      backgroundColor: `${tokens.accent}20`,
      borderColor: `${tokens.accent}55`,
    },
    filterPillText: {
      color: '#8B8B9A',
      fontWeight: '700',
      fontSize: 11.5,
    },
    filterPillTextActive: {
      color: tokens.accent,
      fontWeight: '800',
    },
    matchesListWrap: {
      gap: 10,
      marginBottom: spacing.xl,
    },
    matchCard: {
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
      borderRadius: 16,
      padding: 14,
      gap: 8,
    },
    matchCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    matchBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    matchTypeTag: {
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 5,
    },
    matchTypeTagText: {
      color: '#C4C4D0',
      fontSize: 9.5,
      fontWeight: '800',
    },
    pastTag: {
      backgroundColor: 'rgba(107, 114, 128, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    pastTagText: {
      color: '#9CA3AF',
      fontSize: 9,
      fontWeight: '700',
    },
    matchRsvpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    matchRsvpBadgeText: {
      color: '#8B8B9A',
      fontSize: 11,
      fontWeight: '600',
    },
    matchTitle: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    matchCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: '#1C1C24',
      paddingTop: 8,
      marginTop: 2,
    },
    matchMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    matchDateText: {
      color: '#8B8B9A',
      fontSize: 11.5,
      fontWeight: '500',
    },
    metaDot: {
      color: '#555566',
      fontSize: 12,
    },
    matchOpenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    matchOpenText: {
      color: tokens.accent,
      fontSize: 11.5,
      fontWeight: '700',
    },
    sectionHeader: {
      marginBottom: 10,
    },
    sectionTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: spacing.xxl,
    },
    toolCard: {
      width: '48.5%',
      backgroundColor: '#14141A',
      borderWidth: 1,
      borderColor: '#22222E',
      borderRadius: 16,
      padding: 13,
      gap: 10,
    },
    toolIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolContent: {
      gap: 2,
    },
    toolTitle: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '800',
    },
    toolSub: {
      color: '#8B8B9A',
      fontSize: 10.5,
      lineHeight: 14,
    },
  });
}

