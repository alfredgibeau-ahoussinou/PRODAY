import React from 'react';
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
import { colors, spacing, radius } from '../../theme/designTokens';
import { discoverPalette, discoverLayout } from './discoverStyles';
import { useDiscoverMetrics } from './useDiscoverMetrics';

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
  const editorial = variant === 'editorial';
  const immersive = variant === 'immersive';
  const { pageWidth, pad, compact } = useDiscoverMetrics();
  const chipW = Math.min(168, Math.round(pageWidth * 0.44));
  const hasContent = posts.length > 0 || tournaments.length > 0;

  if (loading) {
    return (
      <ActivityIndicator
        color={immersive || editorial ? discoverPalette.text : colors.accent}
        style={styles.loader}
      />
    );
  }

  if (!hasContent) {
    return (
      <View style={[styles.empty, (editorial || immersive) && styles.emptyDark]}>
        <Icon name="football-outline" size={22} color={immersive ? discoverPalette.muted : colors.textMuted} />
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

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.lg },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  rail: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipArena: {},
  chipPressed: { opacity: 0.88 },
  chipEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 4,
  },
  chipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  chipMeta: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyEditorial: {
    backgroundColor: discoverPalette.surface,
    borderColor: discoverPalette.border,
    borderRadius: discoverLayout.cardRadius,
  },
  emptyDark: {
    backgroundColor: discoverPalette.surface,
    borderColor: discoverPalette.border,
    borderRadius: discoverLayout.cardRadius,
  },
  chipEditorial: {
    backgroundColor: discoverPalette.surface,
    borderColor: discoverPalette.border,
    borderRadius: discoverLayout.cardRadius,
  },
  chipDark: {
    backgroundColor: discoverPalette.surface,
    borderColor: discoverPalette.border,
    borderRadius: discoverLayout.cardRadius,
  },
  chipEyebrowEditorial: { color: discoverPalette.faint },
  chipEyebrowDark: { color: discoverPalette.faint },
  chipTitleDark: { color: discoverPalette.text },
  chipMetaDark: { color: discoverPalette.muted },
  chipCompact: { padding: spacing.sm + 2 },
});
