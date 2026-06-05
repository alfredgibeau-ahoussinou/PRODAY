import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { RecruitmentAdCard } from '../ui/RecruitmentAdCard';
import type { AppColors } from '../../theme/universeTheme';
import type { RecruitmentPost } from '../../models/Player';
import { formatTimeAgo } from '../../services/recruitment.service';
import { spacing } from '../../theme/designTokens';

interface MercatoPostsSectionProps {
  colors: AppColors;
  title: string;
  loading: boolean;
  posts: RecruitmentPost[];
  hasSpacePosts: boolean;
  searchActive: boolean;
  emptyAll: string;
  emptySpace: string;
  emptyFiltered: string;
  onSelectPost: (id: string) => void;
}

function resolveEmptyMessage(
  searchActive: boolean,
  hasSpacePosts: boolean,
  emptyFiltered: string,
  emptySpace: string,
  emptyAll: string
): string {
  if (searchActive) return emptyFiltered;
  if (!hasSpacePosts) return emptySpace;
  return emptyAll;
}

export const MercatoPostsSection: React.FC<MercatoPostsSectionProps> = ({
  colors,
  title,
  loading,
  posts,
  hasSpacePosts,
  searchActive,
  emptyAll,
  emptySpace,
  emptyFiltered,
  onSelectPost,
}) => (
  <View style={styles.wrap}>
    <Text style={[styles.title, { color: colors.text }]}>
      {title}
      {!loading && hasSpacePosts ? (
        <Text style={[styles.live, { color: colors.brand }]}> · En direct</Text>
      ) : null}
    </Text>
    {loading ? (
      <ActivityIndicator color={colors.brand} style={styles.loader} />
    ) : posts.length === 0 ? (
      <Text style={[styles.empty, { color: colors.textSecondary }]}>
        {resolveEmptyMessage(searchActive, hasSpacePosts, emptyFiltered, emptySpace, emptyAll)}
      </Text>
    ) : (
      posts.map((ad) => (
        <RecruitmentAdCard
          key={ad.id}
          clubName={ad.club_name}
          roleLine={ad.title || `Recherche ${ad.position}`}
          meta={`${ad.category} · ${ad.level} · ${formatTimeAgo(ad.created_at)}`}
          onPress={() => onSelectPost(ad.id)}
        />
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  live: {
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  loader: { marginVertical: spacing.lg },
});
