import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { SupporterMatchCard } from './SupporterMatchCard';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { externalScoresService } from '../../services/externalScores.service';
import {
  externalFixtureToMatchItem,
  filterMatchItems,
  type SupporterMatchViewItem,
} from '../../utils/supporterMatchFilters';
import { isExternalFixtureLiveNow } from '../../utils/supporterLiveMatches';
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
  const [items, setItems] = useState<SupporterMatchViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const fixtures = await externalScoresService.listFixtures();
      const live = fixtures
        .filter(isExternalFixtureLiveNow)
        .map(externalFixtureToMatchItem)
        .slice(0, 4);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);
      const today = fixtures
        .filter((f) => f.starts_at >= todayStart && f.starts_at < todayEnd && f.status !== 'live')
        .map(externalFixtureToMatchItem)
        .slice(0, 2);
      const merged = filterMatchItems([...live, ...today], {
        gender: 'all',
        source: 'world',
        scope: 'all',
      }, { clubIds: new Set(), tournamentIds: new Set(), playerIds: new Set() });
      setItems(merged.slice(0, 5));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const handleViewAll = onViewAll ?? (() => nav.openMatchs({ homeTab: 'season' }));

  if (loading && items.length === 0) {
    return (
      <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ProDayText variant="caption" muted>
          {t('supporter.home.liveLoading')}
        </ProDayText>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ProDayText variant="body">{t('supporter.home.liveEmpty')}</ProDayText>
        <PressableSpring onPress={handleViewAll} style={styles.link}>
          <ProDayText variant="caption" accent>
            {t('supporter.home.liveCta')}
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.cardWrap}>
            <SupporterMatchCard
              item={item}
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  link: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
