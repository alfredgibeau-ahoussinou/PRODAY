import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { User } from '../../../models/User';
import type { CalendarKindFilter } from '../../../content/matchChapters';
import { MATCH_SITE } from '../../../content/matchPageIdentity';
import { getCalendarKindFilters } from '../../../i18n/localizedChapters';
import {
  formatCalendarDate,
  type SeasonCalendarItem,
} from '../../../utils/seasonCalendar';
import { EVENT_TYPE_LABELS } from '../../../models/TeamEvent';
import { SearchBar } from '../../ui/SearchBar';
import { ProDaySelect } from '../../ui/ProDaySelect';
import { ProDayText } from '../../ui/ProDayText';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { MatchNextUpCard } from '../MatchNextUpCard';
import { MatchWeekStrip } from '../MatchWeekStrip';
import { MatchCalendarCard } from '../MatchCalendarCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import { MatchEmptyState, MatchFilterBar, MatchKpiRow } from '../matchCenterUi';

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

export interface MatchCalendarChapterProps {
  profile: User | null;
  items: SeasonCalendarItem[];
  nextItem: SeasonCalendarItem | null;
  weekDays: WeekDay[];
  selectedDay: Date | null;
  onSelectDay: (date: Date) => void;
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
  geoMap?: React.ReactNode;
  /** Panneau live (Centre Match) — mode joueur, affiché en tête du calendrier. */
  livePanel?: React.ReactNode;
}

export const MatchCalendarChapter: React.FC<MatchCalendarChapterProps> = ({
  profile,
  items,
  nextItem,
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
  geoMap,
  livePanel,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const calendarKindFilters = useMemo(() => getCalendarKindFilters(t), [t]);

  const weekEventCount = useMemo(
    () => weekDays.reduce((sum, d) => sum + d.count, 0),
    [weekDays],
  );

  const emptySubtitle = !profile
    ? t('matchs.calendar.empty.guest')
    : items.length > 0
      ? t('matchs.calendar.empty.filtered')
      : t('matchs.calendar.empty.suggest');

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        kicker="Agenda"
        title={t('matchs.calendar.intro.title')}
        subtitle={t('matchs.calendar.intro.subtitle')}
      />

      {livePanel}

      <MatchKpiRow
        items={[
          { label: 'Semaine', value: String(weekEventCount), tone: colors.accent },
          { label: 'À venir', value: String(filteredCalendar.length), tone: MATCH_SITE.foreground },
          {
            label: 'Prochain',
            value: nextItem ? '1' : '0',
            tone: nextItem ? MATCH_SITE.warn : MATCH_SITE.muted,
          },
        ]}
      />

      {nextItem ? (
        <InteractiveListItem index={0}>
          <MatchNextUpCard item={nextItem} onPress={() => onOpenCalendarItem(nextItem)} />
        </InteractiveListItem>
      ) : null}

      {geoMap}

      <MatchWeekStrip days={weekDays} selectedDate={selectedDay} onSelectDay={onSelectDay} />

      <MatchFilterBar>
        <SearchBar
          placeholder={t('matchs.calendar.search')}
          value={calendarSearch}
          onChangeText={onCalendarSearchChange}
        />
        <ProDaySelect<CalendarKindFilter>
          label={t('matchs.calendar.filter.type')}
          placeholder={t('matchs.filter.calendar.all')}
          options={calendarKindFilters.map((f) => ({ id: f.id, label: f.label }))}
          value={calendarKind}
          onChange={onCalendarKindChange}
          inset={false}
        />
      </MatchFilterBar>

      {loadingCalendar ? (
        <SkeletonList count={4} variant="card" />
      ) : filteredCalendar.length === 0 ? (
        <MatchEmptyState
          title={t('matchs.calendar.empty.title')}
          body={emptySubtitle}
          cta={
            !profile
              ? t('matchs.calendar.cta.login')
              : items.length === 0
                ? t('matchs.calendar.cta.propose')
                : undefined
          }
          onPress={!profile ? onLogin : items.length === 0 ? onPropose : undefined}
        />
      ) : (
        staggeredCalendarGroups.map((group) => (
          <View key={group.key} style={styles.monthBlock}>
            <ProDayText variant="caption" style={styles.monthTitle}>
              {group.label}
            </ProDayText>
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
                />
              </InteractiveListItem>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingTop: spacing.sm },
  monthBlock: { gap: spacing.xs },
  monthTitle: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1.8,
    color: MATCH_SITE.muted,
    marginBottom: 4,
  },
});
