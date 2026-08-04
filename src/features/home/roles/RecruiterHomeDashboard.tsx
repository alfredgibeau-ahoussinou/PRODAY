import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { StaffRoleHomeProps } from './resolveRoleHomeDashboard';
import {
  StaffRoleHomeShell,
  StaffSectionTitle,
  StaffStatRow,
  StaffQuickActions,
  StaffListCard,
  StaffEmptyCard,
} from './staffRoleHomeShared';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useStaffMercatoPipeline } from '../../../hooks/useStaffMercatoPipeline';
import { useRecruiterRecommendations } from '../../../hooks/useRecruiterRecommendations';
import { useSmartMatch } from '../../../hooks/useSmartMatch';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useTranslation } from '../../../context/LocaleContext';
import { recruitmentService } from '../../../services/recruitment.service';
import type { Application, RecruitmentPost } from '../../../models/Player';
import type { RolePanelAction } from '../../../content/roleDashboardExperience';
import { PressableSpring } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { SmartMatchPanel } from '../../../components/recruitment/SmartMatchPanel';
import { spacing } from '../../../theme/designTokens';
import { StyleSheet } from 'react-native';

export const RecruiterHomeDashboard: React.FC<StaffRoleHomeProps> = ({
  profile,
  unreadMessages,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { data, refresh } = useDashboardData(profile);
  const pipeline = useStaffMercatoPipeline(profile);
  const nav = useTabNavigationActions();

  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [extraLoading, setExtraLoading] = useState(true);

  const latestPost = posts[0] ?? null;
  const recommendations = useRecruiterRecommendations(latestPost);
  const smartMatch = useSmartMatch(profile);

  const loadPipeline = useCallback(async () => {
    setExtraLoading(true);
    try {
      const openPosts = await recruitmentService.listOpenPosts(40);
      const mine = openPosts
        .filter((p) => p.author_uid === profile.uid)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      setPosts(mine);
      if (mine.length === 0) {
        setApplications([]);
        return;
      }
      const batches = await Promise.all(
        mine.slice(0, 5).map((p) => recruitmentService.listApplicationsForPost(p.id, 10))
      );
      const flat = batches
        .flat()
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      setApplications(flat);
    } finally {
      setExtraLoading(false);
    }
  }, [profile.uid]);

  useEffect(() => {
    void loadPipeline();
  }, [loadPipeline]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadPipeline(), smartMatch.refresh()]);
    await recommendations.refresh();
    await onRefresh?.();
  }, [refresh, loadPipeline, recommendations, onRefresh, smartMatch]);

  const pendingCount = useMemo(
    () => applications.filter((a) => a.status === 'PENDING').length,
    [applications]
  );

  const handleQuickAction = (action: RolePanelAction) => {
    if (action.title === 'Mercato' || action.title === 'Mercato Pro') {
      nav.openMercato('create_post');
      return;
    }
    if (action.title === 'Scouting') {
      nav.openMercato('talent_radar');
      return;
    }
    if (action.title === 'Covoiturage') {
      nav.openCarpool();
    }
  };

  return (
    <StaffRoleHomeShell
      profile={profile}
      role="recruiter"
      unreadMessages={unreadMessages}
      globalScore={data.pulse.score}
      loading={data.loading || extraLoading || pipeline.loading}
      onRefresh={() => void handleRefresh()}
      refreshing={refreshing}
    >
      <StaffSectionTitle
        title={t('roleHome.recruiter.pipelineTitle')}
        subtitle={t('roleHome.recruiter.pipelineSub')}
      />
      <StaffStatRow
        items={[
          {
            label: t('roleHome.recruiter.activePosts'),
            value: String(pipeline.myPostsCount),
            highlight: true,
          },
          {
            label: t('roleHome.recruiter.pendingApps'),
            value: String(pendingCount),
          },
          {
            label: t('roleHome.recruiter.recommended'),
            value: String(recommendations.matches.length),
          },
        ]}
      />

      {applications.length === 0 ? (
        <StaffEmptyCard message={t('roleHome.recruiter.noApplications')} />
      ) : (
        applications.slice(0, 5).map((app, index) => (
          <StaffListCard
            key={app.id}
            index={index + 1}
            title={app.player_name ?? app.player_uid.slice(0, 8)}
            subtitle={app.cover_letter}
            meta={app.status}
            onPress={() => nav.openMercato('home')}
          />
        ))
      )}

      <StaffSectionTitle
        title={t('recruiter.recommendations.title')}
        subtitle={t('recruiter.recommendations.subtitle')}
      />
      {recommendations.loading ? null : recommendations.matches.length === 0 ? (
        <StaffEmptyCard message={t('recruiter.recommendations.empty')} />
      ) : (
        recommendations.matches.slice(0, 4).map((match, index) => (
          <StaffListCard
            key={match.player.uid}
            index={index + 2}
            title={match.player.display_name}
            subtitle={`${match.player.profile.position ?? ''} · ${match.player.city ?? ''}`.trim()}
            meta={`${match.score}%`}
            onPress={() => nav.openMercato('players')}
          />
        ))
      )}

      <StaffSectionTitle title={t('smartMatch.title')} subtitle={t('smartMatch.subtitle')} />
      <SmartMatchPanel
        edges={smartMatch.edges}
        loading={smartMatch.loading}
        onOpenMercato={() => nav.openMercato('talent_radar')}
        onOpenPlayer={() => nav.openMercato('players')}
        onOpenPost={() => nav.openMercato('home')}
      />

      <GlassCard variant="accent" style={styles.cta}>
        <ProDayText variant="section">{t('roleHome.recruiter.mercatoCta')}</ProDayText>
        <ProDayText variant="caption" muted>
          {t('roleHome.recruiter.mercatoCtaSub')}
        </ProDayText>
        <PressableSpring
          style={styles.ctaBtn}
          onPress={() => nav.openMercato('create_post')}
          scaleTo={0.97}
          haptic
        >
          <ProDayText variant="body" accent>
            {t('roleHome.recruiter.publish')}
          </ProDayText>
        </PressableSpring>
      </GlassCard>

      <StaffSectionTitle title={t('roleHome.quickActions')} />
      <StaffQuickActions role="recruiter" onAction={handleQuickAction} />

      <StaffSectionTitle title={t('roleHome.recruiter.fffAgentsTitle')} />
      <StaffListCard
        index={10}
        title={t('roleHome.recruiter.fffAgents')}
        subtitle={t('roleHome.recruiter.fffAgentsSub')}
        onPress={() => nav.openMercato('home')}
      />
    </StaffRoleHomeShell>
  );
};

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
