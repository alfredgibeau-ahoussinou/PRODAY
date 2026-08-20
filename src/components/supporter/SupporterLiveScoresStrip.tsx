import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { SupporterMatchCard } from './SupporterMatchCard';
import { useTranslation } from '../../context/LocaleContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useFollows } from '../../hooks/useFollows';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SUPPORTER_MATCH_FILTERS } from '../../services/supporterPreferences.service';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';
import { hasClubOrWorldTeamFollows } from '../../utils/supporterWorldFollows';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

export type SupporterLiveScoresStripProps = {
  onViewAll?: () => void;
  onOpenMatch?: (item: SupporterMatchViewItem) => void;
};

export const SupporterLiveScoresStrip: React.FC<SupporterLiveScoresStripProps> = ({
  onViewAll,
  onOpenMatch,
}) => {
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { tournaments } = useTournaments();
  const { follows } = useFollows(profile?.uid);

  const hub = useSupporterMatchHub({
    calendarEvents: events,
    tournaments,
    follows,
    filters: DEFAULT_SUPPORTER_MATCH_FILTERS,
    pollLive: true,
  });

  const handleViewAll = onViewAll ?? (() => nav.openMatchs({ homeTab: 'season' }));
  const liveItems = hub.sections.live.slice(0, 8);
  const upcomingItems = hub.sections.upcoming.slice(0, 4);
  const hasFollows = hasClubOrWorldTeamFollows(follows);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ProDayText variant="caption" style={styles.kicker}>
          {t('supporter.home.liveTitle')}
        </ProDayText>
        <ProDayText variant="caption" style={styles.count}>
          {hub.liveCount > 0
            ? t('supporter.home.liveCount', { n: String(hub.liveCount) })
            : t('supporter.home.liveEmptyShort')}
        </ProDayText>
      </View>

      {liveItems.length > 0 ? (
        liveItems.map((item) => (
          <SupporterMatchCard
            key={item.id}
            item={item}
            compact
            onPress={onOpenMatch ? () => onOpenMatch(item) : undefined}
          />
        ))
      ) : (
        <ProDayText variant="caption" style={styles.empty}>
          {hub.loading ? t('supporter.home.liveLoading') : t('supporter.home.liveEmpty')}
        </ProDayText>
      )}

      <View style={[styles.head, styles.upcomingHead]}>
        <ProDayText variant="caption" style={styles.kicker}>
          {t('supporter.home.upcomingTitle')}
        </ProDayText>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <ProDayText variant="caption" style={styles.link}>
            {t('supporter.home.upcomingCta')}
          </ProDayText>
        </Pressable>
      </View>

      {upcomingItems.length > 0 ? (
        upcomingItems.map((item: SupporterMatchViewItem) => (
          <SupporterMatchCard
            key={item.id}
            item={item}
            compact
            onPress={onOpenMatch ? () => onOpenMatch(item) : undefined}
          />
        ))
      ) : (
        <ProDayText variant="caption" style={styles.empty}>
          {hub.loading
            ? t('supporter.home.liveLoading')
            : hasFollows
              ? t('supporter.empty.upcomingFollowed')
              : t('supporter.empty.upcomingNoFollows')}
        </ProDayText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  upcomingHead: {
    marginTop: spacing.lg,
  },
  kicker: {
    color: SUPPORTER_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  count: {
    color: SUPPORTER_SITE.muted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  empty: {
    color: SUPPORTER_SITE.muted,
    lineHeight: 18,
    paddingVertical: spacing.sm,
  },
  link: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.2,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
