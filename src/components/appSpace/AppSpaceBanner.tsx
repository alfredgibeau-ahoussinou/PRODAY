import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppSpace } from '../../context/AppSpaceContext';
import {
  APP_SPACE_LABELS,
  isFeminineAppSpace,
  isMasculineAppSpace,
  isUnderU13AppSpace,
  type AppSpaceId,
} from '../../models/AppSpace';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface AppSpaceBannerProps {
  showHubLinks?: boolean;
  onOpenWomenHub?: () => void;
  onOpenMenHub?: () => void;
  onOpenUnderU13Hub?: () => void;
}

export const AppSpaceBanner: React.FC<AppSpaceBannerProps> = ({
  showHubLinks = false,
  onOpenWomenHub,
  onOpenMenHub,
  onOpenUnderU13Hub,
}) => {
  const { appSpace } = useAppSpace();

  const wrapStyle = isUnderU13AppSpace(appSpace)
    ? styles.wrapUnderU13
    : isFeminineAppSpace(appSpace)
      ? styles.wrapFeminine
      : styles.wrapMasculine;

  const iconName = isUnderU13AppSpace(appSpace)
    ? 'school'
    : isFeminineAppSpace(appSpace)
      ? 'people'
      : 'football';

  const sub = isUnderU13AppSpace(appSpace)
    ? 'Mercato filtré — U7, U9, U11'
    : isFeminineAppSpace(appSpace)
      ? 'Mercato filtré — football féminin'
      : 'Mercato filtré — football masculin';

  return (
    <View style={styles.root}>
      <View style={[styles.wrap, wrapStyle]}>
        <Icon name={iconName} size={20} color={colors.brandInverse} />
        <View style={styles.copy}>
          <Text style={styles.titleActive}>{APP_SPACE_LABELS[appSpace]}</Text>
          <Text style={styles.subActive}>{sub}</Text>
        </View>
      </View>

      {showHubLinks ? (
        <View style={styles.dualWrap}>
          <TouchableOpacity
            style={[styles.dualCard, styles.dualFeminine]}
            onPress={onOpenWomenHub}
            activeOpacity={0.9}
          >
            <Icon name="people" size={20} color={colors.accent} />
            <View style={styles.dualCopy}>
              <Text style={styles.dualTitle}>Changer — Féminin</Text>
              <Text style={styles.dualSub}>Joueuses · clubs F</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dualCard, styles.dualMasculine]}
            onPress={onOpenMenHub}
            activeOpacity={0.9}
          >
            <Icon name="football" size={20} color={colors.accent} />
            <View style={styles.dualCopy}>
              <Text style={styles.dualTitle}>Changer — Masculin</Text>
              <Text style={styles.dualSub}>Joueurs · clubs M</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dualCard, styles.dualUnderU13]}
            onPress={onOpenUnderU13Hub}
            activeOpacity={0.9}
          >
            <Icon name="school" size={20} color="#4ade80" />
            <View style={styles.dualCopy}>
              <Text style={styles.dualTitle}>Changer — -13 ans</Text>
              <Text style={styles.dualSub}>U7 · U9 · U11</Text>
            </View>
            <Icon name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export const AppSpacePill: React.FC<{ space: AppSpaceId; active: boolean; onPress: () => void }> = ({
  space,
  active,
  onPress,
}) => (
  <TouchableOpacity style={[pillStyles.pill, active && pillStyles.pillOn]} onPress={onPress}>
    <Text style={[pillStyles.text, active && pillStyles.textOn]} numberOfLines={1}>
      {APP_SPACE_LABELS[space].replace('ProDay ', '')}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { marginBottom: spacing.md },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  wrapFeminine: { backgroundColor: '#4a1942', borderColor: colors.accent },
  wrapMasculine: { backgroundColor: '#0f2847', borderColor: colors.accent },
  wrapUnderU13: { backgroundColor: '#1a5c3a', borderColor: '#4ade80' },
  copy: { flex: 1 },
  titleActive: { fontSize: 14, fontWeight: '900', color: colors.brandInverse },
  subActive: { fontSize: 11, color: colors.heroMuted },
  dualWrap: { gap: spacing.sm, marginTop: spacing.sm },
  dualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  dualFeminine: { borderLeftWidth: 4, borderLeftColor: '#c45b9a' },
  dualMasculine: { borderLeftWidth: 4, borderLeftColor: '#3d6cb9' },
  dualUnderU13: { borderLeftWidth: 4, borderLeftColor: '#4ade80' },
  dualCopy: { flex: 1 },
  dualTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  dualSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { fontSize: 10, fontWeight: '800', color: colors.text },
  textOn: { color: colors.brandInverse },
});
