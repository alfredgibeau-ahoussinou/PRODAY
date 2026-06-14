import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import type { TeamEvent, RsvpStatus } from '../../models/TeamEvent';
import type { MatchChapterId, CalendarKindFilter, AmicauxStatusFilter } from '../../content/matchChapters';
import {
  CALENDAR_KIND_FILTERS,
  AMICAUX_STATUS_FILTERS,
} from '../../content/matchChapters';
import {
  groupByMonth,
  formatCalendarDate,
  type SeasonCalendarItem,
} from '../../utils/seasonCalendar';
import {
  filterCalendarItems,
  filterFriendlyMatches,
  countWeekEvents,
} from '../../utils/matchFilters';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { Icon } from '../ui/Icon';
import { SearchBar } from '../ui/SearchBar';
import { AppTabHeader, AppStatChips } from '../app';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { MatchPager } from './MatchPager';
import { MatchCalendarCard } from './MatchCalendarCard';
import { MatchFriendlyCard } from './MatchFriendlyCard';
import { MatchNextUpCard } from './MatchNextUpCard';
import { MatchWeekStrip } from './MatchWeekStrip';
import { MatchConvocationCard } from './MatchConvocationCard';
import { MatchCenterPanel } from './MatchCenterPanel';
import { MatchSeasonStatsPanel } from './MatchSeasonStatsPanel';
import { isInMatchWindow } from '../../utils/matchLive';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { ProDayActionTiles } from '../ui/ProDayActionTiles';
import { ProDaySelect } from '../ui/ProDaySelect';
import { SkeletonList, InteractiveListItem, PressableSpring } from '../motion';
import { OfflineCacheBanner } from '../ui/OfflineCacheBanner';
import { spacing, radius } from '../../theme/designTokens';
import { V3TabShell } from '../v3/V3TabShell';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import { isV3ShellEnabled } from '../../config/featureFlags';

