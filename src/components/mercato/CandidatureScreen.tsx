import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import type { RecruitmentPost } from '../../models/Player';
import type { RecruitmentStats } from '../../services/stats.service';
import type { MercatoExperienceConfig } from '../../content/mercatoExperience';
import type { ProductLineId } from '../../models/ProductLine';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { CandidaturePager } from './CandidaturePager';
import { CandidaturePostsPage } from './CandidaturePostsPage';
import { CandidatureSuiviPage } from './CandidatureSuiviPage';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { TabScreenShell } from '../app/TabScreenShell';
import { useCandidatureMercato } from '../../hooks/useCandidatureMercato';
import { trackV3Event } from '../../core/analytics/v3Events';

interface CandidatureScreenProps {
  profile: User;
  config: MercatoExperienceConfig;
  stats: RecruitmentStats | null;
  loading: boolean;
  posts: RecruitmentPost[];
  search: string;
  onSearchChange: (v: string) => void;
  emptyMessage: string;
  applicationsCount: number;
  productLine: ProductLineId;
  onSelectPost: (id: string) => void;
  onOpenApplications: () => void;
  onSearchPlayers: (query?: string) => void;
  onRefresh?: () => Promise<void>;
}

export const CandidatureScreen: React.FC<CandidatureScreenProps> = ({
  profile,
  config,
  stats,
  loading,
  posts,
  search,
  onSearchChange,
  emptyMessage,
  applicationsCount,
  productLine,
  onSelectPost,
  onOpenApplications,
  onSearchPlayers,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const mercato = useCandidatureMercato(
    profile,
    productLine,
    posts,
    search,
    applicationsCount,
    config,
    onRefresh
  );

  const handleSelectPost = (postId: string) => {
    if (mercato.useSmartRanking) {
      trackV3Event('mercato_post_tap', {
        postId,
        iaScore: mercato.mercatoScores.get(postId)?.iaScore ?? 0,
      });
    }
    onSelectPost(postId);
  };

  const pages = [
    {
      id: 'annonces' as const,
      render: () => (
        <CandidaturePostsPage
          config={config}
          posts={posts}
          search={search}
          onSearchChange={onSearchChange}
          loading={loading}
          emptyMessage={emptyMessage}
          onSearchPlayers={onSearchPlayers}
          postFilters={mercato.postFilters}
          onUpdatePostFilter={mercato.updatePostFilter}
          onResetFilters={mercato.resetPostFilters}
          filtersActive={mercato.filtersActive}
          filteredPosts={mercato.filteredPosts}
          alertCriteria={mercato.alertCriteria}
          alertMatches={mercato.alertMatches}
          onToggleAlert={() => void mercato.toggleAlert()}
          profileCompletion={mercato.profileCompletion}
          mercatoScores={mercato.mercatoScores}
          useSmartRanking={mercato.useSmartRanking}
          refreshing={mercato.refreshing}
          onRefresh={mercato.handleRefresh}
          onSelectPost={handleSelectPost}
        />
      ),
    },
    {
      id: 'suivi' as const,
      render: () => (
        <CandidatureSuiviPage
          applicationsCount={applicationsCount}
          applications={mercato.applications}
          loadingApps={mercato.loadingApps}
          refreshing={mercato.refreshing}
          onRefresh={mercato.handleRefresh}
          onSelectPost={handleSelectPost}
          onOpenApplications={onOpenApplications}
          onGoToAnnonces={() => mercato.setChapter('annonces')}
        />
      ),
    },
  ];

  const applicationsBadge = (
    <PressableSpring
      style={[
        styles.topStat,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong },
      ]}
      onPress={applicationsCount > 0 ? onOpenApplications : undefined}
      disabled={applicationsCount === 0}
      scaleTo={0.97}
      haptic={applicationsCount > 0}
    >
      <ProDayText variant="section" accent={applicationsCount > 0}>
        {applicationsCount}
      </ProDayText>
      <ProDayText variant="caption" muted>
        envoyées
      </ProDayText>
    </PressableSpring>
  );

  const pager = (
    <CandidaturePager
      pages={pages}
      activeChapter={mercato.chapter}
      onChapterChange={mercato.setChapter}
      suiviBadge={applicationsCount}
    />
  );

  return (
    <TabScreenShell
      title={config.screenTitle}
      subtitle={config.screenSubtitle}
      right={applicationsBadge}
      flat
    >
      {pager}
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
});
