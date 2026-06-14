import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import type { User } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { getHomeDashboardMeta } from '../../content/homeExperience';
import { AnimatedEntrance } from '../motion/AnimatedEntrance';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

export type DashboardHeroStat = {
  key: string;
  label: string;
  value: string | number;
  onPress?: () => void;
};

interface DashboardHeroProps {
  profile: User;
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  unreadMessages: number;
  stats: DashboardHeroStat[];
  onProfilePress: () => void;
  onMessagesPress: () => void;
  onFeedPress?: () => void;
  onHealthPress?: () => void;
  onCarpoolPress?: () => void;
  variant?: 'full' | 'pulse';
}

/** Bloc Pulse + stats — style app, sans bannière marketing. */
export const DashboardHero: React.FC<DashboardHeroProps> = ({
  profile,
  pulse,
  breakdown,
  stats,
  onProfilePress,
  variant = 'pulse',
}) => {
  const { colors, productLine } = useAppTheme();
  const dashMeta = useMemo(
    () => getHomeDashboardMeta(profile.role, productLine),
    [profile.role, productLine],
  );

  if (variant !== 'pulse') {
    return null;
  }

  return (
    <AnimatedEntrance kind="fadeUp">
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <ProDayText variant="caption" muted style={styles.caption}>
        {dashMeta.eyebrow}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.tagline}>
        {dashMeta.tagline}
      </ProDayText>
      <Pressable style={styles.pulseWrap} onPress={onProfilePress}>
        <ProDayPulseInteractive
          pulse={pulse}
          breakdown={breakdown}
          variant="light"
          onExpand={onProfilePress}
        />
      </Pressable>
      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat, index) => {
            const inner = (
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
              >
                <ProDayText variant="section" accent style={styles.statValue}>
                  {stat.value}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {stat.label}
                </ProDayText>
              </View>
            );
            const cell = stat.onPress ? (
              <TouchableOpacity style={styles.statCell} onPress={stat.onPress}>
                {inner}
              </TouchableOpacity>
            ) : (
              <View style={styles.statCell}>{inner}</View>
            );
            return (
              <AnimatedEntrance
                key={stat.key}
                kind="zoom"
                index={index + 2}
                delayStep={70}
                style={styles.statCell}
              >
                {cell}
              </AnimatedEntrance>
            );
          })}
        </View>
      ) : null}
    </View>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  caption: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    alignSelf: 'flex-start',
  },
  tagline: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  pulseWrap: { alignItems: 'center', width: '100%' },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  statCell: { flex: 1 },
  statCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  statValue: { fontSize: 20, lineHeight: 24 },
});
