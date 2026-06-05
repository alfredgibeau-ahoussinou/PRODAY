import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament } from '../../models/Tournament';
import { formatTimeAgo } from '../../services/recruitment.service';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { discoverLayout, getDiscoverPalette, useDiscoverStyles } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';
import type { AppColors } from '../../theme/universeTheme';

interface DiscoverActivityStripProps {
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  onPress: () => void;
  variant?: 'default' | 'editorial' | 'immersive';
}

export const DiscoverActivityStrip: React.FC<DiscoverActivityStripProps> = ({
  posts,
  tournaments,
  loading,
  onPress,
  variant = 'default',
}) => {
  const { palette, colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c, palette), [c, palette]);
  const editorial = variant === 'editorial';
  const immersive = variant === 'immersive';
  const { pageWidth, pad, compact } = useDiscoverMetrics();
  const chipW = Math.min(168, Math.round(pageWidth * 0.44));
  const hasContent = posts.length > 0 || tournaments.length > 0;

  if (loading) {
    return (
      <ActivityIndicator
        color={immersive || editorial ? palette.text : c.brand}
        style={styles.loader}
      />
    );
  }

  if (!hasContent) {
    return (
      <View style={[styles.empty, (editorial || immersive) && styles.emptyDark]}>
        <Icon name="football-outline" size={22} color={immersive ? palette.muted : c.textMuted} />
        <Text style={styles.emptyText}>Les annonces et tournois apparaîtront ici.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      contentContainerStyle={[styles.rail, { paddingLeft: 0, paddingRight: pad }]}
    >
      {posts.slice(0, 4).map((ad) => (
        <Pressable
          key={ad.id}
          style={({ pressed }) => [
            styles.chip,
            (editorial || immersive) && styles.chipDark,
            compact && styles.chipCompact,
            { width: chipW },
            pressed && styles.chipPressed,
          ]}
          onPress={onPress}
        >
          <Text style={[styles.chipEyebrow, (editorial || immersive) && styles.chipEyebrowDark]}>
            Mercato
          </Text>
          <Text style={[styles.chipTitle, immersive && styles.chipTitleDark]} numberOfLines={1}>
            {ad.title || ad.position}
          </Text>
          <Text style={[styles.chipMeta, immersive && styles.chipMetaDark]} numberOfLines={1}>
            {ad.club_name} · {formatTimeAgo(ad.created_at)}
          </Text>
        </Pressable>
      ))}
      {tournaments.slice(0, 3).map((t) => (
        <Pressable
          key={t.id}
          style={({ pressed }) => [
            styles.chip,
            styles.chipArena,
            (editorial || immersive) && styles.chipDark,
            compact && styles.chipCompact,
            { width: chipW },
            pressed && styles.chipPressed,
          ]}
          onPress={onPress}
        >
          <Text style={[styles.chipEyebrow, (editorial || immersive) && styles.chipEyebrowDark]}>
            Arena
          </Text>
          <Text style={[styles.chipTitle, immersive && styles.chipTitleDark]} numberOfLines={1}>
            {t.name}
          </Text>
          <Text style={[styles.chipMeta, immersive && styles.chipMetaDark]} numberOfLines={1}>
            {t.city}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

function createStyles(c: AppColors, palette: ReturnType<typeof getDiscoverPalette>) {
  return StyleSheet.create({
    loader: { marginVertical: spacing.lg },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyText: {
      flex: 1,
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
      lineHeight: 18,
    },
    rail: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      padding: spacing.md,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipArena: {},
    chipPressed: { opacity: 0.88 },
    chipEyebrow: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: 4,
    },
    chipTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.2,
    },
    chipMeta: {
      marginTop: 4,
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '500',
    },
    emptyDark: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: discoverLayout.cardRadius,
    },
    chipDark: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: discoverLayout.cardRadius,
    },
    chipEyebrowDark: { color: palette.faint },
    chipTitleDark: { color: palette.text },
    chipMetaDark: { color: palette.muted },
    chipCompact: { padding: spacing.sm + 2 },
  });
}
