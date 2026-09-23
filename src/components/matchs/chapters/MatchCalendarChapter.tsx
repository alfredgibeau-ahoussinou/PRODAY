import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../../models/User';
import type { CalendarKindFilter } from '../../../content/matchChapters';
import {
  formatCalendarDate,
  type SeasonCalendarItem,
} from '../../../utils/seasonCalendar';
import { EVENT_TYPE_LABELS, type TeamEvent, type RsvpStatus } from '../../../models/TeamEvent';
import { ProDayText } from '../../ui/ProDayText';
import { MatchCalendarCard } from '../MatchCalendarCard';
import { MatchNextUpCard } from '../MatchNextUpCard';
import { SkeletonList, InteractiveListItem, PressableSpring } from '../../motion';
import { useTranslation } from '../../../context/LocaleContext';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import { useMatchSkinTokens } from '../matchCenterUi';
import { calendarExportService } from '../../../services/calendarExport.service';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { FffMatchupCard } from '../FffMatchupCard';
import { PLAYER_DARK } from '../../../theme/playerDarkPremium';
import { playerType } from '../../../theme/playerDesignSystem';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

type ViewMode = 'list' | 'month';
type TimeFilter = 'upcoming' | 'past';

type DayGroup = {
  dateKey: string;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  items: SeasonCalendarItem[];
};

