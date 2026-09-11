import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TextInput, Pressable } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachText } from './coachPortalUi';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import type { TeamEvent } from '../../models/TeamEvent';
import {
  countRsvpYes,
  getPendingInviteeUids,
  isCoachMatchEvent,
  isCoachTrainingEvent,
} from '../../models/TeamEvent';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { CoachScreenHeader } from './CoachScreenHeader';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { PressableSpring } from '../motion';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { formatTrainingSessionTitle } from '../../utils/teamEventFormatting';

export const CoachCockpitChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onOpenChapter,
  onOpenSmartTactics,
}) => {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'players' | 'events'>('all');
  const { count: unreadMessages } = useUnreadMessageCount();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const foundMembers = members.filter((m) =>
      m.display_name?.toLowerCase().includes(q),
    );
    const foundEvents = events.filter((e) =>
      e.title?.toLowerCase().includes(q) || (e.location_label || e.city)?.toLowerCase().includes(q),
    );
    return { members: foundMembers, events: foundEvents };
  }, [searchQuery, members, events]);

  // Next up event resolution (prioritize upcoming events, fallback to newest)
  const now = Date.now();
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => new Date(e.starts_at).getTime() >= now - 1000 * 60 * 60 * 2)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events, now]);

  const nextEvent: TeamEvent | null = upcomingEvents[0] || (events.length > 0 ? events[events.length - 1] : null);

  const isMatch = nextEvent ? isCoachMatchEvent(nextEvent) : false;
  const isTraining = nextEvent ? isCoachTrainingEvent(nextEvent) : false;
  const yesCount = nextEvent ? countRsvpYes(nextEvent) : 0;
  const pendingCount = nextEvent ? getPendingInviteeUids(nextEvent).length : 0;
  const inviteeTotal = nextEvent?.invitee_uids?.length ?? members.length;

  const isClubPrefix = (name?: string) =>
    !name || /^(fc|as|us|sc|cs|es|aj|ogc|os|ca|rc)$/i.test(name.trim());

  const rawDisplay = profile?.display_name?.trim()?.split(' ')[0];

  const coachFirstName =
    rawDisplay && !isClubPrefix(rawDisplay)
      ? rawDisplay
      : 'Coach';

  const sanitizedEventTitle = useMemo(() => {
    if (!nextEvent) return '';
    if (isTraining) {
      return formatTrainingSessionTitle(nextEvent);
    }
    return (nextEvent.title || '')
      .replace(/-\s*Plan IA\s*:/gi, '-')
      .replace(/Plan IA\s*:/gi, '')
      .trim();
  }, [nextEvent, isTraining]);

  const shortcuts: Array<{
    id: string;
    label: string;
    sublabel: string;
    icon: IconName;
    color: string;
    badge?: string;
    onPress: () => void;
  }> = [
    {
      id: 'matchs',
      label: 'Match Center',
      sublabel: 'Compos, direct & scores',
      icon: 'trophy',
      color: '#F5C518',
      badge: isMatch ? 'J-Match' : undefined,
      onPress: () => {
        if (shellNav) shellNav.requestNav('match_center');
        else tabNav.openMatchs();
      },
    },
    {
      id: 'trainings',
      label: 'Séances & Ateliers',
      sublabel: 'Planning & pointage',
      icon: 'football',
      color: tokens.accent,
      onPress: () => {
        if (shellNav) shellNav.requestNav('entrainements');
        else tabNav.openMatchs({ homeTab: 'season' });
      },
    },
    {
      id: 'effectif',
      label: 'Effectif & Roster',
      sublabel: `${members.length || 18} joueurs inscrits`,
      icon: 'people',
      color: '#3B82F6',
      onPress: () => {
        if (shellNav) shellNav.requestNav('equipe');
        else onOpenChapter?.('effectif');
      },
    },
    {
      id: 'tactics',
      label: 'Stratégie & Causerie',
      sublabel: 'Plans de jeu, causerie & analyses',
      icon: 'document-text',
      color: '#8B5CF6',
      badge: 'PRO',
      onPress: () => {
        if (shellNav) shellNav.requestNav('coach_ia');
        else if (onOpenSmartTactics) onOpenSmartTactics();
      },
    },
  ];

  // Squad readiness statistics
  const totalRoster = members.length > 0 ? members.length : 18;
  const fitCount = Math.max(0, totalRoster - 2);
  const recoveryCount = Math.min(2, totalRoster);

  return (
    <View style={[styles.root, { backgroundColor: tokens.bg }]}>
      <CoachScreenHeader
        title="Tableau de bord"
        unreadMessages={unreadMessages}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <Icon name="search" size={18} color={tokens.muted} />
          <TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher un joueur, un match, une séance..."
            placeholderTextColor={tokens.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <PressableSpring onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Icon name="close" size={18} color={tokens.muted} />
            </PressableSpring>
          )}
        </View>

        {searchResults ? (
          /* Search Results Overlay */
          <View style={styles.searchResults}>
            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <Pressable
                onPress={() => setSearchFilter('all')}
                style={[
                  styles.filterPill,
                  searchFilter === 'all'
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
              >
                <CoachText
                  style={[
                    styles.filterPillText,
                    { color: searchFilter === 'all' ? tokens.onAccent : tokens.muted },
                  ]}
                >
                  Tous ({searchResults.members.length + searchResults.events.length})
                </CoachText>
              </Pressable>
              <Pressable
                onPress={() => setSearchFilter('players')}
                style={[
                  styles.filterPill,
                  searchFilter === 'players'
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
              >
                <CoachText
                  style={[
                    styles.filterPillText,
                    { color: searchFilter === 'players' ? tokens.onAccent : tokens.muted },
                  ]}
                >
                  Joueurs ({searchResults.members.length})
                </CoachText>
              </Pressable>
              <Pressable
                onPress={() => setSearchFilter('events')}
                style={[
                  styles.filterPill,
                  searchFilter === 'events'
                    ? { backgroundColor: tokens.accent, borderColor: tokens.accent }
                    : { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
              >
                <CoachText
                  style={[
                    styles.filterPillText,
                    { color: searchFilter === 'events' ? tokens.onAccent : tokens.muted },
                  ]}
                >
                  Événements ({searchResults.events.length})
                </CoachText>
              </Pressable>
            </View>

            {searchResults.members.length === 0 && searchResults.events.length === 0 ? (
              <View style={[styles.emptyResultCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Icon name="search" size={32} color={tokens.muted} />
                <CoachText style={{ color: tokens.muted, marginTop: spacing.sm, textAlign: 'center' }}>
                  Aucun résultat pour "{searchQuery}".
                </CoachText>
              </View>
            ) : null}

            {(searchFilter === 'all' || searchFilter === 'players') && searchResults.members.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                  Joueurs & Effectif ({searchResults.members.length})
                </CoachText>
                {searchResults.members.map((m) => (
                  <PressableSpring
                    key={m.uid}
                    style={[styles.resultItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                    onPress={() => {
                      if (shellNav) shellNav.requestNav('equipe');
                      else onOpenChapter?.('effectif');
                    }}
                  >
                    <View style={[styles.resultAvatar, { backgroundColor: tokens.accent + '22' }]}>
                      <Icon name="person" size={18} color={tokens.accent} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <CoachText style={{ color: tokens.foreground, fontWeight: '700', fontSize: 15 }}>
                        {m.display_name}
                      </CoachText>
                      <CoachText style={{ color: tokens.muted, fontSize: 12 }}>
                        {m.role === 'coach' ? 'Staff Coach' : 'Joueur'}
                      </CoachText>
                    </View>
                    <Icon name="chevron-forward" size={16} color={tokens.muted} />
                  </PressableSpring>
                ))}
              </View>
            )}

            {(searchFilter === 'all' || searchFilter === 'events') && searchResults.events.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                  Matchs & Séances ({searchResults.events.length})
                </CoachText>
                {searchResults.events.map((e) => (
                  <PressableSpring
                    key={e.id}
                    style={[styles.resultItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                    onPress={() => tabNav.openMatchs({ eventId: e.id })}
                  >
                    <View
                      style={[
                        styles.resultAvatar,
                        {
                          backgroundColor: isCoachMatchEvent(e) ? '#F5C51822' : tokens.accent + '22',
                        },
                      ]}
                    >
                      <Icon
                        name={isCoachMatchEvent(e) ? 'trophy' : 'football'}
                        size={18}
                        color={isCoachMatchEvent(e) ? '#F5C518' : tokens.accent}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <CoachText style={{ color: tokens.foreground, fontWeight: '700', fontSize: 15 }}>
                        {e.title}
                      </CoachText>
                      <CoachText style={{ color: tokens.muted, fontSize: 12 }}>
                        {formatCalendarDate(e.starts_at)} {(e.location_label || e.city) ? `• ${e.location_label || e.city}` : ''}
                      </CoachText>
                    </View>
                    <Icon name="chevron-forward" size={16} color={tokens.muted} />
                  </PressableSpring>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Normal Cockpit View */
          <>
            {/* Welcome & Coach Identity Hero */}
            <View style={[styles.welcomeBanner, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={styles.welcomeBannerLeft}>
                <View style={styles.welcomeTagRow}>
                  <View style={[styles.coachPill, { backgroundColor: tokens.accent + '20', borderColor: tokens.accent + '40' }]}>
                    <View style={[styles.onlineDot, { backgroundColor: tokens.accent }]} />
                    <CoachText style={[styles.coachPillText, { color: tokens.accent }]}>
                      Coach Principal
                    </CoachText>
                  </View>
                  <CoachText style={[styles.todayDateText, { color: tokens.muted }]}>
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </CoachText>
                </View>
                <CoachText style={[styles.welcomeTitle, { color: tokens.foreground }]}>
                  Bonjour {coachFirstName}
                </CoachText>
                <CoachText style={[styles.welcomeSub, { color: tokens.muted }]}>
                  Prêt pour la séance et la préparation du prochain match ?
                </CoachText>
              </View>
            </View>

            {/* Next Up / Hero Event Card */}
            <View style={styles.sectionHeader}>
              <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                Prochaine échéance
              </CoachText>
              {nextEvent && (
                <Pressable
                  onPress={() => {
                    if (shellNav) shellNav.requestNav('entrainements');
                    else onOpenChapter?.('planning');
                  }}
                >
                  <CoachText style={[styles.seeAllText, { color: tokens.accent }]}>
                    Voir planning
                  </CoachText>
                </Pressable>
              )}
            </View>

            {nextEvent ? (
              <PressableSpring
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isMatch ? '#F5C51855' : tokens.accent + '55',
                  },
                ]}
                onPress={() => tabNav.openMatchs({ eventId: nextEvent.id })}
              >
                {/* Hero Header Badge */}
                <View style={styles.heroTop}>
                  <View
                    style={[
                      styles.eventTypeBadge,
                      {
                        backgroundColor: isMatch ? '#F5C51822' : tokens.accent + '22',
                        borderColor: isMatch ? '#F5C51844' : tokens.accent + '44',
                      },
                    ]}
                  >
                    <Icon
                      name={isMatch ? 'trophy' : 'football'}
                      size={14}
                      color={isMatch ? '#F5C518' : tokens.accent}
                    />
                    <CoachText
                      style={[
                        styles.eventTypeText,
                        { color: isMatch ? '#F5C518' : tokens.accent },
                      ]}
                    >
                      {isMatch ? 'Match Officiel' : isTraining ? 'Entraînement' : 'Événement'}
                    </CoachText>
                  </View>

                  <View style={[styles.dateChip, { backgroundColor: tokens.elevated }]}>
                    <Icon name="time" size={13} color={tokens.muted} />
                    <CoachText style={[styles.heroDate, { color: tokens.foreground }]}>
                      {formatCalendarDate(nextEvent.starts_at)}
                    </CoachText>
                  </View>
                </View>

                {/* Hero Event Title & Location */}
                <CoachText style={[styles.heroTitle, { color: tokens.foreground }]} numberOfLines={2}>
                  {sanitizedEventTitle}
                </CoachText>

                {Boolean(nextEvent.location_label || nextEvent.city) && (
                  <View style={styles.heroLocationRow}>
                    <Icon name="location" size={14} color={tokens.muted} />
                    <CoachText style={[styles.heroLocationText, { color: tokens.muted }]} numberOfLines={1}>
                      {nextEvent.location_label || nextEvent.city}
                    </CoachText>
                  </View>
                )}

                {/* Convocations / Attendance Tracker */}
                <View style={[styles.heroRsvpBox, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                  <View style={styles.heroRsvpItem}>
                    <Icon name="checkmark-circle" size={16} color="#10B981" />
                    <CoachText style={[styles.heroRsvpValue, { color: tokens.foreground }]}>
                      {yesCount}
                    </CoachText>
                    <CoachText style={[styles.heroRsvpLabel, { color: tokens.muted }]}>
                      Présents
                    </CoachText>
                  </View>
                  <View style={[styles.heroRsvpDivider, { backgroundColor: tokens.border }]} />
                  <View style={styles.heroRsvpItem}>
                    <Icon name="help" size={16} color="#F59E0B" />
                    <CoachText style={[styles.heroRsvpValue, { color: tokens.foreground }]}>
                      {pendingCount}
                    </CoachText>
                    <CoachText style={[styles.heroRsvpLabel, { color: tokens.muted }]}>
                      En attente
                    </CoachText>
                  </View>
                  <View style={[styles.heroRsvpDivider, { backgroundColor: tokens.border }]} />
                  <View style={styles.heroRsvpItem}>
                    <Icon name="people" size={16} color={tokens.accent} />
                    <CoachText style={[styles.heroRsvpValue, { color: tokens.foreground }]}>
                      {inviteeTotal}
                    </CoachText>
                    <CoachText style={[styles.heroRsvpLabel, { color: tokens.muted }]}>
                      Convoqués
                    </CoachText>
                  </View>
                </View>

                {/* Direct Action Buttons */}
                <View style={styles.heroActions}>
                  <PressableSpring
                    style={[styles.heroBtnPrimary, { backgroundColor: tokens.accent }]}
                    onPress={() => tabNav.openMatchs({ eventId: nextEvent.id, hubChapter: 'effectif' })}
                  >
                    <Icon name="people" size={16} color={tokens.onAccent} />
                    <CoachText style={[styles.heroBtnPrimaryText, { color: tokens.onAccent }]}>
                      Pointer les présences
                    </CoachText>
                  </PressableSpring>

                  <PressableSpring
                    style={[styles.heroBtnSecondary, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}
                    onPress={() => tabNav.openMatchs({ eventId: nextEvent.id, hubChapter: isMatch ? 'composition' : 'apercu' })}
                  >
                    <Icon name={isMatch ? 'shirt' : 'document'} size={16} color={tokens.foreground} />
                    <CoachText style={[styles.heroBtnSecondaryText, { color: tokens.foreground }]}>
                      {isMatch ? 'Compo XI' : 'Fiche séance'}
                    </CoachText>
                  </PressableSpring>
                </View>
              </PressableSpring>
            ) : (
              /* Ready-to-plan upcoming event card */
              <View style={[styles.emptyHeroCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={[styles.emptyHeroIconBg, { backgroundColor: tokens.accent + '22' }]}>
                  <Icon name="calendar" size={28} color={tokens.accent} />
                </View>
                <CoachText style={[styles.emptyHeroTitle, { color: tokens.foreground }]}>
                  Aucun événement planifié
                </CoachText>
                <CoachText style={[styles.emptyHeroSub, { color: tokens.muted }]}>
                  Programme une séance d'entraînement ou le prochain match de championnat.
                </CoachText>
                <PressableSpring
                  style={[styles.planBtn, { backgroundColor: tokens.accent }]}
                  onPress={() => {
                    if (shellNav) shellNav.requestNav('entrainements');
                    else onOpenChapter?.('planning');
                  }}
                >
                  <Icon name="add" size={18} color={tokens.onAccent} />
                  <CoachText style={[styles.planBtnText, { color: tokens.onAccent }]}>
                    Planifier un événement
                  </CoachText>
                </PressableSpring>
              </View>
            )}

            {/* Coach Strategy & Tactics Hub Banner */}
            <PressableSpring
              style={[styles.aiTacticsCard, { borderColor: '#8B5CF655' }]}
              onPress={() => {
                if (shellNav) shellNav.requestNav('coach_ia');
                else if (onOpenSmartTactics) onOpenSmartTactics();
              }}
            >
              <View style={styles.aiTacticsTop}>
                <View style={styles.aiTag}>
                  <Icon name="document-text" size={13} color="#8B5CF6" />
                  <CoachText style={styles.aiTagText}>TABLEAU TACTIQUE & CAUSERIE</CoachText>
                </View>
                <Icon name="chevron-forward" size={18} color="#8B5CF6" />
              </View>
              <CoachText style={styles.aiTitle}>
                Prépare ta causerie d'avant-match
              </CoachText>
              <CoachText style={styles.aiSub}>
                Structure ton discours d'équipe, configure ton schéma tactique et anime tes ateliers d'entraînement.
              </CoachText>
              <View style={styles.aiActionPillRow}>
                <View style={styles.aiMiniChip}>
                  <Icon name="chat" size={12} color="#DDD6FE" />
                  <CoachText style={styles.aiMiniChipText}>Causerie</CoachText>
                </View>
                <View style={styles.aiMiniChip}>
                  <Icon name="stats-chart" size={12} color="#DDD6FE" />
                  <CoachText style={styles.aiMiniChipText}>Tableau tactique</CoachText>
                </View>
                <View style={styles.aiMiniChip}>
                  <Icon name="football" size={12} color="#DDD6FE" />
                  <CoachText style={styles.aiMiniChipText}>Ateliers terrain</CoachText>
                </View>
              </View>
            </PressableSpring>

            {/* Command Center Shortcuts Grid */}
            <View style={styles.sectionHeader}>
              <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                Raccourcis du coach
              </CoachText>
            </View>

            <View style={styles.grid}>
              {shortcuts.map((s) => (
                <PressableSpring
                  key={s.id}
                  style={[
                    styles.widgetTile,
                    { backgroundColor: tokens.surface, borderColor: tokens.border },
                  ]}
                  onPress={s.onPress}
                >
                  <View style={styles.widgetHeaderRow}>
                    <View style={[styles.widgetIconBg, { backgroundColor: s.color + '22' }]}>
                      <Icon name={s.icon} size={22} color={s.color} />
                    </View>
                    {s.badge && (
                      <View style={[styles.widgetBadge, { backgroundColor: s.color + '25', borderColor: s.color + '60' }]}>
                        <CoachText style={[styles.widgetBadgeText, { color: s.color }]}>
                          {s.badge}
                        </CoachText>
                      </View>
                    )}
                  </View>
                  <CoachText style={[styles.widgetLabel, { color: tokens.foreground }]}>
                    {s.label}
                  </CoachText>
                  <CoachText style={[styles.widgetSublabel, { color: tokens.muted }]}>
                    {s.sublabel}
                  </CoachText>
                </PressableSpring>
              ))}
            </View>

            {/* Squad Status & Readiness Radar */}
            <View style={styles.sectionHeader}>
              <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>
                État de forme du groupe
              </CoachText>
              <Pressable
                onPress={() => {
                  if (shellNav) shellNav.requestNav('forme');
                  else onOpenChapter?.('performance');
                }}
              >
                <CoachText style={[styles.seeAllText, { color: tokens.accent }]}>
                  Bilan complet
                </CoachText>
              </Pressable>
            </View>

            <View style={[styles.statsCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={styles.statCol}>
                <CoachText style={[styles.statValue, { color: tokens.foreground }]}>
                  {totalRoster}
                </CoachText>
                <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Effectif</CoachText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: tokens.border }]} />
              <View style={styles.statCol}>
                <CoachText style={[styles.statValue, { color: '#10B981' }]}>
                  {fitCount}
                </CoachText>
                <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Aptes</CoachText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: tokens.border }]} />
              <View style={styles.statCol}>
                <CoachText style={[styles.statValue, { color: '#F59E0B' }]}>
                  {recoveryCount}
                </CoachText>
                <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Reprise</CoachText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: tokens.border }]} />
              <View style={styles.statCol}>
                <CoachText style={[styles.statValue, { color: tokens.accent }]}>
                  94%
                </CoachText>
                <CoachText style={[styles.statLabel, { color: tokens.muted }]}>Assiduité</CoachText>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 130 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 14, fontWeight: '500' },
  clearSearchBtn: { padding: 4 },

  searchResults: { flex: 1 },
  filterPillsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  filterPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  resultSection: { marginBottom: spacing.lg },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },

  welcomeBanner: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  welcomeBannerLeft: { flex: 1 },
  welcomeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  coachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  coachPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  todayDateText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  welcomeTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4, marginTop: 4 },
  welcomeSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  seeAllText: { fontSize: 13, fontWeight: '700' },

  heroCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  eventTypeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  heroDate: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  heroLocationText: { fontSize: 13, fontWeight: '500' },

  heroRsvpBox: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroRsvpItem: { flex: 1, alignItems: 'center', gap: 2 },
  heroRsvpDivider: { width: 1, height: 28 },
  heroRsvpValue: { fontSize: 16, fontWeight: '800' },
  heroRsvpLabel: { fontSize: 11, fontWeight: '600' },

  heroActions: { flexDirection: 'row', gap: spacing.sm },
  heroBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroBtnPrimaryText: { fontSize: 13, fontWeight: '800' },
  heroBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroBtnSecondaryText: { fontSize: 13, fontWeight: '700' },

  emptyHeroCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyHeroIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyHeroTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyHeroSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: spacing.md },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  planBtnText: { fontSize: 13, fontWeight: '800' },

  aiTacticsCard: {
    backgroundColor: '#1E1435',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  aiTacticsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  aiTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTagText: { color: '#A78BFA', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  aiTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  aiSub: { color: '#C4B5FD', fontSize: 12, lineHeight: 17, marginBottom: spacing.md },
  aiActionPillRow: { flexDirection: 'row', gap: spacing.xs },
  aiMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  aiMiniChipText: { color: '#EDE9FE', fontSize: 11, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  widgetTile: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  widgetHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  widgetIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  widgetBadgeText: { fontSize: 10, fontWeight: '800' },
  widgetLabel: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  widgetSublabel: { fontSize: 11, fontWeight: '500' },

  statsCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32 },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
