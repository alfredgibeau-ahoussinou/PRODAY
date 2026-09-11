import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
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
import { TacticalPitchBallHero } from '../../../screens/joueur/PlayerSaisonIcons';
import { FffMatchupCard } from '../FffMatchupCard';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

type WeekDay = { date: Date; count: number; isToday: boolean };

type StaggeredCalendarGroup = {
  key: string;
  label: string;
  items: { item: SeasonCalendarItem; staggerIndex: number }[];
};

function calendarLinkLabel(item: SeasonCalendarItem, t: (key: string) => string): string {
  if (item.team_event_id) return t('matchs.calendar.link.convocation');
  if (item.friendly_match_id) return t('matchs.calendar.link.friendly');
  return t('matchs.calendar.link.open');
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


export interface MatchCalendarChapterProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  nextItem: SeasonCalendarItem | null;
  teamEvents?: TeamEvent[];
  pendingConvocations?: TeamEvent[];
  weekDays: WeekDay[];
  selectedDay: Date | null;
  onSelectDay: (date: Date | null) => void;
  calendarSearch: string;
  onCalendarSearchChange: (value: string) => void;
  calendarKind: CalendarKindFilter;
  onCalendarKindChange: (value: CalendarKindFilter) => void;
  loadingCalendar: boolean;
  filteredCalendar: SeasonCalendarItem[];
  staggeredCalendarGroups: StaggeredCalendarGroup[];
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
  onRsvp?: (eventId: string, status: RsvpStatus) => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  rsvpBusy?: boolean;
}

export const MatchCalendarChapter: React.FC<MatchCalendarChapterProps> = ({
  profile,
  items,
  nextItem,
  teamEvents = [],
  pendingConvocations = [],
  weekDays,
  selectedDay,
  onSelectDay,
  calendarSearch,
  onCalendarSearchChange,
  calendarKind,
  onCalendarKindChange,
  loadingCalendar,
  filteredCalendar,
  staggeredCalendarGroups,
  refreshing,
  onRefresh,
  onOpenCalendarItem,
  onPropose,
  onLogin,
  canManageEvents = false,
  pendingConvocationsCount = 0,
  onOpenConvocations,
  onRsvp,
  onOpenCarpoolForEvent,
  rsvpBusy = false,
  livePanel,
}) => {
  const skin = useMatchSkinTokens();
  const { t } = useTranslation();

  const isFiltered = Boolean(selectedDay || calendarSearch || calendarKind !== 'all');

  // Trouver l'événement lié au nextItem pour le RSVP interactif
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

  const emptyTitle = selectedDay
    ? 'Aucun match à cette date'
    : isFiltered
      ? 'Aucune rencontre trouvée'
      : 'Aucun match au calendrier';

  const emptySubtitle = isFiltered
    ? 'Modifiez vos critères de recherche ou réinitialisez les filtres.'
    : canManageEvents
      ? 'Planifiez une rencontre amicale ou convoquez le groupe pour le prochain tournoi.'
      : 'Les prochaines convocations et affiches officielles de votre équipe apparaîtront ici.';

  const emptyCtaLabel = !profile
    ? t('matchs.calendar.cta.login')
    : canManageEvents
      ? '+ Proposer un match'
      : pendingConvocationsCount > 0
        ? `Voir mes convocations (${pendingConvocationsCount})`
        : isFiltered
          ? 'Voir tout le calendrier'
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
      {livePanel}

      {/* 1. HERO DU CHOC / PROCHAIN MATCH H2H */}
      {nextItem ? (
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

      {/* 2. MOBILISATION DU GROUPE & CONVOCATIONS (RÉELLES) */}
      {mobilizationStats || pendingConvocationsCount > 0 ? (
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

      {/* 3. FACE-À-FACE & SCOUTING OFFICIEL FFF (SPORTEASY) */}
      <FffMatchupCard accent={skin.accent} />

      {/* 4. CALENDRIER & PROCHAINES ÉCHÉANCES */}
      <View style={styles.calendarHeaderRow}>
        <ProDayText style={styles.calendarSectionTitle}>
          Calendrier & Échéances
        </ProDayText>
        <ProDayText style={[styles.matchCountLabel, { color: skin.accent }]}>
          {filteredCalendar.length} match{filteredCalendar.length > 1 ? 's' : ''}
        </ProDayText>
      </View>

      {/* Filtres par Type de Match */}
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
                isSelected
                  ? {
                      backgroundColor: `${skin.accent}1E`,
                      borderColor: skin.accent,
                    }
                  : {
                      backgroundColor: '#14141A',
                      borderColor: '#22222E',
                    },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={13}
                color={isSelected ? skin.accent : '#8B8B9A'}
              />
              <ProDayText
                style={[
                  styles.filterChipText,
                  { color: isSelected ? skin.accent : '#8B8B9A' },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {meta.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>

      {/* Liste Directe des Matchs ou État Vide */}
      {loadingCalendar ? (
        <SkeletonList count={4} variant="card" />
      ) : filteredCalendar.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyGraphicWrap}>
              <TacticalPitchBallHero color={skin.accent} width={240} height={85} />
            </View>

            <ProDayText style={styles.emptyTitleText}>
              {emptyTitle}
            </ProDayText>

            <ProDayText style={styles.emptySubtitleText}>
              {emptySubtitle}
            </ProDayText>

            <PressableSpring
              onPress={handleEmptyCta}
              scaleTo={0.97}
              haptic
              style={[styles.emptyCtaButton, { backgroundColor: skin.accent }]}
            >
              <ProDayText style={styles.emptyCtaButtonText}>
                {emptyCtaLabel}
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      ) : (
        staggeredCalendarGroups.map((group) => (
          <View key={group.key} style={styles.monthGroup}>
            <ProDayText style={[styles.monthLabel, { color: `${skin.accent}CC` }]}>
              {group.label.toUpperCase()}
            </ProDayText>

            <View style={styles.matchList}>
              {group.items.map(({ item, staggerIndex }) => (
                <InteractiveListItem key={item.id} index={staggerIndex}>
                  <MatchCalendarCard
                    kindLabel={calendarKindLabel(item, t)}
                    dateLabel={formatCalendarDate(item.starts_at)}
                    title={item.title}
                    subtitle={item.subtitle}
                    city={item.city}
                    linkLabel={`${calendarLinkLabel(item, t)} →`}
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
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 14,
    paddingTop: 4,
  },
  sectionCard: {
    backgroundColor: '#14141A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
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
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionActionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  attendanceBarWrap: {
    gap: 6,
    backgroundColor: '#0E0E14',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  attendanceLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceMainLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  attendancePct: {
    fontSize: 12,
    fontWeight: '900',
  },
  attendanceTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F1F2C',
    overflow: 'hidden',
  },
  attendanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  pendingConvocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E0E14',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  pendingConvocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    flex: 1,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  calendarSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  matchCountLabel: {
    fontSize: 12,
    fontWeight: '800',
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
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  emptyHeroCard: {
    width: '100%',
    backgroundColor: '#14141A',
    borderColor: '#22222E',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  emptyGraphicWrap: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitleText: {
    fontSize: 12.5,
    color: '#8B8B9A',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  emptyCtaButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  emptyCtaButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.1,
  },
  monthGroup: {
    gap: 6,
    marginTop: 2,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
  },
  matchList: {
    gap: 0,
  },
});