function formatDayGroupLabel(date: Date): { label: string; isToday: boolean; isTomorrow: boolean } {
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

function groupItemsByDay(items: SeasonCalendarItem[]): DayGroup[] {
  const map = new Map<string, SeasonCalendarItem[]>();
  for (const item of items) {
    const d = item.starts_at;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return [...map.entries()].map(([dateKey, groupItems]) => {
    const firstDate = groupItems[0].starts_at;
    const { label, isToday, isTomorrow } = formatDayGroupLabel(firstDate);
    return {
      dateKey,
      label,
      isToday,
      isTomorrow,
      items: groupItems,
    };
  });
}

function calendarKindLabel(item: SeasonCalendarItem, t: (key: string) => string): string {
  if (item.kind === 'team_event' && item.event_type) {
    return EVENT_TYPE_LABELS[item.event_type];
  }
  if (item.kind === 'friendly_match') return t('matchs.calendar.kind.friendly');
  return t('match.event.default');
}

const CALENDAR_KIND_META: Record<
  CalendarKindFilter,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  all: { label: 'Tout', icon: 'grid-outline' },
  team_event: { label: 'Convocs', icon: 'shirt-outline' },
  friendly_match: { label: 'Matchs', icon: 'football-outline' },
  competition_fixture: { label: 'Compétitions', icon: 'trophy-outline' },
};

import { clubSeasonLabelForDate, formatClubSeasonLabel } from '../../../utils/clubSeason';
import type { MatchChapterId } from '../../../content/matchChapters';

export interface MatchCalendarChapterProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  nextItem: SeasonCalendarItem | null;
  teamEvents?: TeamEvent[];
  pendingConvocations?: TeamEvent[];
  weekDays?: { date: Date; count: number; isToday: boolean }[];
  selectedDay: Date | null;
  onSelectDay: (date: Date | null) => void;
  calendarSearch: string;
  onCalendarSearchChange: (value: string) => void;
  calendarKind: CalendarKindFilter;
  onCalendarKindChange: (value: CalendarKindFilter) => void;
  loadingCalendar: boolean;
  filteredCalendar: SeasonCalendarItem[];
  staggeredCalendarGroups: { key: string; label: string; items: { item: SeasonCalendarItem; staggerIndex: number }[] }[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCalendarItem: (item: SeasonCalendarItem) => void;
  onPropose: () => void;
  onLogin: () => void;
  canManageEvents?: boolean;
  geoMap?: React.ReactNode;
  livePanel?: React.ReactNode;
  pendingConvocationsCount?: number;
  onOpenConvocations?: () => void;
  onNavigateChapter?: (chapter: MatchChapterId) => void;
  clubName?: string;
  teamName?: string;
  onRsvp?: (eventId: string, status: RsvpStatus) => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  rsvpBusy?: boolean;
}

export const MatchCalendarChapter: React.FC<MatchCalendarChapterProps> = ({
  profile,
  nextItem,
  teamEvents = [],
  pendingConvocations = [],
  selectedDay,
  onSelectDay,
  calendarSearch,
  onCalendarSearchChange,
  calendarKind,
  onCalendarKindChange,
  loadingCalendar,
  filteredCalendar,
  refreshing,
  onRefresh,
  onOpenCalendarItem,
  onPropose,
  onLogin,
  canManageEvents = false,
  pendingConvocationsCount = 0,
  onOpenConvocations,
  onNavigateChapter,
  clubName,
  teamName,
  onRsvp,
  onOpenCarpoolForEvent,
  rsvpBusy = false,
  livePanel,
}) => {
  const skin = useMatchSkinTokens();
  const { t } = useTranslation();
  const season = formatClubSeasonLabel(clubSeasonLabelForDate(new Date()));

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [monthCursor, setMonthCursor] = useState(() => new Date());

  const isFiltered = Boolean(selectedDay || calendarSearch || calendarKind !== 'all' || timeFilter !== 'upcoming');

  // Filtrage temporel (À venir vs Passés)
  const timeFilteredItems = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return filteredCalendar.filter((item) => {
      const itemDate = new Date(item.starts_at);
      if (timeFilter === 'upcoming') {
        return itemDate >= startOfToday;
      }
      return itemDate < startOfToday;
    });
  }, [filteredCalendar, timeFilter]);

  // Groupement par jour pour la vue Liste
  const dayGroups = useMemo(() => groupItemsByDay(timeFilteredItems), [timeFilteredItems]);

  // Calcul du calendrier mensuel
  const monthGridData = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 0 = Dimanche, 1 = Lundi, etc. (En France: Lundi = 0)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const totalSlots = Math.ceil((startDay + daysInMonth) / 7) * 7;

    const todayStr = new Date().toDateString();
    const selectedDayStr = selectedDay?.toDateString() ?? null;

    const cells: {
      dayNumber: number | null;
      date: Date | null;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      eventsCount: number;
    }[] = [];

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - startDay + 1;
      if (dayNum > 0 && dayNum <= daysInMonth) {
        const date = new Date(year, month, dayNum);
        const dateStr = date.toDateString();
        const count = filteredCalendar.filter((item) => item.starts_at.toDateString() === dateStr).length;

        cells.push({
          dayNumber: dayNum,
          date,
          isCurrentMonth: true,
          isToday: dateStr === todayStr,
          isSelected: selectedDayStr === dateStr,
          eventsCount: count,
        });
      } else {
        cells.push({
          dayNumber: null,
          date: null,
          isCurrentMonth: false,
          isToday: false,
          isSelected: false,
          eventsCount: 0,
        });
      }
    }

    return cells;
  }, [monthCursor, selectedDay, filteredCalendar]);

  const monthLabel = useMemo(() => {
    const str = monthCursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [monthCursor]);

  const nextTeamEvent = useMemo(() => {
    if (!nextItem?.team_event_id) return null;
    return teamEvents.find((e) => e.id === nextItem.team_event_id) ?? null;
  }, [nextItem, teamEvents]);

  const currentUserRsvp = useMemo(() => {
    if (!nextTeamEvent || !profile) return null;
    return nextTeamEvent.rsvps?.[profile.uid] ?? null;
  }, [nextTeamEvent, profile]);

  const mobilizationStats = useMemo(() => {
    if (!nextTeamEvent || !nextTeamEvent.invitee_uids || nextTeamEvent.invitee_uids.length === 0) {
      return null;
    }
    const total = nextTeamEvent.invitee_uids.length;
    const confirmed = nextTeamEvent.invitee_uids.filter((uid) => nextTeamEvent.rsvps?.[uid] === 'yes').length;
    const declined = nextTeamEvent.invitee_uids.filter((uid) => nextTeamEvent.rsvps?.[uid] === 'no').length;
    const pending = total - confirmed - declined;
    const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, declined, pending, pct };
  }, [nextTeamEvent]);

  const handleNextItemRsvp = (status: RsvpStatus) => {
    if (nextTeamEvent && onRsvp) {
      onRsvp(nextTeamEvent.id, status);
    } else if (onOpenConvocations) {
      onOpenConvocations();
    }
  };

  const handleNextItemCarpool = () => {
    if (nextItem?.team_event_id && onOpenCarpoolForEvent) {
      onOpenCarpoolForEvent(nextItem.team_event_id);
    }
  };

  const handleTodayPress = () => {
    prodayHaptics.press();
    setMonthCursor(new Date());
    onSelectDay(new Date());
  };

  const emptyTitle = selectedDay
    ? 'Aucun événement à cette date'
    : isFiltered
      ? 'Aucun résultat correspondant'
      : timeFilter === 'past'
        ? 'Aucun événement passé'
        : 'Aucun match ou entraînement';

  const emptySubtitle = isFiltered
    ? 'Modifiez vos critères de recherche ou réinitialisez les filtres.'
    : canManageEvents
      ? 'Planifiez une rencontre amicale ou convoquez le groupe pour la prochaine séance.'
      : 'Les prochaines convocations et affiches officielles de votre équipe apparaîtront ici.';

  const emptyCtaLabel = !profile
    ? t('matchs.calendar.cta.login')
    : canManageEvents
      ? '+ Proposer un événement'
      : pendingConvocationsCount > 0
        ? `Voir mes convocations (${pendingConvocationsCount})`
        : isFiltered
          ? 'Réinitialiser les filtres'
          : 'Actualiser le calendrier';

  const handleEmptyCta = () => {
    if (!profile) {
      onLogin();
    } else if (canManageEvents) {
      onPropose();
    } else if (pendingConvocationsCount > 0 && onOpenConvocations) {
      onOpenConvocations();
    } else if (isFiltered) {
      onCalendarKindChange('all');
      onCalendarSearchChange('');
      setTimeFilter('upcoming');
      onSelectDay(null);
    } else {
      onRefresh();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={skin.accent} />
      }
      {...scrollProps}
    >
      {/* 1. EN-TÊTE ÉPURÉ APPLE HIG (TITRE, SAISON, ACTION AUJOURD'HUI) */}
      <View style={styles.brandHeader}>
        <View style={styles.kickerRow}>
          <ProDayText style={[styles.kickerText, { color: skin.accent }]}>
            {(clubName || 'FC PRODAY').toUpperCase()} · SAISON {season}
          </ProDayText>
        </View>

        <View style={styles.brandTitleRow}>
          <ProDayText style={styles.brandTitle}>Calendrier</ProDayText>

          <PressableSpring
            onPress={handleTodayPress}
            scaleTo={0.95}
            haptic
            style={styles.todayButton}
          >
            <Ionicons name="today-outline" size={13} color={skin.accent} />
            <ProDayText style={[styles.todayButtonText, { color: skin.accent }]}>
              Aujourd'hui
            </ProDayText>
          </PressableSpring>
        </View>

        <ProDayText style={styles.brandSubtitle}>
          {teamName || 'Mes matchs et séances'} · {timeFilteredItems.length} rendez-vous
        </ProDayText>
      </View>

      {/* 2. RACCOURCIS COMPACTS (CONVOCS, TERRAINS, STATS) */}
      <View style={styles.shortcutRow}>
        <PressableSpring
          onPress={() => {
            if (onOpenConvocations) onOpenConvocations();
            else if (onNavigateChapter) onNavigateChapter('convocations');
          }}
          scaleTo={0.97}
          haptic
          style={styles.shortcutChip}
        >
          <Ionicons name="mail" size={13} color={skin.accent} />
          <ProDayText style={styles.shortcutLabel}>Convocs</ProDayText>
          {pendingConvocationsCount > 0 ? (
            <View style={styles.shortcutBadge}>
              <ProDayText style={styles.shortcutBadgeText}>
                {pendingConvocationsCount}
              </ProDayText>
            </View>
          ) : null}
        </PressableSpring>

        <PressableSpring
          onPress={() => {
            if (onNavigateChapter) onNavigateChapter('centre');
          }}
          scaleTo={0.97}
          haptic
          style={styles.shortcutChip}
        >
          <Ionicons name="map" size={13} color={skin.accent} />
          <ProDayText style={styles.shortcutLabel}>Carte & Terrains</ProDayText>
        </PressableSpring>

        <PressableSpring
          onPress={() => {
            if (onNavigateChapter) onNavigateChapter('stats');
          }}
          scaleTo={0.97}
          haptic
          style={styles.shortcutChip}
        >
          <Ionicons name="trophy" size={13} color={skin.accent} />
          <ProDayText style={styles.shortcutLabel}>Stats</ProDayText>
        </PressableSpring>
      </View>

      {/* 3. CONTRÔLES DE VUE (LISTE | MOIS) & FILTRE TEMPOREL (À VENIR | PASSÉS) */}
      <View style={styles.viewSwitchRow}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.press();
              setViewMode('list');
            }}
            style={[styles.segmentTab, viewMode === 'list' && styles.segmentTabActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="list-outline"
              size={14}
              color={viewMode === 'list' ? PLAYER_DARK.text : PLAYER_DARK.textMuted}
            />
            <ProDayText
              style={[
                styles.segmentLabel,
                viewMode === 'list' ? styles.segmentLabelActive : styles.segmentLabelInactive,
              ]}
            >
              Liste
            </ProDayText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.press();
              setViewMode('month');
            }}
            style={[styles.segmentTab, viewMode === 'month' && styles.segmentTabActive]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={viewMode === 'month' ? PLAYER_DARK.text : PLAYER_DARK.textMuted}
            />
            <ProDayText
              style={[
                styles.segmentLabel,
                viewMode === 'month' ? styles.segmentLabelActive : styles.segmentLabelInactive,
              ]}
            >
              Mois
            </ProDayText>
          </TouchableOpacity>
        </View>

        <View style={styles.timeFilterSegment}>
          <TouchableOpacity
            onPress={() => {
              prodayHaptics.press();
              setTimeFilter('upcoming');
            }}
            style={[styles.timeTab, timeFilter === 'upcoming' && styles.timeTabActive]}
            activeOpacity={0.7}
          >
            <ProDayText
              style={[
                styles.timeLabel,
                timeFilter === 'upcoming' ? styles.timeLabelActive : styles.timeLabelInactive,
              ]}
            >
              À venir
            </ProDayText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              prodayHaptics.press();
              setTimeFilter('past');
            }}
            style={[styles.timeTab, timeFilter === 'past' && styles.timeTabActive]}
            activeOpacity={0.7}
          >
            <ProDayText
              style={[
                styles.timeLabel,
                timeFilter === 'past' ? styles.timeLabelActive : styles.timeLabelInactive,
              ]}
            >
              Passés
            </ProDayText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. FILTRES PAR TYPE */}
      <View style={styles.filterRow}>
        {(['all', 'team_event', 'friendly_match', 'competition_fixture'] as const).map((filterId) => {
          const isSelected = calendarKind === filterId;
          const meta = CALENDAR_KIND_META[filterId];

          return (
            <PressableSpring
              key={filterId}
              onPress={() => {
                prodayHaptics.press();
                onCalendarKindChange(filterId);
              }}
              scaleTo={0.95}
              haptic
              style={[
                styles.filterChip,
                isSelected ? styles.filterChipSelected : styles.filterChipUnselected,
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={12}
                color={isSelected ? skin.accent : PLAYER_DARK.textMuted}
              />
              <ProDayText
                style={[
                  styles.filterChipText,
                  { color: isSelected ? PLAYER_DARK.text : PLAYER_DARK.textMuted },
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {meta.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>

      {livePanel}

      {/* 5. HERO DU PROCHAIN RENDEZ-VOUS */}
      {nextItem && timeFilter === 'upcoming' && !selectedDay ? (
        <InteractiveListItem index={0}>
          <MatchNextUpCard
            item={nextItem}
            onPress={() => onOpenCalendarItem(nextItem)}
            onRsvp={nextTeamEvent && onRsvp ? handleNextItemRsvp : undefined}
            onOpenCarpool={nextItem.team_event_id && onOpenCarpoolForEvent ? handleNextItemCarpool : undefined}
            currentRsvp={currentUserRsvp}
            rsvpBusy={rsvpBusy}
          />
        </InteractiveListItem>
      ) : null}

      {/* 6. MOBILISATION DU GROUPE & CONVOCATIONS (RÉELLES) */}
      {(mobilizationStats || pendingConvocationsCount > 0) && timeFilter === 'upcoming' && !selectedDay ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleCol}>
              <View style={styles.sectionTagRow}>
                <View style={[styles.sectionDot, { backgroundColor: skin.accent }]} />
                <ProDayText style={[styles.sectionKicker, { color: skin.accent }]}>
                  VESTIAIRE & MOBILISATION
                </ProDayText>
              </View>
              <ProDayText style={styles.sectionTitle}>État des Convocations</ProDayText>
            </View>

            {onOpenConvocations ? (
              <PressableSpring
                onPress={onOpenConvocations}
                scaleTo={0.95}
                haptic
                style={[styles.sectionActionBtn, { borderColor: `${skin.accent}40`, backgroundColor: `${skin.accent}14` }]}
              >
                <ProDayText style={[styles.sectionActionText, { color: skin.accent }]}>
                  {pendingConvocationsCount > 0 ? `${pendingConvocationsCount} en attente` : 'Détails →'}
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>

          {mobilizationStats ? (
            <View style={styles.attendanceBarWrap}>
              <View style={styles.attendanceLabelsRow}>
                <ProDayText style={styles.attendanceMainLabel}>
                  {`${mobilizationStats.confirmed} sur ${mobilizationStats.total} joueurs confirmés`}
                </ProDayText>
                <ProDayText style={[styles.attendancePct, { color: skin.accent }]}>
                  {`${mobilizationStats.pct}%`}
                </ProDayText>
              </View>
              <View style={styles.attendanceTrack}>
                <View
                  style={[
                    styles.attendanceFill,
                    { width: `${mobilizationStats.pct}%`, backgroundColor: skin.accent },
                  ]}
                />
              </View>
            </View>
          ) : pendingConvocationsCount > 0 ? (
            <View style={styles.pendingConvocationRow}>
              <Ionicons name="alert-circle-outline" size={16} color={skin.accent} />
              <ProDayText style={styles.pendingConvocationText}>
                Vous avez {pendingConvocationsCount} convocation{pendingConvocationsCount > 1 ? 's' : ''} à valider pour le groupe.
              </ProDayText>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 5. VUE MOIS (GRILLE APPLE CALENDAR) */}
      {viewMode === 'month' ? (
        <View style={styles.monthCalendarCard}>
          {/* Entête du mois avec navigation < et > */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              style={styles.monthNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Mois précédent"
            >
              <Ionicons name="chevron-back" size={18} color={PLAYER_DARK.text} />
            </TouchableOpacity>

            <ProDayText style={styles.monthNavTitle}>
              {monthLabel}
            </ProDayText>

            <TouchableOpacity
              onPress={() => {
                prodayHaptics.press();
                setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              style={styles.monthNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Mois suivant"
            >
              <Ionicons name="chevron-forward" size={18} color={PLAYER_DARK.text} />
            </TouchableOpacity>
          </View>

          {/* En-tête des jours de la semaine */}
          <View style={styles.weekDaysHeaderRow}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <ProDayText key={i} style={styles.weekDayLabel}>
                {d}
              </ProDayText>
            ))}
          </View>

          {/* Grille des cellules du mois */}
          <View style={styles.gridContainer}>
            {monthGridData.map((cell, idx) => {
              if (!cell.dayNumber || !cell.date) {
                return <View key={idx} style={styles.emptyGridCell} />;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    prodayHaptics.press();
                    if (cell.isSelected) {
                      onSelectDay(null);
                    } else {
                      onSelectDay(cell.date);
                    }
                  }}
                  style={[
                    styles.gridCell,
                    cell.isSelected && {
                      backgroundColor: `${skin.accent}25`,
                      borderColor: skin.accent,
                    },
                    cell.isToday && !cell.isSelected && styles.gridCellToday,
                  ]}
                  activeOpacity={0.7}
                >
                  <ProDayText
                    style={[
                      styles.cellDayText,
                      cell.isToday && { color: skin.accent, fontWeight: '800' },
                      cell.isSelected && { color: '#FFFFFF', fontWeight: '900' },
                    ]}
                  >
                    {cell.dayNumber}
                  </ProDayText>

                  {cell.eventsCount > 0 ? (
                    <View style={styles.cellDotRow}>
                      <View
                        style={[
                          styles.cellDot,
                          { backgroundColor: cell.isSelected ? skin.accent : skin.accent },
                        ]}
                      />
                      {cell.eventsCount > 1 ? (
                        <View style={[styles.cellDot, { backgroundColor: skin.accent, opacity: 0.7 }]} />
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.cellDotPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDay ? (
            <View style={styles.selectedDayBadgeRow}>
              <ProDayText style={styles.selectedDayBadgeText}>
                Filtre : {formatDayGroupLabel(selectedDay).label}
              </ProDayText>
              <TouchableOpacity
                onPress={() => onSelectDay(null)}
                style={styles.clearDayBtn}
              >
                <Ionicons name="close-circle" size={14} color={PLAYER_DARK.textMuted} />
                <ProDayText style={styles.clearDayBtnText}>Effacer</ProDayText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 6. LISTE CHRONOLOGIQUE DES ÉVÉNEMENTS */}
      {loadingCalendar ? (
        <SkeletonList count={4} variant="card" />
      ) : timeFilteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyHeroCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: `${skin.accent}14`, borderColor: `${skin.accent}28` }]}>
              <Ionicons name="calendar-outline" size={26} color={skin.accent} />
            </View>

            <ProDayText style={styles.emptyTitleText}>
              {emptyTitle}
            </ProDayText>

            <ProDayText style={styles.emptySubtitleText}>
              {emptySubtitle}
            </ProDayText>

            <PressableSpring
              onPress={handleEmptyCta}
              scaleTo={0.96}
              haptic
              style={[
                styles.emptyCtaButton,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                },
              ]}
            >
              <ProDayText style={[styles.emptyCtaButtonText, { color: skin.accent }]}>
                {emptyCtaLabel}
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      ) : (
        dayGroups.map((group) => (
          <View key={group.dateKey} style={styles.dayGroup}>
            <View style={styles.dayGroupHeaderRow}>
              <View
                style={[
                  styles.dayGroupIndicator,
                  group.isToday && { backgroundColor: skin.accent },
                  group.isTomorrow && { backgroundColor: '#38BDF8' },
                ]}
              />
              <ProDayText
                style={[
                  styles.dayGroupLabel,
                  group.isToday && { color: skin.accent, fontWeight: '800' },
                  group.isTomorrow && { color: '#38BDF8', fontWeight: '700' },
                ]}
              >
                {group.label}
              </ProDayText>
            </View>

            <View style={styles.eventList}>
              {group.items.map((item, idx) => {
                const teamEv = item.team_event_id
                  ? teamEvents.find((e) => e.id === item.team_event_id)
                  : null;
                const userEventRsvp = teamEv && profile ? teamEv.rsvps?.[profile.uid] ?? 'pending' : null;

                const startsAt = item.starts_at ? new Date(item.starts_at) : new Date();
                const timeStr = `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`;

                return (
                  <InteractiveListItem key={item.id} index={idx}>
                    <MatchCalendarCard
                      kindLabel={calendarKindLabel(item, t)}
                      dateLabel={timeStr}
                      title={item.title}
                      subtitle={item.subtitle}
                      city={item.city}
                      userRsvp={userEventRsvp}
                      status={teamEv?.live_state?.status === 'cancelled' ? 'cancelled' : 'confirmed'}
                      onPress={() => onOpenCalendarItem(item)}
                      onExportCalendar={() => {
                        const start = item.starts_at ? new Date(item.starts_at) : new Date();
                        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                        void calendarExportService.exportEventToCalendar({
                          id: item.id,
                          title: item.title,
                          description: `${item.subtitle} • ProDay Football`,
                          location: item.city,
                          startDate: start,
                          endDate: end,
                        });
                      }}
                    />
                  </InteractiveListItem>
                );
              })}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCol: {
    gap: 2,
  },
  sectionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionKicker: {
    ...playerType.micro,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
  },
  sectionActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionActionText: {
    ...playerType.caption,
    fontWeight: '700',
  },
  attendanceBarWrap: {
    gap: 6,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  attendanceLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceMainLabel: {
    ...playerType.caption,
    fontWeight: '600',
    color: PLAYER_DARK.textMuted,
  },
  attendancePct: {
    ...playerType.caption,
    fontWeight: '800',
  },
  attendanceTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  pendingConvocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  pendingConvocationText: {
    ...playerType.caption,
    color: PLAYER_DARK.text,
    flex: 1,
  },
  brandHeader: {
    gap: 4,
    paddingTop: 4,
    paddingBottom: 2,
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
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: {
    ...playerType.title,
    fontSize: 26,
    color: PLAYER_DARK.text,
  },
  brandSubtitle: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  shortcutChip: {
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
  calendarControlHeader: {
    gap: 8,
    paddingTop: 4,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  calendarSectionTitle: {
    ...playerType.title,
    fontSize: 20,
    color: PLAYER_DARK.text,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  todayButtonText: {
    ...playerType.micro,
    fontWeight: '700',
  },
  viewSwitchRow: {
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
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  segmentLabel: {
    ...playerType.caption,
    fontSize: 12,
  },
  segmentLabelInactive: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  segmentLabelActive: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  timeFilterSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeTab: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeLabel: {
    ...playerType.caption,
    fontSize: 11.5,
  },
  timeLabelInactive: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '500',
  },
  timeLabelActive: {
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
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
  filterChipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  filterChipText: {
    ...playerType.micro,
    fontSize: 11.5,
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '700',
  },
  monthCalendarCard: {
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
  weekDaysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  weekDayLabel: {
    ...playerType.micro,
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  gridContainer: {
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
  cellDayText: {
    ...playerType.caption,
    fontSize: 12.5,
    color: PLAYER_DARK.text,
    fontWeight: '500',
  },
  cellDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  cellDotPlaceholder: {
    height: 4,
    marginTop: 2,
  },
  selectedDayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedDayBadgeText: {
    ...playerType.caption,
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  clearDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  clearDayBtnText: {
    ...playerType.micro,
    color: PLAYER_DARK.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  emptyHeroCard: {
    width: '100%',
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitleText: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
    textAlign: 'center',
  },
  emptySubtitleText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 270,
  },
  emptyCtaButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyCtaButtonText: {
    ...playerType.caption,
    fontWeight: '700',
  },
  dayGroup: {
    gap: 6,
    marginTop: 4,
  },
  dayGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  dayGroupIndicator: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayGroupLabel: {
    ...playerType.headline,
    fontSize: 14,
    color: PLAYER_DARK.text,
    letterSpacing: -0.2,
  },
  eventList: {
    gap: 0,
  },
});



