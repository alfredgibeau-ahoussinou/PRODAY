import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useSeasonCalendar, useFriendlyMatches } from '../../hooks/useAppData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { teamEventsService } from '../../services/teamEvents.service';
import { calendarExportService } from '../../services/calendarExport.service';
import { clubSeasonLabelForDate, formatClubSeasonLabel } from '../../utils/clubSeason';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { playerType } from '../../theme/playerDesignSystem';
import { ProDayText } from '../../components/ui/ProDayText';
import { InteractiveListItem, PressableSpring, SkeletonList } from '../../components/motion';
import { CalendarMonthGrid } from '../../features/calendar/CalendarMonthGrid';
import { PlayerCalendarCard } from '../../components/player/PlayerCalendarCard';
import { MatchNextUpCard } from '../../components/matchs/MatchNextUpCard';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import { MatchConvocationsChapter } from '../../components/matchs/chapters/MatchConvocationsChapter';
import { MatchGeoMapPanel } from '../../components/matchs/MatchGeoMapPanel';
import { useMatchGeoMap } from '../../hooks/useMatchGeoMap';
import { MatchSeasonStatsPanel } from '../../components/matchs/MatchSeasonStatsPanel';
import type { TeamEvent, RsvpStatus } from '../../models/TeamEvent';
import type { SeasonCalendarItem } from '../../utils/seasonCalendar';
import type { CalendarKindFilter } from '../../content/matchChapters';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';

type ViewMode = 'list' | 'month';
type TimeFilter = 'upcoming' | 'past';
type SubView = 'calendar' | 'event_detail' | 'convocations' | 'map' | 'stats';

const KIND_FILTERS: { id: CalendarKindFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'Tout', icon: 'grid-outline' },
  { id: 'friendly_match', label: 'Matchs', icon: 'football-outline' },
  { id: 'team_event', label: 'Entraînements', icon: 'fitness-outline' },
  { id: 'competition_fixture', label: 'Compétitions', icon: 'trophy-outline' },
];

function formatDayHeader(date: Date): { label: string; isToday: boolean; isTomorrow: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isToday = target.getTime() === today.getTime();
  const isTomorrow = target.getTime() === tomorrow.getTime();

  if (isToday) return { label: "Aujourd'hui", isToday: true, isTomorrow: false };
  if (isTomorrow) return { label: 'Demain', isToday: false, isTomorrow: true };

  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return {
    label: formatted.charAt(0).toUpperCase() + formatted.slice(1),
    isToday: false,
    isTomorrow: false,
  };
}

