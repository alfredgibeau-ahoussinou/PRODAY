import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  withDelay,
  withTiming,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import type { RecruitmentStats } from '../../services/stats.service';
import { Icon } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { discover } from '../../theme/discoverTheme';
import { colors, spacing } from '../../theme/designTokens';

interface AnimatedStatCountersProps {
  stats: RecruitmentStats;
  onPress?: () => void;
}

type StatKey = 'players' | 'clubs' | 'recruitment_posts_open';

const STAT_META: Record<
  StatKey,
  { label: string; detail: string; icon: 'people' | 'business' | 'briefcase' }
> = {
  players: {
    label: 'Joueurs',
    detail: 'Profils actifs sur le Mercato ProDay — joueurs, coachs et agents.',
    icon: 'people',
  },
  clubs: {
    label: 'Clubs',
    detail: 'Structures inscrites qui publient annonces et convocations.',
    icon: 'business',
  },
  recruitment_posts_open: {
    label: 'Annonces',
    detail: 'Offres ouvertes en ce moment — filtres poste, niveau, ville.',
    icon: 'briefcase',
  },
};

const StatBlock: React.FC<{
  value: number;
  label: string;
  delay: number;
  active: boolean;
  onPress: () => void;
}> = ({ value, label, delay, active, onPress }) => {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1200 }));
  }, [delay, progress, value]);

  useAnimatedReaction(
    () => progress.value,
    (v) => runOnJS(setDisplay)(Math.round(v * value))
  );

  return (
    <PressableSpring style={[styles.block, active && styles.blockActive]} onPress={onPress}>
      <Text style={[styles.blockValue, active && styles.blockValueActive]}>{display}</Text>
      <Text style={[styles.blockLabel, active && styles.blockLabelActive]}>{label}</Text>
    </PressableSpring>
  );
};

export const AnimatedStatCounters: React.FC<AnimatedStatCountersProps> = ({
  stats,
  onPress,
}) => {
  const [activeKey, setActiveKey] = useState<StatKey | null>(null);
  const entries: { key: StatKey; value: number }[] = [
    { key: 'players', value: stats.players },
    { key: 'clubs', value: stats.clubs },
    { key: 'recruitment_posts_open', value: stats.recruitment_posts_open },
  ];

  const toggle = (key: StatKey) => {
    setActiveKey((prev) => (prev === key ? null : key));
  };

  const activeMeta = activeKey ? STAT_META[activeKey] : null;
  const activeValue = activeKey
    ? entries.find((e) => e.key === activeKey)?.value ?? 0
    : 0;

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.wrap}>
      <View style={styles.row}>
        {entries.map(({ key, value }, i) => (
          <React.Fragment key={key}>
            {i > 0 ? <View style={styles.sep} /> : null}
            <StatBlock
              value={value}
              label={STAT_META[key].label}
              delay={i * 120}
              active={activeKey === key}
              onPress={() => toggle(key)}
            />
          </React.Fragment>
        ))}
      </View>

      {activeMeta ? (
        <Animated.View layout={Layout.springify()} style={styles.detail}>
          <View style={styles.detailIcon}>
            <Icon name={activeMeta.icon} size={22} color={colors.accent} variant="filled" />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailTitle}>
              {activeValue} {activeMeta.label.toLowerCase()}
            </Text>
            <Text style={styles.detailText}>{activeMeta.detail}</Text>
          </View>
        </Animated.View>
      ) : null}

      <PressableSpring style={styles.ctaRow} onPress={onPress}>
        <Text style={styles.caption}>Données communauté en temps réel</Text>
        <Text style={styles.ctaLink}>Rejoindre →</Text>
      </PressableSpring>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: discover.bgElevated,
    borderWidth: 1,
    borderColor: discover.border,
    borderRadius: discover.radius.lg,
    overflow: 'hidden',
  },
  block: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  blockActive: {
    backgroundColor: colors.accentSoft,
  },
  blockValue: {
    fontSize: 32,
    fontWeight: '900',
    color: discover.ink,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  blockValueActive: { color: colors.accent },
  blockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: discover.inkMuted,
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  blockLabelActive: { color: colors.accent },
  sep: {
    width: 2,
    backgroundColor: discover.border,
  },
  detail: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: discover.radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  detailBody: { flex: 1 },
  detailTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accent,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  caption: {
    fontSize: 11,
    color: discover.inkMuted,
    fontWeight: '600',
  },
  ctaLink: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
});
