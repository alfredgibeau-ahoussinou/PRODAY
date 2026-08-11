import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { CLUB_MATCH_INVITE_STEPS } from '../../content/clubPoleExperience';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Props = {
  onOrganize: () => void;
  onPropose: () => void;
  onOpenConvocations?: () => void;
};

/** Funnel invitations de match — aligné site `#invitations-match`. */
export function ClubMatchInvitePanel({ onOrganize, onPropose, onOpenConvocations }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="eyebrow" accent>
        Matchs entre clubs
      </ProDayText>
      <ProDayText variant="section" style={styles.title}>
        Trouvez un adversaire. Organisez le match. Sans WhatsApp.
      </ProDayText>
      <ProDayText variant="caption" muted>
        Clubs et coachs autorisés proposent un match dans ProDay : nom, ville, distance,
        catégorie. Espace « Matchs à organiser » : reçues, envoyées, contre-propositions,
        confirmés.
      </ProDayText>

      <View style={styles.steps}>
        {CLUB_MATCH_INVITE_STEPS.map((step) => (
          <ProDaySurface
            key={step.n}
            variant="module"
            style={[styles.step, { borderColor: colors.border }]}
          >
            <ProDayText variant="caption" accent>
              {step.n}
            </ProDayText>
            <ProDayText variant="section">{step.title}</ProDayText>
            <ProDayText variant="caption" muted>
              {step.body}
            </ProDayText>
          </ProDaySurface>
        ))}
      </View>

      <View style={styles.ctaRow}>
        <PressableSpring
          onPress={onOrganize}
          scaleTo={0.97}
          haptic
          style={[styles.ctaPrimary, { backgroundColor: colors.accent }]}
        >
          <ProDayText variant="caption" style={styles.ctaInverse}>
            Matchs à organiser
          </ProDayText>
        </PressableSpring>
        <PressableSpring
          onPress={onPropose}
          scaleTo={0.97}
          style={[styles.ctaSecondary, { borderColor: colors.border }]}
        >
          <ProDayText variant="caption" accent style={styles.link}>
            Proposer un match
          </ProDayText>
        </PressableSpring>
        {onOpenConvocations ? (
          <PressableSpring onPress={onOpenConvocations} scaleTo={0.97}>
            <ProDayText variant="caption" muted style={styles.link}>
              Convocations & retards
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    title: { fontWeight: '800', letterSpacing: -0.3 },
    steps: { gap: spacing.sm },
    step: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
    ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
    ctaPrimary: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ctaSecondary: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ctaInverse: { color: '#fff', fontWeight: '800' },
    link: { fontWeight: '800' },
  });
}
