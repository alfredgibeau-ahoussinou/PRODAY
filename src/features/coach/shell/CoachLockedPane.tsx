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
import {
  coachVideoLockBody,
  coachVideoLockTitle,
} from '../../../utils/coachVideoHonesty';

type Props = {
  item: CoachNavResolvedItem;
};

export function CoachLockedPane({ item }: Props) {
  const shellNav = useCoachShellNav();
  const styles = useCoachThemedStyles(createStyles);
  const isVideo = Boolean(item.requiresVideo);

  return (
    <CoachPane title={item.label}>
      <CoachChapterScroll>
        <View style={styles.stack}>
          <CoachText variant="section" style={styles.title}>
            {item.label}
          </CoachText>
          <CoachEmptyState
            title={isVideo ? coachVideoLockTitle() : 'Coach Pro requis'}
            body={
              isVideo
                ? coachVideoLockBody(item.lockReason)
                : item.lockReason ??
                  'Débloque ce module avec Coach Pro ou l’offre club Tout inclus.'
            }
            cta={isVideo ? 'Ouvrir Profil' : 'Retour Calendrier'}
            onPress={() => shellNav?.requestNav(isVideo ? 'profil' : 'today')}
          />
          {isVideo ? (
            <CoachText variant="caption" muted style={styles.note}>
              Le club gère pack / devis vidéo (Tout inclus, Pro + Veo). L’app coach n’ouvre pas
              d’OAuth fabricant.
            </CoachText>
          ) : null}
          <PressableSpring
            onPress={() => shellNav?.requestNav(isVideo ? 'today' : 'forme')}
            scaleTo={0.98}
            style={styles.link}
          >
            <CoachText variant="caption" style={styles.linkText}>
              {isVideo ? 'Retour Accueil jour J' : 'Voir Analyse de forme'}
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
    note: { color: tokens.muted, lineHeight: 18 },
    link: { paddingVertical: spacing.sm },
    linkText: { color: tokens.accent, fontWeight: '700' },
  });
}
