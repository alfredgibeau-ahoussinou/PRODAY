/**
 * Pôle Club — Hub Vidéo, Analyse & Smart Highlights.
 *
 * Enveloppe Club du **module Vidéo partagé** (`features/video/VideoWorkspace`) : elle ne
 * fournit que les jetons du pôle, le nom du club et le panneau de connexion Club. Toute la
 * logique, les sections et les états honnêtes vivent dans le module partagé, rendu à
 * l'identique par le pôle Coach — aucune copie divergente de la donnée vidéo.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubSpace } from '../theme/clubDesignSystem';
import { VideoWorkspace } from '../../video/VideoWorkspace';

/** Types du module partagé, ré-exportés pour les consommateurs existants. */
export type {
  HighlightTag,
  MatchVideoItem,
  SmartClipItem,
  VideoSource,
} from '../../video/VideoWorkspace';

import type { MatchVideoItem, SmartClipItem } from '../../video/VideoWorkspace';

type Props = {
  videos?: MatchVideoItem[];
  clips?: SmartClipItem[];
  clubId?: string | null;
  createdByUid?: string | null;
  userRole?: string;
  onPlayVideo?: (videoId: string) => void;
  onPlayClip?: (clipId: string) => void;
};

export function ClubVideoHub({
  videos = [],
  clips = [],
  clubId,
  createdByUid,
  userRole = 'club',
  onPlayVideo,
  onPlayClip,
}: Props) {
  const { tokens, club } = useClubTheme();

  return (
    <View style={styles.container}>
      <VideoWorkspace
        tokens={tokens}
        userRole={userRole}
        clubId={clubId}
        clubLabel={club?.name ?? null}
        createdByUid={createdByUid}
        videos={videos}
        clips={clips}
        onPlayVideo={onPlayVideo}
        onPlayClip={onPlayClip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: clubSpace.lg,
  },
});
