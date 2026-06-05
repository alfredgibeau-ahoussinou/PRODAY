import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  type ViewStyle,
} from 'react-native';
import type { ProDayModuleDef, ProDayModuleId } from '../../content/prodayModules';
import { getHomeModules } from '../../content/homeExperience';
import type { UserRole } from '../../models/User';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon } from '../ui/Icon';
import { spacing, radius, shadows } from '../../theme/designTokens';

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
      {modules.map((mod) => (
        <Pressable
          key={mod.id}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.cardPressed,
          ]}
          onPress={() => onModulePress(mod.id)}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <Icon name={mod.icon} size={22} color={colors.ink} variant="filled" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{mod.title}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={2}>
            {mod.subtitle}
          </Text>
          {mod.id === 'recrutement' && liveRecruitment ? (
            <View style={styles.live}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
            </View>
          ) : null}
        </Pressable>
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
  title: { fontSize: 14, fontWeight: '800' },
  sub: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: { fontSize: 10, fontWeight: '800' },
});
