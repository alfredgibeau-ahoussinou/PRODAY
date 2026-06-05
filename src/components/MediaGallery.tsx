import React, { useMemo } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

interface MediaGalleryProps {
  urls: string[];
}

const THUMB = 88;

export const MediaGallery: React.FC<MediaGalleryProps> = ({ urls }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  if (!urls.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {urls.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.thumb} />
      ))}
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
  });
}
