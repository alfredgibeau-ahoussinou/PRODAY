import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import type { RecruitmentPost } from '../../models/Player';
import type { MercatoExperienceConfig } from '../../content/mercatoExperience';
import { type PostListFilters } from '../../utils/postFilters';
import type { MercatoAlertCriteria } from '../../services/mercatoAlerts.service';
import type { ProfileCompletionResult } from '../../utils/profileCompletion';
import type { MercatoPostRecommendation } from '../../core/recommendation/mercatoRecommendation.engine';
import { CandidatureSearchHeader } from './CandidatureSearchHeader';
import { CandidaturePostCard } from './CandidaturePostCard';
import { SkeletonList, InteractiveListItem } from '../motion';
import { ListEmptyPanel } from '../ui/ListEmptyPanel';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { formatTimeAgo } from '../../services/recruitment.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import { trackV3Event } from '../../core/analytics/v3Events';

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface CandidaturePostsPageProps {
  search: string;
  onSearchChange: (value: string) => void;
  config: MercatoExperienceConfig;
  postFilters: PostListFilters;
  onUpdatePostFilter: <K extends keyof PostListFilters>(key: K, value: PostListFilters[K]) => void;
  posts: RecruitmentPost[];
  alertCriteria: MercatoAlertCriteria | null;
  alertMatches: RecruitmentPost[];
  onToggleAlert: () => void;
  profileCompletion: ProfileCompletionResult;
  onSearchPlayers: (query?: string) => void;
  loading: boolean;
  filteredPosts: RecruitmentPost[];
  emptyMessage: string;
  filtersActive: boolean;
  onResetFilters: () => void;
  onSelectPost: (id: string) => void;
  useSmartRanking: boolean;
  mercatoScores: Map<string, MercatoPostRecommendation>;
  refreshing: boolean;
  onRefresh: () => void;
}

export const CandidaturePostsPage: React.FC<CandidaturePostsPageProps> = ({
  search,
  onSearchChange,
  config,
  postFilters,
  onUpdatePostFilter,
  posts,
  alertCriteria,
  alertMatches,
  onToggleAlert,
  profileCompletion,
  onSearchPlayers,
  loading,
  filteredPosts,
  emptyMessage,
  filtersActive,
  onResetFilters,
  onSelectPost,
  useSmartRanking,
  mercatoScores,
  refreshing,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const resultCountLabel = useMemo(() => {
    if (loading) return t('mercato.posts.loading');
    return t('mercato.posts.resultCount', { n: filteredPosts.length });
  }, [loading, filteredPosts.length, t]);

  return (
    <ScrollView
      contentContainerStyle={pagePad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <CandidatureSearchHeader
        config={config}
        search={search}
        onSearchChange={onSearchChange}
        postFilters={postFilters}
        onUpdatePostFilter={onUpdatePostFilter}
        posts={posts}
        filteredCount={filteredPosts.length}
        loading={loading}
        filtersActive={filtersActive}
        onResetFilters={onResetFilters}
        onSearchPlayers={onSearchPlayers}
        alertCriteria={alertCriteria}
        alertMatches={alertMatches}
        onToggleAlert={onToggleAlert}
        profileCompletion={profileCompletion}
      />

      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{config.postsSectionTitle}</Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {resultCountLabel}
        </Text>
      </View>

      {loading ? (
        <SkeletonList count={4} variant="card" />
      ) : filteredPosts.length === 0 ? (
        <ListEmptyPanel
          icon="search"
          title={t('mercato.posts.empty.title')}
          subtitle={emptyMessage}
          primaryCta={
            filtersActive
              ? { label: t('mercato.posts.empty.resetFilters'), onPress: onResetFilters }
              : { label: t('mercato.posts.empty.browsePlayers'), onPress: () => onSearchPlayers() }
          }
        />
      ) : (
        filteredPosts.map((post, index) => (
          <InteractiveListItem key={post.id} index={index}>
            <CandidaturePostCard
              clubName={post.club_name}
              title={post.title || `Recherche ${post.position}`}
              position={post.position}
              category={post.category}
              level={post.level}
              city={post.city}
              timeLabel={formatTimeAgo(post.created_at)}
              iaScore={useSmartRanking ? mercatoScores.get(post.id)?.iaScore : undefined}
              fitLabel={useSmartRanking ? mercatoScores.get(post.id)?.fitLabel : undefined}
              onPress={() => {
                if (useSmartRanking) {
                  trackV3Event('mercato_post_tap', {
                    postId: post.id,
                    iaScore: mercatoScores.get(post.id)?.iaScore ?? 0,
                  });
                }
                onSelectPost(post.id);
              }}
            />
          </InteractiveListItem>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.extrabold,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  sectionCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});
