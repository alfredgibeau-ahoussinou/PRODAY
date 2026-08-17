import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './coachPortalUi';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  COACH_COLOR_FAMILIES,
  type CoachColorFamilyId,
} from '../../utils/coachColorPicker';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';

const SWATCH_SIZE = 38;

type Props = {
  selectedColor: string;
  onSelect: (hex: string) => void;
};

export function CoachAccentColorAssistant({ selectedColor, onSelect }: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const [familyId, setFamilyId] = useState<CoachColorFamilyId>('warm');

  const normalizedSelected = selectedColor.toUpperCase();
  const activeFamily = useMemo(
    () => COACH_COLOR_FAMILIES.find((f) => f.id === familyId) ?? COACH_COLOR_FAMILIES[0],
    [familyId],
  );

  const familyLabel = useCallback(
    (id: CoachColorFamilyId) => t(`coach.portal.theme.colorFamily.${id}`),
    [t],
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerStrip}>
        <View style={styles.headerIconWrap}>
          <Icon name="star-four-points" size={18} color={tokens.accent} />
        </View>
        <View style={styles.headerText}>
          <CoachText variant="caption" style={styles.headerTitle}>
            {t('coach.portal.theme.colorAssistant')}
          </CoachText>
          <CoachText variant="caption" muted style={styles.headerSubtitle} numberOfLines={1}>
            {t('coach.portal.theme.colorAssistantSubtitle')}
          </CoachText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.familyRow}
        keyboardShouldPersistTaps="handled"
      >
        {COACH_COLOR_FAMILIES.map((family) => {
          const on = family.id === familyId;
          return (
            <PressableSpring
              key={family.id}
              onPress={() => setFamilyId(family.id)}
              scaleTo={0.97}
              haptic
              style={[styles.familyChip, on && styles.familyChipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <CoachText variant="caption" style={on ? styles.familyChipTextOn : styles.familyChipTextOff}>
                {familyLabel(family.id)}
              </CoachText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      <View style={styles.swatchGrid}>
        {activeFamily.colors.map((color) => {
          const isSelected = color === normalizedSelected;
          return (
            <PressableSpring
              key={color}
              onPress={() => onSelect(color)}
              scaleTo={0.92}
              haptic
              style={[styles.swatchWrap, isSelected && styles.swatchWrapSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={color}
            >
              <View style={[styles.swatch, { backgroundColor: color }]} />
            </PressableSpring>
          );
        })}
      </View>

      <View style={styles.previewCard}>
        <View style={[styles.previewSwatch, { backgroundColor: normalizedSelected }]} />
        <View style={styles.previewMeta}>
          <CoachText variant="caption" muted>
            {t('coach.portal.theme.selectedColor')}
          </CoachText>
          <CoachText variant="section" style={styles.previewHex}>
            {normalizedSelected}
          </CoachText>
        </View>
      </View>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  const swatchGap = spacing.sm;
  return StyleSheet.create({
    root: {
      gap: spacing.md,
    },
    headerStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm + 2,
      borderRadius: radius.lg,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    headerIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    headerTitle: {
      color: tokens.foreground,
      fontWeight: '800',
    },
    headerSubtitle: {
      fontWeight: '500',
    },
    familyRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    familyChip: {
      minHeight: 34,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    familyChipOn: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    familyChipTextOn: { color: tokens.accent, fontWeight: '800' },
    familyChipTextOff: { color: tokens.muted, fontWeight: '600' },
    swatchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: swatchGap,
      justifyContent: 'flex-start',
    },
    swatchWrap: {
      width: SWATCH_SIZE + 4,
      height: SWATCH_SIZE + 4,
      borderRadius: (SWATCH_SIZE + 4) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchWrapSelected: {
      borderColor: tokens.foreground,
    },
    swatch: {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: SWATCH_SIZE / 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewSwatch: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewMeta: {
      flex: 1,
      gap: spacing.xs,
    },
    previewHex: {
      color: tokens.foreground,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
  });
}
