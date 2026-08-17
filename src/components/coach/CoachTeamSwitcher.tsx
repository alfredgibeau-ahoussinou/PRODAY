import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { CoachText } from './coachPortalUi';
import { useTranslation } from '../../context/LocaleContext';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing, radius } from '../../theme/designTokens';

type Props = {
  /** Affiche le libellé « Équipe active » au-dessus des pastilles. */
  showLabel?: boolean;
};

function teamChipLabel(name: string, category?: string): string {
  const cat = category?.trim();
  return cat || name;
}

/** Pastilles de sélection d’équipe — visible uniquement si le coach en gère plusieurs. */
export function CoachTeamSwitcher({ showLabel = true }: Props) {
  const { t } = useTranslation();
  const { coachTeams, teamId, setActiveTeamId, tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  if (coachTeams.length <= 1) return null;

  return (
    <View style={styles.root} accessibilityRole="tablist">
      {showLabel ? (
        <CoachText variant="caption" muted style={styles.label}>
          {t('coach.portal.team.switchLabel')}
        </CoachText>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {coachTeams.map((team) => {
          const on = team.id === teamId;
          return (
            <PressableSpring
              key={team.id}
              onPress={() => setActiveTeamId(team.id)}
              scaleTo={0.97}
              haptic
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={team.name}
              style={[styles.chip, on && styles.chipOn]}
            >
              <CoachText
                variant="caption"
                inverse={on && !tokens.isLight}
                muted={!on}
                accent={on && tokens.isLight}
                style={styles.chipText}
                numberOfLines={1}
              >
                {teamChipLabel(team.name, team.category)}
              </CoachText>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: spacing.xs,
    },
    label: {
      fontWeight: '600',
      paddingHorizontal: spacing.xs,
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      maxWidth: 180,
    },
    chipOn: tokens.isLight
      ? {
          borderColor: tokens.accent,
          backgroundColor: tokens.soft,
        }
      : {
          borderColor: tokens.accent,
          backgroundColor: tokens.accent,
        },
    chipText: {
      fontWeight: '700',
    },
  });
}
