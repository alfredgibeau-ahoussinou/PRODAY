/**
 * Pôle Coach — Mes vidéos.
 *
 * Enveloppe Coach du **module Vidéo partagé** (`features/video/VideoWorkspace`). Elle
 * fournit les jetons du pôle Coach et le rôle, rien d'autre : mêmes sections, mêmes
 * captations autorisées, même lecteur que le pôle Club (aucune copie divergente).
 *
 * Ce qui a été retiré ici, et pourquoi : la version précédente affichait des clips
 * fabriqués (noms de joueurs inventés), une diffusion « 16 smartphones vestiaire »
 * déclenchée par un bouton, un accusé de partage de clip jamais envoyé et une palette de
 * telestration appliquée à une vidéo inexistante. Ces contrôles suggéraient des
 * intégrations qui n'existent pas : ils sont remplacés par l'état réel.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import { coachLayout } from '../../features/coach/theme/coachDesignSystem';
import { VideoWorkspace } from '../../features/video/VideoWorkspace';
import { coachVideoSurfaceTokens } from '../../features/video/videoSurfaceTokens';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';

export const CoachVideoHubScreen: React.FC = () => {
  const coachTokens = useCoachTokens();
  const tokens = coachVideoSurfaceTokens(coachTokens);

  return (
    <View style={styles.root}>
      <CoachScreenHeader title="Mes vidéos" fallbackNavId="plus" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <VideoWorkspace tokens={tokens} userRole="coach" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: coachLayout.pageGutter,
    paddingTop: coachLayout.contentTop,
    paddingBottom: coachLayout.dockClearance,
  },
});
