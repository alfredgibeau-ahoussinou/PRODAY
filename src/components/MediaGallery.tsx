import React from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme/designTokens';

interface MediaGalleryProps {
  urls: string[];
}

const THUMB = 88;

export const MediaGallery: React.FC<MediaGalleryProps> = ({ urls }) => {
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

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
});
