import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { User } from '../../models/User';
import type { RecruitmentPost } from '../../models/Player';
import type { RecruitmentStats } from '../../services/stats.service';
import type { MercatoExperienceConfig, MercatoQuickTileId } from '../../content/mercatoExperience';
import {
  type MercatoStaffChapterId,
} from '../../content/mercatoStaffChapters';
import { getMercatoStaffChapters } from '../../i18n/localizedChapters';
import { AppTabHeader } from '../app';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PressableSpring } from '../motion';
import { MercatoQuickGrid } from './MercatoQuickGrid';
import { MercatoActionRow } from './MercatoActionRow';
import { MercatoPostsSection } from './MercatoPostsSection';
import { AppSpaceBanner } from '../appSpace/AppSpaceBanner';
import { SearchBar } from '../ui/SearchBar';
import { Icon } from '../ui/Icon';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { ProDayActionTiles } from '../ui/ProDayActionTiles';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { formatCount } from '../../services/stats.service';
import type { AppColors } from '../../theme/universeTheme';
import type { ProductLineId } from '../../models/ProductLine';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { TabScreenShell } from '../app/TabScreenShell';
import { useTranslation } from '../../context/LocaleContext';
import {
  countAuthorPosts,
  countPendingApplications,
  summarizeStaffMercato,
} from '../../features/v3/engines/mercatoStaff.engine';
import { recruitmentService } from '../../services/recruitment.service';
import { trackV3Event } from '../../core/analytics/v3Events';

