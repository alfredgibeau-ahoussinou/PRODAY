import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import {
  CoachText,
} from '../coach/coachPortalUi';
import { coachChipContainerStyle, coachChipTextProps } from '../../utils/coachChipUi';
import {
  FOOTBALL_EVENT_CATEGORY_GROUPS,
  FOOTBALL_ROSTER_CATEGORIES,
  orderFootballCategoryGroups,
  type FootballCategoryGroup,
} from '../../constants/footballCategories';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

type ChipVariant = 'coach' | 'default';

type FootballCategoryChipPickerProps = {
  selected: string[];
  onToggle: (category: string) => void;
  variant?: ChipVariant;
  /** Groupes complets (événements) ou liste plate roster (match, besoin). */
  mode?: 'grouped' | 'flat';
  flatOptions?: readonly string[];
  /** Met ce groupe en tête (ex. adultes pour détection). */
  prioritizeGroup?: FootballCategoryGroup['id'];
  colors?: AppColors;
  style?: StyleProp<ViewStyle>;
};

function ChipLabel({
  variant,
  active,
  label,
  coachTokens,
  colors,
}: {
  variant: ChipVariant;
  active: boolean;
  label: string;
  coachTokens: CoachThemeTokens;
  colors?: AppColors;
}) {
  if (variant === 'coach') {
    return (
      <CoachText variant="caption" {...coachChipTextProps(active, coachTokens)}>
        {label}
      </CoachText>
    );
  }
  return (
    <ProDayText variant="caption" accent={active} muted={!active}>
      {label}
    </ProDayText>
  );
}

export function FootballCategoryChipPicker({
  selected,
  onToggle,
  variant = 'default',
  mode = 'grouped',
  flatOptions,
  prioritizeGroup,
  colors,
  style,
}: FootballCategoryChipPickerProps) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const coachStyles = useMemo(() => createCoachChipStyles(tokens), [tokens]);
  const defaultStyles = useMemo(
    () => (colors ? createDefaultChipStyles(colors) : null),
    [colors],
  );
  const groups = useMemo(
    () => orderFootballCategoryGroups(prioritizeGroup),
    [prioritizeGroup],
  );

  const renderChip = (cat: string) => {
    const active = selected.includes(cat);
    const chipStyle =
      variant === 'coach'
        ? [coachStyles.chip, coachChipContainerStyle(active, tokens)]
        : [
            defaultStyles!.chip,
            active && {
              backgroundColor: colors!.accent,
              borderColor: colors!.accent,
            },
          ];

    return (
      <PressableSpring
        key={cat}
        style={chipStyle}
        onPress={() => onToggle(cat)}
        scaleTo={0.96}
        haptic
      >
        <ChipLabel
          variant={variant}
          active={active}
          label={cat}
          coachTokens={tokens}
          colors={colors}
        />
      </PressableSpring>
    );
  };

  if (mode === 'flat') {
    const options = flatOptions ?? FOOTBALL_ROSTER_CATEGORIES;
    return (
      <View style={[coachStyles.row, style]}>
        {options.map(renderChip)}
      </View>
    );
  }

  return (
    <View style={[coachStyles.groups, style]}>
      {groups.map((group) => (
        <View key={group.id} style={coachStyles.groupBlock}>
          {variant === 'coach' ? (
            <CoachText variant="caption" muted style={coachStyles.groupLabel}>
              {t(group.labelKey)}
            </CoachText>
          ) : (
            <ProDayText variant="caption" muted style={defaultStyles?.groupLabel}>
              {t(group.labelKey)}
            </ProDayText>
          )}
          <View style={coachStyles.row}>{group.items.map(renderChip)}</View>
        </View>
      ))}
    </View>
  );
}

function createCoachChipStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    groups: { gap: spacing.md },
    groupBlock: { gap: spacing.xs },
    groupLabel: {
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
  });
}

function createDefaultChipStyles(c: AppColors) {
  return StyleSheet.create({
    groupLabel: {
      fontWeight: '800',
      color: c.textSecondary,
      marginBottom: spacing.xs,
      fontSize: 11,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
  });
}
