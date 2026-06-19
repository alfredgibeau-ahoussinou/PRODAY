import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ReelNativeVideo } from '../reels/ReelNativeVideo';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminReelVideoPreviewProps {
  videoUrl: string;
  posterUrl?: string;
  active?: boolean;
  colors: AppColors;
}

export const AdminReelVideoPreview: React.FC<AdminReelVideoPreviewProps> = ({
  videoUrl,
  active = true,
  colors: c,
}) => {
  const styles = useMemo(() => createStyles(c), [c]);

  if (!videoUrl?.trim()) {
    return <View style={[styles.box, styles.empty]} />;
  }

  return (
    <View style={styles.box}>
      <ReelNativeVideo
        playbackSource={{ uri: videoUrl }}
        isActive={active}
        paused={!active}
        isMuted
        onError={() => undefined}
      />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    box: {
      width: '100%',
      height: 220,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: c.ink,
      marginBottom: spacing.sm,
    },
    empty: { backgroundColor: c.surfaceMuted },
  });
}
