import React, { useEffect, useMemo, useState } from 'react';
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
import { PressableSpring } from '../motion';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

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
    detail: 'Profils actifs sur le Mercato ProDay. Joueurs, coachs et agents.',
    icon: 'people',
  },
  clubs: {
    label: 'Clubs',
    detail: 'Structures inscrites qui publient annonces et convocations.',
    icon: 'business',
  },
  recruitment_posts_open: {
    label: 'Annonces',
    detail: 'Offres ouvertes en ce moment. Filtres poste, niveau, ville.',
    icon: 'briefcase',
  },
};

const StatBlock: React.FC<{
  value: number;
  label: string;
  delay: number;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}> = ({ value, label, delay, active, onPress, styles }) => {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1200 }));
  }, [delay, progress, value]);

  useAnimatedReaction(
    () => Math.round(progress.value * value),
    (current, prev) => {
      if (current !== prev) runOnJS(setDisplay)(current);
    }
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
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
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
              styles={styles}
            />
          </React.Fragment>
        ))}
      </View>

      {activeMeta ? (
        <Animated.View layout={Layout.springify()} style={styles.detail}>
          <View style={styles.detailIcon}>
            <Icon name={activeMeta.icon} size={22} color={c.brand} variant="filled" />
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    block: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    blockActive: {
      backgroundColor: c.brandSoft,
    },
    blockValue: {
      fontSize: 32,
      fontWeight: '900',
      color: c.text,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
    },
    blockValueActive: { color: c.brand },
    blockLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 1.2,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    blockLabelActive: { color: c.brand },
    sep: {
      width: 2,
      backgroundColor: c.border,
    },
    detail: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    detailIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.brand,
    },
    detailBody: { flex: 1 },
    detailTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: c.brand,
    },
    detailText: {
      fontSize: 12,
      lineHeight: 18,
      color: c.textSecondary,
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
      color: c.textMuted,
      fontWeight: '600',
    },
    ctaLink: {
      fontSize: 11,
      fontWeight: '800',
      color: c.brand,
    },
  });
}
