import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { LivePulseDot, PressableSpring, StaggerReveal } from '../motion';
import type { ProDayModuleDef, ProDayModuleId } from '../../content/prodayModules';
import { getHomeModules } from '../../content/homeExperience';
import type { UserRole } from '../../models/User';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';

interface HomeModuleRailProps {
  onModulePress: (id: ProDayModuleId) => void;
  liveRecruitment?: boolean;
  role?: UserRole;
  modules?: ProDayModuleDef[];
  style?: ViewStyle;
}

export const HomeModuleRail: React.FC<HomeModuleRailProps> = ({
  onModulePress,
  liveRecruitment,
  role,
  modules: modulesProp,
  style,
}) => {
  const { colors, productLine } = useAppTheme();

  const modules = useMemo(() => {
    if (modulesProp) return modulesProp;
    if (role) return getHomeModules(productLine, role);
    return getHomeModules(productLine);
  }, [modulesProp, productLine, role]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.track, style]}
    >
      {modules.map((mod, index) => (
        <StaggerReveal key={mod.id} index={index} delayStep={45}>
        <PressableSpring
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderLeftColor: colors.accent,
            },
          ]}
          onPress={() => onModulePress(mod.id)}
          scaleTo={0.96}
          haptic
        >
          <ProDayGradient kind="card" style={styles.iconWrap}>
            <Icon name={mod.icon} size={22} color={colors.ink} variant="filled" />
          </ProDayGradient>
          <ProDayText variant="caption" style={styles.title}>
            {mod.title}
          </ProDayText>
          <ProDayText variant="caption" muted numberOfLines={2} style={styles.sub}>
            {mod.subtitle}
          </ProDayText>
          {mod.id === 'recrutement' && liveRecruitment ? (
            <View style={styles.live}>
              <LivePulseDot active size={6} color={colors.success} />
              <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
            </View>
          ) : null}
        </PressableSpring>
        </StaggerReveal>
      ))}
    </ScrollView>
  );
};

const CARD_W = 132;

const styles = StyleSheet.create({
  track: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  card: {
    width: CARD_W,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    ...shadows.soft,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 13 },
  sub: { marginTop: 4, lineHeight: 15 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  liveText: { fontSize: 10, fontWeight: '800' },
});
