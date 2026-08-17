import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachChapterScroll, CoachEmptyState, CoachText } from '../../../components/coach/coachPortalUi';
import { CoachPane } from '../../../components/coach/CoachScreenHeader';
import { PressableSpring } from '../../../components/motion';
import { useCoachShellNav } from './CoachShellNavContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { spacing } from '../../../theme/designTokens';
import { useCoachThemedStyles } from './CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';

type Props = {
  item: CoachNavResolvedItem;
};

export function CoachLockedPane({ item }: Props) {
  const shellNav = useCoachShellNav();
  const styles = useCoachThemedStyles(createStyles);

  return (
    <CoachPane title={item.label}>
      <CoachChapterScroll>
        <View style={styles.stack}>
          <CoachText variant="section" style={styles.title}>
            {item.label}
          </CoachText>
          <CoachEmptyState
            title="Coach Pro requis"
            body={item.lockReason ?? 'Débloque ce module avec Coach Pro ou l’offre club Tout inclus.'}
            cta="Retour Calendrier"
            onPress={() => shellNav?.requestNav('today')}
          />
          <PressableSpring
            onPress={() => shellNav?.requestNav('forme')}
            scaleTo={0.98}
            style={styles.link}
          >
            <CoachText variant="caption" style={styles.linkText}>
              Voir Analyse de forme
            </CoachText>
          </PressableSpring>
        </View>
      </CoachChapterScroll>
    </CoachPane>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    stack: { gap: spacing.md },
    title: { color: tokens.foreground, fontWeight: '800' },
    link: { paddingVertical: spacing.sm },
    linkText: { color: tokens.accent, fontWeight: '700' },
  });
}
