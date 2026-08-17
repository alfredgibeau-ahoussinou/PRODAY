import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CoachText } from './coachPortalUi';
import { spacing } from '../../theme/designTokens';
import { useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  clampCoachRating,
  COACH_RATING_MAX,
  formatCoachRating,
  type CoachRatingField,
} from '../../utils/coachEvaluationRatings';

type Props = {
  label: string;
  field: CoachRatingField;
  value?: number;
  onChange: (field: CoachRatingField, value: number | undefined) => void;
};

/** Entrée compacte /10 — optionnelle, +/- par pas de 0,5. */
export function CoachOptionalScoreInput({ label, field, value, onChange }: Props) {
  const styles = useCoachThemedStyles(createStyles);
  const display = value != null ? formatCoachRating(value) : '—';

  const step = (delta: number) => {
    if (value == null && delta > 0) {
      onChange(field, 5);
      return;
    }
    if (value == null) return;
    const next = clampCoachRating(value + delta);
    onChange(field, next);
  };

  return (
    <View style={styles.row}>
      <CoachText variant="caption" muted style={styles.label} numberOfLines={1}>
        {label}
      </CoachText>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={`Diminuer ${label}`}
          onPress={() => step(-0.5)}
          style={styles.stepBtn}
          disabled={value == null}
        >
          <CoachText variant="caption" muted>
            −
          </CoachText>
        </Pressable>
        <CoachText variant="caption" style={styles.value}>
          {display}
        </CoachText>
        <Pressable
          accessibilityLabel={`Augmenter ${label}`}
          onPress={() => step(0.5)}
          style={styles.stepBtn}
        >
          <CoachText variant="caption" accent>
            +
          </CoachText>
        </Pressable>
        {value != null ? (
          <Pressable
            accessibilityLabel={`Effacer ${label}`}
            onPress={() => onChange(field, undefined)}
            style={styles.clearBtn}
          >
            <CoachText variant="caption" muted style={styles.clearText}>
              ×
            </CoachText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function CoachOptionalScoresBlock({
  values,
  onChange,
}: {
  values: Partial<Record<CoachRatingField, number | undefined>>;
  onChange: (field: CoachRatingField, value: number | undefined) => void;
}) {
  const styles = useCoachThemedStyles(createStyles);

  return (
    <View style={styles.block}>
      <CoachText variant="caption" muted style={styles.blockHint}>
        Scores optionnels /{COACH_RATING_MAX} — enrichissent l’analyse IA.
      </CoachText>
      {(
        [
          { key: 'overall' as const, label: 'Générale' },
          { key: 'technical' as const, label: 'Technique' },
          { key: 'tactical' as const, label: 'Tactique' },
          { key: 'physical' as const, label: 'Physique' },
          { key: 'mental' as const, label: 'Mental' },
        ] as const
      ).map(({ key, label }) => (
        <CoachOptionalScoreInput
          key={key}
          field={key}
          label={label}
          value={values[key]}
          onChange={onChange}
        />
      ))}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    block: {
      gap: 6,
      paddingVertical: spacing.xs,
    },
    blockHint: { marginBottom: 2, fontSize: 11 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    label: { flex: 1, fontSize: 12 },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stepBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    value: {
      minWidth: 44,
      textAlign: 'center',
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    clearBtn: {
      marginLeft: 2,
      paddingHorizontal: 4,
    },
    clearText: { fontSize: 16, lineHeight: 18 },
  });
}
