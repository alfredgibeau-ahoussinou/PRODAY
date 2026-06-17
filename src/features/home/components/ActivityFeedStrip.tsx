import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import type { ActivityFeedItem } from '../../v3/engines/activityFeed.engine';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { formatCalendarDate } from '../../../utils/seasonCalendar';

const KIND_META: Record<ActivityFeedItem['kind'], { icon: IconName; label: string }> = {
  match_played: { icon: 'football', label: 'Match' },
  convocation: { icon: 'mail', label: 'Convocation' },
  rsvp_yes: { icon: 'checkmark-circle', label: 'Confirmé' },
  application: { icon: 'briefcase', label: 'Mercato' },
  carpool: { icon: 'car', label: 'Trajet' },
  friendly_join: { icon: 'people', label: 'Amical' },
};

type ActivityFeedStripProps = {
  items: ActivityFeedItem[];
  onPressItem: (item: ActivityFeedItem) => void;
};

/** Fil activités type Strava — accueil V3. */
export const ActivityFeedStrip: React.FC<ActivityFeedStripProps> = ({ items, onPressItem }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const activityCountLabel = useMemo(
    () => t('home.activity.count', { n: items.length }),
    [items.length, t]
  );

  if (items.length === 0) return null;

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <ProDayText variant="section">{t('home.activity.title')}</ProDayText>
        <ProDayText variant="caption" muted>
          {activityCountLabel}
        </ProDayText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          return (
            <Pressable
              key={item.id}
              onPress={() => onPressItem(item)}
              style={[styles.tile, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Icon name={meta.icon} size={16} color={colors.accent} />
              </View>
              <ProDayText variant="caption" style={styles.tileTitle} numberOfLines={2}>
                {item.title}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {formatCalendarDate(item.at)} · {meta.label}
              </ProDayText>
              {item.metric ? (
                <ProDayText variant="caption" accent style={styles.metric}>
                  {item.metric}
                </ProDayText>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { gap: spacing.sm, paddingRight: spacing.sm },
  tile: {
    width: 148,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileTitle: { fontWeight: '700', minHeight: 32 },
  metric: { fontWeight: '800', marginTop: 2 },
});