interface MatchHomeScreenProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  teamEvents: TeamEvent[];
  matches: FriendlyMatch[];
  pendingConvocations: TeamEvent[];
  myUpcomingEvents: TeamEvent[];
  nextItem: SeasonCalendarItem | null;
  loadingCalendar: boolean;
  loadingMatches: boolean;
  fromCache?: boolean;
  canManageEvents: boolean;
  myClubId: string | null;
  initialChapter?: MatchChapterId;
  rsvpBusy?: boolean;
  canAccept: (m: FriendlyMatch) => boolean;
  onPropose: () => void;
  onSearch: () => void;
  onCreateEvent: () => void;
  onOpenCalendarItem: (item: SeasonCalendarItem) => void;
  onOpenEvent: (eventId: string, hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif') => void;
  onRsvp: (eventId: string, status: RsvpStatus) => void;
  onAcceptMatch: (m: FriendlyMatch) => void;
  onCancelMatch: (m: FriendlyMatch) => void;
  onMarkPlayed: (m: FriendlyMatch) => void;
  onRefresh: () => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  intelligence?: SectionIntelligence | null;
  getMatchIaScore?: (matchId: string) => number | undefined;
  getMatchHealthWarning?: (matchId: string) => string | undefined;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

function calendarLinkLabel(item: SeasonCalendarItem): string {
  if (item.team_event_id) return 'Voir convocation';
  if (item.friendly_match_id) return 'Voir match amical';
  return 'Ouvrir';
}

function calendarKindLabel(item: SeasonCalendarItem): string {
  if (item.kind === 'team_event' && item.event_type) {
    return EVENT_TYPE_LABELS[item.event_type];
  }
  if (item.kind === 'friendly_match') return 'Match amical';
  return 'Événement';
}

export const MatchHomeScreen: React.FC<MatchHomeScreenProps> = ({
  profile,
  items,
  teamEvents,
  matches,
  pendingConvocations,
  myUpcomingEvents,
  nextItem,
  loadingCalendar,
  loadingMatches,
  fromCache = false,
  canManageEvents,
  myClubId,
  initialChapter = 'calendrier',
  rsvpBusy,
  canAccept,
  onPropose,
  onSearch,
  onCreateEvent,
  onOpenCalendarItem,
  onOpenEvent,
  onRsvp,
  onAcceptMatch,
  onCancelMatch,
  onMarkPlayed,
  onRefresh,
  onOpenCarpoolForEvent,
  intelligence,
  getMatchIaScore,
  getMatchHealthWarning,
}) => {
  const { colors } = useAppTheme();
  const useV3Header = isV3ShellEnabled() && Boolean(profile);
  const { openAuth } = useTabNavigation();
  const [chapter, setChapter] = useState<MatchChapterId>(initialChapter);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarKind, setCalendarKind] = useState<CalendarKindFilter>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [amicauxSearch, setAmicauxSearch] = useState('');
  const [amicauxStatus, setAmicauxStatus] = useState<AmicauxStatusFilter>('all');

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);

  const weekDays = useMemo(() => countWeekEvents(items), [items]);
  const openMatchesCount = matches.filter((m) => m.status === 'OPEN').length;
  const liveMatchCount = useMemo(
    () => teamEvents.filter((e) => isInMatchWindow(e)).length,
    [teamEvents]
  );

  const filteredCalendar = useMemo(() => {
    let list = filterCalendarItems(items, {
      search: calendarSearch,
      kind: calendarKind,
      upcomingOnly: true,
    });
    if (selectedDay) {
      const start = new Date(selectedDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      list = list.filter((item) => item.starts_at >= start && item.starts_at < end);
    }
    return list;
  }, [items, calendarSearch, calendarKind, selectedDay]);

  const monthGroups = useMemo(() => groupByMonth(filteredCalendar), [filteredCalendar]);

  const staggeredCalendarGroups = useMemo(() => {
    let index = 0;
    return monthGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ item, staggerIndex: index++ })),
    }));
  }, [monthGroups]);

  const filteredMatches = useMemo(
    () =>
      filterFriendlyMatches(matches, {
        status: amicauxStatus,
        search: amicauxSearch,
        myClubId,
      }),
    [matches, amicauxStatus, amicauxSearch, myClubId]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 400);
  };

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  const quickActions = useMemo(() => {
    const actions: {
      id: string;
      label: string;
      icon: 'calendar' | 'football' | 'football-outline' | 'search' | 'trophy';
      onPress: () => void;
    }[] = [];
    if (canManageEvents) {
      actions.push({ id: 'event', label: 'Convocation', icon: 'calendar', onPress: onCreateEvent });
    }
    actions.push({
      id: 'centre',
      label: 'Centre',
      icon: 'football-outline',
      onPress: () => setChapter('centre'),
    });
    actions.push({ id: 'propose', label: 'Proposer', icon: 'football', onPress: onPropose });
    actions.push({ id: 'search', label: 'Rechercher', icon: 'search', onPress: onSearch });
    return actions;
  }, [canManageEvents, onCreateEvent, onPropose, onSearch]);

  const handleDaySelect = (date: Date) => {
    setSelectedDay((prev) =>
      prev && prev.toDateString() === date.toDateString() ? null : date
    );
  };

  const pages = useMemo(
    () => [
      {
        id: 'calendrier' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            <ProDayText variant="eyebrow" accent style={styles.pageLead}>
              Votre saison
            </ProDayText>
            <ProDayText variant="body" muted style={styles.pageSub}>
              Convocations, entraînements, détections et tournois.
            </ProDayText>

            {nextItem ? (
              <InteractiveListItem index={0}>
                <MatchNextUpCard
                  item={nextItem}
                  onPress={() => onOpenCalendarItem(nextItem)}
                />
              </InteractiveListItem>
            ) : null}

            <MatchWeekStrip
              days={weekDays}
              selectedDate={selectedDay}
              onSelectDay={handleDaySelect}
            />

            <SearchBar
              placeholder="Rechercher un événement…"
              value={calendarSearch}
              onChangeText={setCalendarSearch}
            />
            <ProDaySelect<CalendarKindFilter>
              label="Type d'événement"
              placeholder="Tout"
              options={CALENDAR_KIND_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
              value={calendarKind}
              onChange={setCalendarKind}
              inset={false}
            />

            {loadingCalendar ? (
              <SkeletonList count={4} variant="card" />
            ) : filteredCalendar.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="calendar" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucun événement</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  {!profile
                    ? 'Connectez-vous pour voir votre calendrier club et vos convocations.'
                    : items.length > 0
                      ? 'Aucun résultat pour ces filtres.'
                      : 'Créez une convocation ou proposez un match amical.'}
                </ProDayText>
                {!profile ? (
                  <PressableSpring onPress={() => openAuth('login')} scaleTo={0.96} haptic>
                    <ProDayGradient kind="cta" style={styles.emptyCta}>
                      <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                        Se connecter
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                ) : items.length === 0 ? (
                  <PressableSpring onPress={onPropose} scaleTo={0.96} haptic>
                    <ProDayGradient kind="cta" style={styles.emptyCta}>
                      <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                        Proposer un match
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                ) : null}
              </ProDaySurface>
            ) : (
              staggeredCalendarGroups.map((group) => (
                <View key={group.key} style={styles.monthBlock}>
                  <ProDayText variant="eyebrow" accent style={styles.monthTitle}>
                    {group.label}
                  </ProDayText>
                  {group.items.map(({ item, staggerIndex }) => (
                    <InteractiveListItem key={item.id} index={staggerIndex}>
                      <MatchCalendarCard
                        kindLabel={calendarKindLabel(item)}
                        dateLabel={formatCalendarDate(item.starts_at)}
                        title={item.title}
                        subtitle={item.subtitle}
                        city={item.city}
                        linkLabel={`${calendarLinkLabel(item)} →`}
                        onPress={() => onOpenCalendarItem(item)}
                      />
                    </InteractiveListItem>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        ),
      },
      {
        id: 'centre' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            {loadingCalendar ? (
              <SkeletonList count={3} variant="card" />
            ) : (
              <MatchCenterPanel
                events={teamEvents}
                onOpenEvent={(id) => {
                  const ev = teamEvents.find((e) => e.id === id);
                  onOpenEvent(id, ev && isInMatchWindow(ev) ? 'live' : 'apercu');
                }}
              />
            )}
          </ScrollView>
        ),
      },
      {
        id: 'stats' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            <MatchSeasonStatsPanel profile={profile} events={teamEvents} />
          </ScrollView>
        ),
      },
      {
        id: 'convocations' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            <ProDayText variant="eyebrow" accent style={styles.pageLead}>
              Convocations
            </ProDayText>
            <ProDayText variant="body" muted style={styles.pageSub}>
              Répondez aux invitations et suivez vos présences.
            </ProDayText>

            {pendingConvocations.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <ProDayText variant="eyebrow" accent>
                    À répondre
                  </ProDayText>
                  <View style={[styles.countPill, { backgroundColor: colors.accent }]}>
                    <ProDayText variant="caption" inverse style={styles.countText}>
                      {pendingConvocations.length}
                    </ProDayText>
                  </View>
                </View>
                {pendingConvocations.map((event, index) => (
                  <InteractiveListItem key={event.id} index={index}>
                    <MatchConvocationCard
                      event={event}
                      profileUid={profile?.uid ?? ''}
                      pending
                      onOpen={() => onOpenEvent(event.id)}
                      onRsvp={(status) => onRsvp(event.id, status)}
                      rsvpBusy={rsvpBusy}
                      onOpenCarpool={
                        onOpenCarpoolForEvent
                          ? () => onOpenCarpoolForEvent(event.id)
                          : undefined
                      }
                    />
                  </InteractiveListItem>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <ProDayText variant="eyebrow" accent style={styles.sectionTitle}>
                Mes prochains événements
              </ProDayText>
              {loadingCalendar ? (
                <SkeletonList count={3} variant="card" />
              ) : myUpcomingEvents.length === 0 ? (
                <ProDaySurface variant="module" style={styles.empty}>
                  <Icon
                    name={profile ? 'checkmark-circle' : 'mail'}
                    size={32}
                    color={colors.textMuted}
                  />
                  <ProDayText variant="section">
                    {profile ? 'Tout est à jour' : 'Convocations'}
                  </ProDayText>
                  <ProDayText variant="body" muted style={styles.emptySub}>
                    {profile
                      ? 'Aucune convocation en attente ni événement confirmé.'
                      : 'Connectez-vous pour répondre aux invitations de votre club.'}
                  </ProDayText>
                  {!profile ? (
                    <PressableSpring onPress={() => openAuth('login')} scaleTo={0.96} haptic>
                      <ProDayGradient kind="cta" style={styles.emptyCta}>
                        <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                          Se connecter
                        </ProDayText>
                      </ProDayGradient>
                    </PressableSpring>
                  ) : null}
                </ProDaySurface>
              ) : (
                myUpcomingEvents.map((event, index) => (
                  <InteractiveListItem key={event.id} index={index}>
                    <MatchConvocationCard
                      event={event}
                      profileUid={profile?.uid ?? ''}
                      onOpen={() => onOpenEvent(event.id)}
                      onOpenCarpool={
                        onOpenCarpoolForEvent
                          ? () => onOpenCarpoolForEvent(event.id)
                          : undefined
                      }
                    />
                  </InteractiveListItem>
                ))
              )}
            </View>
          </ScrollView>
        ),
      },
      {
        id: 'amicaux' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            <ProDayText variant="eyebrow" accent style={styles.pageLead}>
              Matchs amicaux
            </ProDayText>
            <ProDayText variant="body" muted style={styles.pageSub}>
              Proposez, acceptez ou suivez vos rencontres entre clubs.
            </ProDayText>

            <SearchBar
              placeholder="Club, ville, niveau…"
              value={amicauxSearch}
              onChangeText={setAmicauxSearch}
            />
            <ProDaySelect<AmicauxStatusFilter>
              label="Statut"
              placeholder="Tous"
              options={AMICAUX_STATUS_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
              value={amicauxStatus}
              onChange={setAmicauxStatus}
              inset={false}
            />

            {loadingMatches ? (
              <SkeletonList count={3} variant="card" />
            ) : filteredMatches.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="handshake" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucun match</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  {matches.length > 0
                    ? 'Aucun résultat pour ces filtres.'
                    : 'Proposez ou recherchez un match amical près de chez vous.'}
                </ProDayText>
                {matches.length === 0 ? (
                  <View style={styles.emptyActions}>
                    <PressableSpring onPress={onPropose} scaleTo={0.96} haptic>
                      <ProDayGradient kind="cta" style={styles.emptyCta}>
                        <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                          Proposer
                        </ProDayText>
                      </ProDayGradient>
                    </PressableSpring>
                    <PressableSpring
                      style={[
                        styles.emptyCtaGhost,
                        { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
                      ]}
                      onPress={onSearch}
                      scaleTo={0.96}
                      haptic
                    >
                      <ProDayText variant="caption" accent style={styles.emptyCtaText}>
                        Rechercher
                      </ProDayText>
                    </PressableSpring>
                  </View>
                ) : null}
              </ProDaySurface>
            ) : (
              filteredMatches.map((m, index) => {
                const isMine =
                  myClubId != null &&
                  (m.requester_club_id === myClubId || m.opponent_club_id === myClubId);
                const showAccept = canAccept(m) && !isMine && Boolean(profile);
                return (
                  <InteractiveListItem key={m.id} index={index}>
                    <MatchFriendlyCard
                      match={m}
                      isMine={isMine}
                      showAccept={showAccept}
                      iaScore={getMatchIaScore?.(m.id)}
                      healthWarning={getMatchHealthWarning?.(m.id)}
                      onAccept={() => onAcceptMatch(m)}
                      onCancel={() => onCancelMatch(m)}
                      onMarkPlayed={() => onMarkPlayed(m)}
                    />
                  </InteractiveListItem>
                );
              })
            )}
          </ScrollView>
        ),
      },
    ],
    [
      colors,
      loadingCalendar,
      items,
      filteredCalendar,
      staggeredCalendarGroups,
      nextItem,
      weekDays,
      selectedDay,
      calendarSearch,
      calendarKind,
      pendingConvocations,
      myUpcomingEvents,
      profile,
      rsvpBusy,
      loadingMatches,
      filteredMatches,
      matches.length,
      myClubId,
      canAccept,
      onOpenCalendarItem,
      onOpenEvent,
      onRsvp,
      onPropose,
      onSearch,
      onAcceptMatch,
      onCancelMatch,
      onMarkPlayed,
      refreshing,
      teamEvents,
      liveMatchCount,
      getMatchIaScore,
      getMatchHealthWarning,
    ]
  );

  const body = (
    <>
      <OfflineCacheBanner visible={fromCache} onRefresh={onRefresh} />

      <View style={[styles.actionsBand, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <ProDayText variant="eyebrow" accent style={styles.actionsLabel}>
          Actions rapides
        </ProDayText>
        <ProDayActionTiles
          items={quickActions.map((action) => ({
            id: action.id,
            label: action.label,
            icon: action.icon,
          }))}
          onPress={(id) => quickActions.find((a) => a.id === id)?.onPress()}
          inset={false}
        />
      </View>

      <MatchPager
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        amicauxBadge={openMatchesCount}
        convocationsBadge={pendingConvocations.length}
        centreBadge={liveMatchCount > 0 ? 'LIVE' : undefined}
      />
    </>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption="Saison"
        title="Matchs"
        subtitle="Calendrier, scores live et convocations."
        flat
        intelligence={intelligence}
        stats={[
          { value: String(items.length), label: 'Événements' },
          {
            value: String(liveMatchCount),
            label: 'En direct',
            highlight: liveMatchCount > 0,
          },
          {
            value: String(pendingConvocations.length),
            label: 'À répondre',
            highlight: pendingConvocations.length > 0,
          },
        ]}
      >
        {body}
      </V3TabShell>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader
        caption="Saison"
        title="Matchs"
        subtitle="Calendrier, scores live et convocations."
        footer={
          <AppStatChips
            items={[
              { value: items.length, label: 'Événements' },
              { value: liveMatchCount, label: 'En direct', highlight: liveMatchCount > 0 },
              {
                value: pendingConvocations.length,
                label: 'À répondre',
                highlight: pendingConvocations.length > 0,
              },
            ]}
          />
        }
      />

      {body}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  actionsBand: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  actionsLabel: { marginBottom: 2 },
  pageLead: { marginBottom: 4 },
  pageSub: { marginBottom: spacing.lg },
  monthBlock: { marginBottom: spacing.lg },
  monthTitle: {
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  section: { marginBottom: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { marginBottom: spacing.sm },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontWeight: '900', fontSize: 11 },
  loader: { marginVertical: spacing.xl },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptySub: { textAlign: 'center' },
  emptyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyCta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyCtaGhost: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  emptyCtaText: { fontWeight: '800' },
});