interface MercatoStaffHomeProps {
  profile: User | null;
  config: MercatoExperienceConfig;
  themeColors: AppColors;
  productLine: ProductLineId;
  stats: RecruitmentStats | null;
  loading: boolean;
  filteredPosts: RecruitmentPost[];
  spacePosts: RecruitmentPost[];
  search: string;
  onSearchChange: (q: string) => void;
  headerRight?: React.ReactNode;
  showSpaceBanner: boolean;
  onOpenMenHub: () => void;
  onOpenWomenHub: () => void;
  onOpenUnderU13Hub: () => void;
  onQuickTile: (id: MercatoQuickTileId) => void;
  onFavorites: () => void;
  onStaff: () => void;
  onSelectPost: (id: string) => void;
  onCreatePost?: () => void;
  onSearchPlayers: () => void;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

export const MercatoStaffHome: React.FC<MercatoStaffHomeProps> = ({
  profile,
  config,
  themeColors,
  productLine,
  stats,
  loading,
  filteredPosts,
  spacePosts,
  search,
  onSearchChange,
  headerRight,
  showSpaceBanner,
  onOpenMenHub,
  onOpenWomenHub,
  onOpenUnderU13Hub,
  onQuickTile,
  onFavorites,
  onStaff,
  onSelectPost,
  onCreatePost,
  onSearchPlayers,
}) => {
  const [chapter, setChapter] = useState<MercatoStaffChapterId>('explorer');
  const { t } = useTranslation();
  const staffChapters = useMemo(() => getMercatoStaffChapters(t), [t]);
  const [pendingApplications, setPendingApplications] = useState(0);

  const authorUid = profile?.uid ?? '';

  const myPosts = useMemo(
    () => (authorUid ? spacePosts.filter((post) => post.author_uid === authorUid) : []),
    [spacePosts, authorUid]
  );

  const staffSummary = useMemo(
    () =>
      summarizeStaffMercato({
        posts: spacePosts,
        authorUid,
        pendingApplications,
      }),
    [spacePosts, authorUid, pendingApplications]
  );

  const loadPendingApplications = useCallback(async () => {
    if (myPosts.length === 0) {
      setPendingApplications(0);
      return;
    }
    const batches = await Promise.all(
      myPosts.slice(0, 8).map((post) => recruitmentService.listApplicationsForPost(post.id))
    );
    setPendingApplications(countPendingApplications(batches.flat()));
  }, [myPosts]);

  useEffect(() => {
    void loadPendingApplications();
  }, [loadPendingApplications]);

  useEffect(() => {
    if (!profile) return;
    trackV3Event('mercato_staff_open', {
      myPosts: staffSummary.myPostsCount,
      pendingApplications: staffSummary.pendingApplications,
    });
  }, [profile, staffSummary.myPostsCount, staffSummary.pendingApplications]);

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  const toolItems = useMemo(
    () =>
      [
        config.showFavoritesRow
          ? { id: 'favorites', label: t('mercato.tools.favorites'), icon: 'bookmark' as const, onPress: onFavorites }
          : null,
        config.showDetectionsHeader
          ? { id: 'detections', label: t('mercato.tools.detections'), icon: 'football' as const, onPress: () => onQuickTile('detections') }
          : null,
        config.quickTiles.some((tile) => tile.id === 'stages')
          ? {
              id: 'stages',
              label: t('mercato.tools.stages'),
              icon: 'calendar' as const,
              onPress: () => onQuickTile('stages'),
            }
          : null,
        config.quickTiles.some((tile) => tile.id === 'talent_radar')
          ? {
              id: 'talent_radar',
              label: 'Radar talents',
              icon: 'star-four-points' as const,
              onPress: () => onQuickTile('talent_radar'),
            }
          : null,
        config.quickTiles.some((tile) => tile.id === 'compare')
          ? {
              id: 'compare',
              label: 'Comparer',
              icon: 'tune' as const,
              onPress: () => onQuickTile('compare'),
            }
          : null,
        onCreatePost
          ? { id: 'create', label: config.fabLabel, icon: 'add' as const, onPress: onCreatePost }
          : null,
      ].filter(Boolean) as {
        id: string;
        label: string;
        icon: 'bookmark' | 'football' | 'calendar' | 'add' | 'star-four-points' | 'tune';
        onPress: () => void;
      }[],
    [config, onFavorites, onQuickTile, onCreatePost, t]
  );

  const pages = useMemo(
    () => [
      {
        id: 'explorer' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            {showSpaceBanner ? (
              <AppSpaceBanner
                showHubLinks
                onOpenMenHub={onOpenMenHub}
                onOpenWomenHub={onOpenWomenHub}
                onOpenUnderU13Hub={onOpenUnderU13Hub}
              />
            ) : null}
            <ProDaySurface variant="accent" style={[styles.introCard, { borderColor: themeColors.border }]}>
              <ProDayText variant="eyebrow" accent>
                {config.heroTitle}
              </ProDayText>
              <ProDayText variant="body" muted>
                {config.heroSubtitle}
              </ProDayText>
            </ProDaySurface>
            <MercatoQuickGrid
              tiles={config.quickTiles}
              stats={stats}
              loading={loading}
              onPress={onQuickTile}
            />
            <MercatoActionRow
              colors={themeColors}
              showFavorites={config.showFavoritesRow}
              staffLabel={config.staffRowLabel}
              staffCount={
                stats ? formatCount(stats.coaches + stats.agents, 'profil') : undefined
              }
              onFavorites={onFavorites}
              onStaff={onStaff}
            />
          </ScrollView>
        ),
      },
      {
        id: 'annonces' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            <SearchBar
              placeholder={config.searchPlaceholder}
              value={search}
              onChangeText={onSearchChange}
            />
            {search.trim().length > 0 ? (
              <PressableSpring
                style={[
                  styles.searchHint,
                  {
                    backgroundColor: themeColors.surfaceMuted,
                    borderColor: themeColors.borderStrong,
                  },
                ]}
                onPress={onSearchPlayers}
                scaleTo={0.98}
                haptic
              >
                <Icon name="people" size={18} color={themeColors.accent} />
                <Text style={[styles.searchHintText, { color: themeColors.text }]}>
                  {config.playersSearchHint} « {search.trim()} »
                </Text>
              </PressableSpring>
            ) : null}
            <MercatoPostsSection
              colors={themeColors}
              title={config.postsSectionTitle}
              loading={loading}
              posts={filteredPosts}
              hasSpacePosts={spacePosts.length > 0}
              searchActive={search.trim().length > 0}
              emptyAll={config.postsEmptyAll}
              emptySpace={config.postsEmptySpace}
              emptyFiltered={config.postsEmptyFiltered}
              onSelectPost={onSelectPost}
              onClearSearch={() => onSearchChange('')}
              onCreatePost={onCreatePost}
            />
          </ScrollView>
        ),
      },
      {
        id: 'outils' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            <ProDayText variant="eyebrow" accent style={styles.toolsLead}>
              {t('mercato.tools.title')}
            </ProDayText>
            <ProDayText variant="body" muted style={styles.toolsSub}>
              {t('mercato.tools.subtitle')}
            </ProDayText>
            <ProDayActionTiles
              items={toolItems.map((tool) => ({
                id: tool.id,
                label: tool.label,
                icon: tool.icon,
              }))}
              onPress={(id) => toolItems.find((t) => t.id === id)?.onPress()}
              inset={false}
            />
          </ScrollView>
        ),
      },
    ],
    [
      config,
      themeColors,
      stats,
      loading,
      filteredPosts,
      spacePosts,
      search,
      showSpaceBanner,
      toolItems,
      t,
    ]
  );

  const tabPager = (
    <ProDayTabPager
      chapters={staffChapters}
      pages={pages}
      activeChapter={chapter}
      onChapterChange={setChapter}
      badges={{
        annonces: filteredPosts.length > 0 ? filteredPosts.length : undefined,
        outils: staffSummary.pendingApplications > 0 ? staffSummary.pendingApplications : undefined,
      }}
    />
  );

  const fab = onCreatePost ? (
    <PressableSpring
      style={[styles.fab, shadows.fab]}
      onPress={onCreatePost}
      scaleTo={0.98}
      haptic
    >
      <ProDayGradient kind="cta" style={styles.fabInner}>
        <Icon name="add" size={20} color={themeColors.brandInverse} />
        <Text style={[styles.fabText, { color: themeColors.brandInverse }]}>
          {config.fabLabel}
        </Text>
      </ProDayGradient>
    </PressableSpring>
  ) : null;

  if (profile) {
    return (
      <TabScreenShell
        caption={config.eyebrow}
        title={config.screenTitle}
        subtitle={config.screenSubtitle}
        right={headerRight}
        atmosphere="dynamic_competitive"
      >
        {tabPager}
        {fab}
      </TabScreenShell>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader
        caption={config.eyebrow}
        title={config.screenTitle}
        subtitle={config.screenSubtitle}
        right={headerRight}
      />

      {tabPager}

      {fab}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  introCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  searchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  searchHintText: { fontWeight: '800', fontSize: 13, flex: 1 },
  toolsLead: { marginBottom: 4 },
  toolsSub: { marginBottom: spacing.lg },
  fab: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: TAB_BAR_CONTENT_INSET - spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.lg,
  },
  fabText: { fontWeight: '900', fontSize: 15 },
});