export function PlayerCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const playerThemeCtx = usePlayerTheme();
  const playerTheme = usePlayerThemeColors();
  const accent = playerTheme.accent || PLAYER_DARK.accent;
  const navActions = useTabNavigationActions();
  const { openAuth } = useTabNavigation();

  const clubId = profile?.profile.club_id;
  const clubName = playerThemeCtx.clubName;
  const teamCategory = profile?.profile.category;

  const {
    items,
    events,
    loading: loadingCalendar,
    refresh: refreshCalendar,
  } = useSeasonCalendar(profile?.uid, clubId);

  const { matches, refresh: refreshMatches } = useFriendlyMatches();

  const [subView, setSubView] = useState<SubView>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [kindFilter, setKindFilter] = useState<CalendarKindFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);

  const season = formatClubSeasonLabel(clubSeasonLabelForDate(new Date()));

  const geo = useMatchGeoMap(profile, matches, events, items);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshCalendar(), refreshMatches()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCalendar, refreshMatches]);

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items.filter((item) => {
      const itemDate = new Date(item.starts_at);

      // Filtre Temporel
      if (timeFilter === 'upcoming' && itemDate < startOfToday) return false;
      if (timeFilter === 'past' && itemDate >= startOfToday) return false;

      // Filtre Type
      if (kindFilter !== 'all') {
        if (kindFilter === 'team_event' && item.kind !== 'team_event') return false;
        if (kindFilter === 'friendly_match' && item.kind !== 'friendly_match') return false;
        if (kindFilter === 'competition_fixture' && item.kind !== 'competition_fixture') return false;
      }

      return true;
    });
  }, [items, timeFilter, kindFilter]);

  const calendarTokens = useMemo(
    () => ({
      bg: PLAYER_DARK.bg,
      surface: PLAYER_DARK.surface,
      card: PLAYER_DARK.surface,
      border: 'rgba(255, 255, 255, 0.08)',
      text: PLAYER_DARK.text,
      muted: PLAYER_DARK.textMuted,
      accent,
      onAccent: '#000000',
    }),
    [accent],
  );

  // Prochain événement à venir (Hero Card)
  const nextItem = useMemo(() => {
    if (timeFilter !== 'upcoming' || selectedDate) return null;
    const now = new Date();
    return items.find((item) => new Date(item.starts_at) >= now) ?? null;
  }, [items, timeFilter, selectedDate]);

  const nextTeamEvent = useMemo(() => {
    if (!nextItem?.team_event_id) return null;
    return events.find((e) => e.id === nextItem.team_event_id) ?? null;
  }, [nextItem, events]);

  const nextRsvp = useMemo(() => {
    if (!nextTeamEvent || !profile) return null;
    return nextTeamEvent.rsvps?.[profile.uid] ?? null;
  }, [nextTeamEvent, profile]);

  // Convocations en attente
  const pendingConvocations = useMemo(() => {
    if (!profile) return [];
    return events.filter(
      (e) =>
        e.invitee_uids?.includes(profile.uid) &&
        (!e.rsvps?.[profile.uid] || e.rsvps[profile.uid] === 'pending'),
    );
  }, [events, profile]);

  // Groupement par jour pour la vue Liste
  const dayGroups = useMemo(() => {
    const map = new Map<string, SeasonCalendarItem[]>();
    for (const item of filteredEvents) {
      const d = item.starts_at;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    return [...map.entries()].map(([dateKey, groupItems]) => {
      const header = formatDayHeader(groupItems[0].starts_at);
      return {
        dateKey,
        header,
        items: groupItems,
      };
    });
  }, [filteredEvents]);



  const handleRsvp = async (eventId: string, status: RsvpStatus) => {
    if (!profile) return;
    setRsvpBusy(true);
    try {
      await teamEventsService.updateRsvp(eventId, profile.uid, status);
      prodayHaptics.rsvpConfirm();
      await refreshCalendar();
    } catch {
      prodayHaptics.error();
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleOpenItem = (item: SeasonCalendarItem) => {
    if (item.team_event_id) {
      setSelectedEventId(item.team_event_id);
      setSubView('event_detail');
    }
  };

  const handleTodayPress = () => {
    prodayHaptics.press();
    const today = new Date();
    setSelectedDate(today);
    setTimeFilter('upcoming');
  };

  // Sous-vues (Détail événement, Convocations, Carte, Statistiques)
  if (subView === 'event_detail' && selectedEventId) {
    return (
      <TeamEventDetailScreen
        eventId={selectedEventId}
        onBack={() => {
          setSubView('calendar');
          setSelectedEventId(null);
          void onRefresh();
        }}
      />
    );
  }

  if (subView === 'convocations') {
    return (
      <View style={[styles.subViewRoot, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.subViewHeader}>
          <TouchableOpacity
            onPress={() => setSubView('calendar')}
            style={styles.subViewBackBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={accent} />
            <ProDayText style={[styles.subViewBackText, { color: accent }]}>Calendrier</ProDayText>
          </TouchableOpacity>
          <ProDayText style={styles.subViewTitle}>Mes Convocations</ProDayText>
        </View>
        <MatchConvocationsChapter
          profile={profile}
          pendingConvocations={pendingConvocations}
          myUpcomingEvents={events.filter((e) => e.invitee_uids?.includes(profile?.uid ?? ''))}
          loadingCalendar={loadingCalendar}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpenEvent={(id) => {
            setSelectedEventId(id);
            setSubView('event_detail');
          }}
          onRsvp={handleRsvp}
          onLogin={() => openAuth('login')}
          rsvpBusy={rsvpBusy}
        />
      </View>
    );
  }

  if (subView === 'map') {
    return (
      <View style={[styles.subViewRoot, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.subViewHeader}>
          <TouchableOpacity
            onPress={() => setSubView('calendar')}
            style={styles.subViewBackBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={accent} />
            <ProDayText style={[styles.subViewBackText, { color: accent }]}>Calendrier</ProDayText>
          </TouchableOpacity>
          <ProDayText style={styles.subViewTitle}>Carte & Terrains</ProDayText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <MatchGeoMapPanel
            userLocation={geo.userLocation}
            markers={geo.allMarkers}
            density={geo.density}
            radiusKm={geo.radiusKm}
            onRadiusChange={geo.setRadiusKm}
            onRefreshLocation={() => void geo.refreshLocation()}
            locating={geo.locating}
            locError={geo.locError}
            onMarkerPress={(m) => {
              if (m.kind === 'event') {
                setSelectedEventId(m.entityId);
                setSubView('event_detail');
              }
            }}
            initialExpanded={true}
          />
        </ScrollView>
      </View>
    );
  }

  if (subView === 'stats') {
    return (
      <View style={[styles.subViewRoot, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.subViewHeader}>
          <TouchableOpacity
            onPress={() => setSubView('calendar')}
            style={styles.subViewBackBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={accent} />
            <ProDayText style={[styles.subViewBackText, { color: accent }]}>Calendrier</ProDayText>
          </TouchableOpacity>
          <ProDayText style={styles.subViewTitle}>Statistiques</ProDayText>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <MatchSeasonStatsPanel profile={profile} events={events} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        {/* 1. BRAND HEADER APPLE HIG */}
        <View style={styles.header}>
          <View style={styles.kickerRow}>
            <ProDayText style={[styles.kickerText, { color: accent }]}>
              {(clubName || 'FC PRODAY').toUpperCase()} · SAISON {season}
            </ProDayText>
          </View>

          <View style={styles.titleRow}>
            <ProDayText style={styles.titleText}>Calendrier</ProDayText>

            <PressableSpring onPress={handleTodayPress} scaleTo={0.95} haptic style={styles.todayBtn}>
              <Ionicons name="today-outline" size={13} color={accent} />
              <ProDayText style={[styles.todayBtnText, { color: accent }]}>Aujourd'hui</ProDayText>
            </PressableSpring>
          </View>

          <ProDayText style={styles.subtitleText}>
            {teamCategory ? `Équipe ${teamCategory}` : 'Mes matchs et séances'} ·{' '}
            {filteredEvents.length} rendez-vous
          </ProDayText>
        </View>

        {/* 2. RACCOURCIS APPLE CAPSULES */}
        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => setSubView('convocations')}
            scaleTo={0.97}
            haptic
            style={styles.shortcutPill}
          >
            <Ionicons name="mail" size={13} color={accent} />
            <ProDayText style={styles.shortcutLabel}>Convocs</ProDayText>
            {pendingConvocations.length > 0 ? (
              <View style={styles.shortcutBadge}>
                <ProDayText style={styles.shortcutBadgeText}>
                  {pendingConvocations.length}
                </ProDayText>
              </View>
            ) : null}
          </PressableSpring>

          <PressableSpring
            onPress={() => setSubView('map')}
            scaleTo={0.97}
            haptic
            style={styles.shortcutPill}
          >
            <Ionicons name="map" size={13} color={accent} />
            <ProDayText style={styles.shortcutLabel}>Carte & Terrains</ProDayText>
          </PressableSpring>

          <PressableSpring
            onPress={() => setSubView('stats')}
            scaleTo={0.97}
            haptic
            style={styles.shortcutPill}
          >
            <Ionicons name="trophy" size={13} color={accent} />
            <ProDayText style={styles.shortcutLabel}>Stats</ProDayText>
          </PressableSpring>
        </View>

        {/* 3. FILTRE TEMPOREL (À VENIR / PASSÉS) */}
        <View style={styles.controlsRow}>
          <View style={styles.timeFilterControl}>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setTimeFilter('upcoming');
                setSelectedDate(null);
              }}
              style={[styles.timeBtn, timeFilter === 'upcoming' && styles.timeBtnActive]}
              activeOpacity={0.7}
            >
              <ProDayText
                style={[
                  styles.timeText,
                  timeFilter === 'upcoming' ? styles.timeTextActive : styles.timeTextInactive,
                ]}
              >
                À venir
              </ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setTimeFilter('past');
                setSelectedDate(null);
              }}
              style={[styles.timeBtn, timeFilter === 'past' && styles.timeBtnActive]}
              activeOpacity={0.7}
            >
              <ProDayText
                style={[
                  styles.timeText,
                  timeFilter === 'past' ? styles.timeTextActive : styles.timeTextInactive,
                ]}
              >
                Passés
              </ProDayText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. CHIPS DE FILTRAGE PAR TYPE */}
        <View style={styles.filterChipRow}>
          {KIND_FILTERS.map((f) => {
            const isSelected = kindFilter === f.id;
            return (
              <PressableSpring
                key={f.id}
                onPress={() => {
                  prodayHaptics.press();
                  setKindFilter(f.id);
                }}
                scaleTo={0.95}
                haptic
                style={[styles.filterChip, isSelected ? styles.filterChipActive : styles.filterChipInactive]}
              >
                <Ionicons
                  name={f.icon}
                  size={12}
                  color={isSelected ? accent : PLAYER_DARK.textMuted}
                />
                <ProDayText
                  style={[
                    styles.filterChipLabel,
                    isSelected ? { color: PLAYER_DARK.text, fontWeight: '700' } : { color: PLAYER_DARK.textMuted },
                  ]}
                >
                  {f.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        {/* 5. HERO CARD (PROCHAIN MATCH / ENTRAÎNEMENT) */}
        {nextItem && timeFilter === 'upcoming' && !selectedDate ? (
          <InteractiveListItem index={0}>
            <MatchNextUpCard
              item={nextItem}
              onPress={() => handleOpenItem(nextItem)}
              onRsvp={nextTeamEvent ? (status) => handleRsvp(nextTeamEvent.id, status) : undefined}
              onOpenCarpool={
                nextItem.team_event_id
                  ? () => navActions.openCarpool({ chapter: 'reserver', eventId: nextItem.team_event_id })
                  : undefined
              }
              currentRsvp={nextRsvp}
              rsvpBusy={rsvpBusy}
            />
          </InteractiveListItem>
        ) : null}

        {/* 6. FONDATION CALENDRIER INTERACTIF (VUE MOIS PAR DÉFAUT & LISTE) */}
        {loadingCalendar ? (
          <SkeletonList count={4} variant="card" />
        ) : (
          <CalendarMonthGrid
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectEvent={handleOpenItem}
            defaultViewMode="month"
            tokens={calendarTokens}
            emptyMessage={
              timeFilter === 'past'
                ? 'Aucun événement passé'
                : 'Aucun match ou entraînement prévu'
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  subViewRoot: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  subViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  subViewBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subViewBackText: {
    ...playerType.caption,
    fontWeight: '700',
  },
  subViewTitle: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
  },
  header: {
    gap: 3,
    paddingTop: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kickerText: {
    ...playerType.micro,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    ...playerType.title,
    fontSize: 26,
    color: PLAYER_DARK.text,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  todayBtnText: {
    ...playerType.micro,
    fontWeight: '700',
  },
  subtitleText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shortcutLabel: {
    ...playerType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: PLAYER_DARK.text,
  },
  shortcutBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  shortcutBadgeText: {
    ...playerType.micro,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentText: {
    ...playerType.caption,
    fontSize: 12,
  },
  segmentTextInactive: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  timeFilterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeText: {
    ...playerType.caption,
    fontSize: 11.5,
  },
  timeTextInactive: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  timeTextActive: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  filterChipLabel: {
    ...playerType.micro,
    fontSize: 11.5,
  },
  monthCard: {
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    padding: 4,
  },
  monthNavTitle: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  weekDayText: {
    ...playerType.micro,
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emptyGridCell: {
    width: 38,
    height: 38,
    marginVertical: 2,
  },
  gridCell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gridCellToday: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gridCellText: {
    ...playerType.caption,
    fontSize: 12.5,
    color: PLAYER_DARK.text,
  },
  eventDotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotPlaceholder: {
    height: 4,
    marginTop: 2,
  },
  selectedDateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  selectedDateText: {
    ...playerType.caption,
    fontSize: 11.5,
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  clearDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearDateText: {
    ...playerType.micro,
    color: PLAYER_DARK.textMuted,
  },
  emptyCard: {
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...playerType.headline,
    fontSize: 16,
    color: PLAYER_DARK.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyActionText: {
    ...playerType.caption,
    fontWeight: '700',
  },
  dayGroupSection: {
    gap: 8,
    marginTop: 6,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  dayGroupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PLAYER_DARK.textMuted,
  },
  dayGroupTitle: {
    ...playerType.headline,
    fontSize: 14,
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  dayGroupList: {
    gap: 4,
  },
});
