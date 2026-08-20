import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { SupporterMatchCard } from './SupporterMatchCard';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useFollows } from '../../hooks/useFollows';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SUPPORTER_MATCH_FILTERS } from '../../services/supporterPreferences.service';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing, radius } from '../../theme/designTokens';

export type SupporterLiveScoresStripProps = {
  onViewAll?: () => void;
};

export const SupporterLiveScoresStrip: React.FC<SupporterLiveScoresStripProps> = ({
  onViewAll,
}) => {
  const { colors } = useAppTheme();
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
  const liveItems = hub.sections.live.slice(0, 5);

  if (hub.loading && liveItems.length === 0) {
    return (
      <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ProDayText variant="caption" muted>
          {t('supporter.home.liveLoading')}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.liveCountPill}>
          <View style={styles.liveDot} />
          <ProDayText variant="caption" style={styles.liveCountText}>
            {hub.liveCount > 0
              ? t('supporter.home.liveCount', { n: String(hub.liveCount) })
              : t('supporter.home.liveEmptyShort')}
          </ProDayText>
        </View>
        {!hub.providerState.healthy ? (
          <ProDayText variant="caption" muted numberOfLines={1} style={styles.stubHint}>
            {t('supporter.api.stubShort')}
          </ProDayText>
        ) : null}
      </View>

      {liveItems.length === 0 ? (
        <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ProDayText variant="body">{t('supporter.home.liveEmpty')}</ProDayText>
          <PressableSpring onPress={handleViewAll} style={styles.link}>
            <ProDayText variant="caption" accent>
              {t('supporter.home.liveCta')}
            </ProDayText>
          </PressableSpring>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {liveItems.map((item) => (
              <View key={item.id} style={styles.cardWrap}>
                <SupporterMatchCard
                  item={item}
                  compact
                  onDebate={() => nav.setActiveTab('messages')}
                  onMoment={() => nav.setActiveTab('reels')}
                />
              </View>
            ))}
          </ScrollView>
          <PressableSpring onPress={handleViewAll} style={styles.link} haptic>
            <ProDayText variant="caption" accent>
              {t('supporter.home.liveCta')}
            </ProDayText>
          </PressableSpring>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  liveCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.live,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SUPPORTER_SITE.live,
  },
  liveCountText: {
    color: SUPPORTER_SITE.live,
    fontWeight: '800',
    fontSize: 11,
  },
  stubHint: {
    flex: 1,
    textAlign: 'right',
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  cardWrap: {
    width: 300,
  },
  placeholder: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  link: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
