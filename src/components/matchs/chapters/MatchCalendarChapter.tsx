import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { User } from '../../../models/User';
import type { CalendarKindFilter } from '../../../content/matchChapters';
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
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';

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
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const calendarKindFilters = useMemo(() => getCalendarKindFilters(t), [t]);

  const emptySubtitle = !profile
    ? t('matchs.calendar.empty.guest')
    : items.length > 0
      ? t('matchs.calendar.empty.filtered')
      : t('matchs.calendar.empty.suggest');

  const emptyPrimaryCta = !profile
    ? { label: t('matchs.calendar.cta.login'), onPress: onLogin }
    : items.length === 0
      ? { label: t('matchs.calendar.cta.propose'), onPress: onPropose }
      : undefined;

  return (
    <ScrollView
      contentContainerStyle={MATCH_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        title={t('matchs.calendar.intro.title')}
        subtitle={t('matchs.calendar.intro.subtitle')}
      />

      {nextItem ? (
        <InteractiveListItem index={0}>
          <MatchNextUpCard item={nextItem} onPress={() => onOpenCalendarItem(nextItem)} />
        </InteractiveListItem>
      ) : null}

      {geoMap}

      <MatchWeekStrip days={weekDays} selectedDate={selectedDay} onSelectDay={onSelectDay} />

      <View style={[styles.filters, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
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
      </View>

      {loadingCalendar ? (
        <SkeletonList count={4} variant="card" />
      ) : filteredCalendar.length === 0 ? (
        <ListEmptyPanel
          icon="calendar"
          title={t('matchs.calendar.empty.title')}
          subtitle={emptySubtitle}
          primaryCta={emptyPrimaryCta}
        />
      ) : (
        staggeredCalendarGroups.map((group) => (
          <View key={group.key} style={styles.monthBlock}>
            <ProDayText variant="caption" muted style={styles.monthTitle}>
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
  filters: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  monthBlock: { marginBottom: spacing.lg },
  monthTitle: {
    marginBottom: spacing.sm,
    fontWeight: '800',
    textTransform: 'capitalize',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
