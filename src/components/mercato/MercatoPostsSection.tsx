import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecruitmentAdCard } from '../ui/RecruitmentAdCard';
import { SkeletonList, InteractiveListItem, PressableSpring } from '../motion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import type { AppColors } from '../../theme/universeTheme';
import type { RecruitmentPost } from '../../models/Player';
import { formatTimeAgo } from '../../services/recruitment.service';
import { spacing, radius } from '../../theme/designTokens';

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
  onClearSearch?: () => void;
  onCreatePost?: () => void;
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
  onClearSearch,
  onCreatePost,
}) => (
  <View style={styles.wrap}>
    <Text style={[styles.title, { color: colors.text }]}>
      {title}
      {!loading && hasSpacePosts ? (
        <Text style={[styles.live, { color: colors.brand }]}> · En direct</Text>
      ) : null}
    </Text>
    {loading ? (
      <SkeletonList count={4} variant="row" />
    ) : posts.length === 0 ? (
      <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
        <Icon name="search" size={28} color={colors.textMuted} />
        <ProDayText variant="section">Aucune annonce</ProDayText>
        <ProDayText variant="body" muted style={styles.emptySub}>
          {resolveEmptyMessage(searchActive, hasSpacePosts, emptyFiltered, emptySpace, emptyAll)}
        </ProDayText>
        {searchActive && onClearSearch ? (
          <PressableSpring onPress={onClearSearch} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.emptyCta}>
              <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                Effacer la recherche
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        ) : onCreatePost ? (
          <PressableSpring onPress={onCreatePost} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.emptyCta}>
              <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                Publier une annonce
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        ) : null}
      </ProDaySurface>
    ) : (
      posts.map((ad, index) => (
        <InteractiveListItem key={ad.id} index={index}>
          <RecruitmentAdCard
            clubName={ad.club_name}
            roleLine={ad.title || `Recherche ${ad.position}`}
            meta={`${ad.category} · ${ad.level} · ${formatTimeAgo(ad.created_at)}`}
            onPress={() => onSelectPost(ad.id)}
          />
        </InteractiveListItem>
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
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  emptySub: { textAlign: 'center', lineHeight: 20 },
  emptyCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyCtaText: { fontWeight: '800' },
});
