import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { PRODAY_MODULES, type ProDayModuleId } from '../../content/prodayModules';
import { PressableSpring } from '../discover/PressableSpring';
import { Icon } from './Icon';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';

const MODULE_ACCENT: Record<ProDayModuleId, string> = {
  recrutement: colors.tone1,
  matchs: colors.tone2,
  gestion: colors.accent,
  arena: colors.tone3,
  sponsors: colors.tone4,
};

const MODULE_BG: Record<ProDayModuleId, string> = {
  recrutement: colors.accentSoft,
  matchs: colors.backgroundAlt,
  gestion: colors.surfaceMuted,
  arena: colors.surfaceMuted,
  sponsors: colors.accentSoft,
};

interface ProDayModuleGridProps {
  onModulePress: (id: ProDayModuleId) => void;
  liveRecruitment?: boolean;
}

export const ProDayModuleGrid: React.FC<ProDayModuleGridProps> = ({
  onModulePress,
  liveRecruitment,
}) => (
  <View style={styles.grid}>
    {PRODAY_MODULES.map((mod, i) => {
      const accent = MODULE_ACCENT[mod.id];
      return (
        <Animated.View
          key={mod.id}
          entering={FadeInUp.delay(i * 50).springify()}
          style={styles.cell}
        >
          <PressableSpring
            style={[styles.card, shadows.card]}
            onPress={() => onModulePress(mod.id)}
            scaleTo={0.94}
          >
            <View style={[styles.stripe, { backgroundColor: accent }]} />
            <View style={[styles.iconWrap, { backgroundColor: MODULE_BG[mod.id] }]}>
              <Icon name={mod.icon} size={22} color={accent} variant="filled" />
            </View>
            <Text style={styles.title}>{mod.title}</Text>
            <Text style={styles.sub}>{mod.subtitle}</Text>
            {mod.id === 'recrutement' && liveRecruitment ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            ) : null}
          </PressableSpring>
        </Animated.View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: { width: '48.5%', flexGrow: 1 },
  card: {
    ...surfaces.cardFlat,
    padding: spacing.md,
    minHeight: 112,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  title: { fontSize: 14, fontWeight: '800', color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  liveBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 9, fontWeight: '800', color: colors.success },
});
