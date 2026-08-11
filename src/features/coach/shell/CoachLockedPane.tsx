import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachChapterScroll, CoachEmptyState } from '../../../components/coach/coachPortalUi';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring } from '../../../components/motion';
import { useCoachShellNav } from './CoachShellNavContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { COACH_SITE } from '../../../content/coachPageIdentity';
import { spacing } from '../../../theme/designTokens';

type Props = {
  item: CoachNavResolvedItem;
};

export function CoachLockedPane({ item }: Props) {
  const shellNav = useCoachShellNav();

  return (
    <CoachChapterScroll>
      <View style={styles.stack}>
        <ProDayText variant="section" style={styles.title}>
          {item.label} · hors formule
        </ProDayText>
        <ProDayText variant="caption" muted>
          {item.lockReason ?? 'Ce module n’est pas inclus dans ton offre actuelle.'}
        </ProDayText>
        <CoachEmptyState
          title="Passe en Coach Pro"
          body="Ou demande à ton club l’offre Tout inclus pour débloquer Tactique IA."
          cta="Retour Aujourd’hui"
          onPress={() => shellNav?.requestNav('today')}
        />
        <PressableSpring
          onPress={() => shellNav?.requestNav('forme')}
          scaleTo={0.98}
          style={styles.link}
        >
          <ProDayText variant="caption" style={styles.linkText}>
            Voir Analyse de forme (disponible)
          </ProDayText>
        </PressableSpring>
      </View>
    </CoachChapterScroll>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  title: { color: COACH_SITE.foreground, fontWeight: '800' },
  link: { paddingVertical: spacing.sm },
  linkText: { color: COACH_SITE.accent, fontWeight: '700' },
});
