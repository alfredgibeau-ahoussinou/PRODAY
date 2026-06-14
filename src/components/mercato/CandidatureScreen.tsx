import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { User } from '../../models/User';
import type { RecruitmentPost, Application } from '../../models/Player';
import type { RecruitmentStats } from '../../services/stats.service';
import type { MercatoExperienceConfig, MercatoQuickTileId } from '../../content/mercatoExperience';
import type { CandidatureChapterId, PositionFilterId } from '../../content/candidatureChapters';
import { POSITION_FILTERS } from '../../content/candidatureChapters';
import {
  DEFAULT_POST_FILTERS,
  POST_CATEGORY_OPTIONS,
  POST_LEVEL_OPTIONS,
  filterRecruitmentPosts,
  postsMatchingAlert,
  type PostListFilters,
} from '../../utils/postFilters';
import { buildMercatoSearchSuggestions } from '../../utils/mercatoSearchSuggestions';
import {
  loadMercatoAlert,
  notifyNewMercatoMatches,
  saveMercatoAlert,
  type MercatoAlertCriteria,
} from '../../services/mercatoAlerts.service';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { SearchBar } from '../ui/SearchBar';
import { ProDaySelect } from '../ui/ProDaySelect';
import { MercatoSearchSuggestions } from './MercatoSearchSuggestions';
import { Icon } from '../ui/Icon';
import { AppTabHeader, AppStatChips } from '../app';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { CandidaturePostCard } from './CandidaturePostCard';
import { CandidaturePager } from './CandidaturePager';
import { PressableSpring, SkeletonList, InteractiveListItem } from '../motion';
import { AppSpaceBanner } from '../appSpace/AppSpaceBanner';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  recruitmentService,
  formatTimeAgo,
  APPLICATION_STATUS_LABEL,
} from '../../services/recruitment.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { ProductLineId } from '../../models/ProductLine';
import { V3TabShell } from '../v3/V3TabShell';
import { isV3ShellEnabled } from '../../config/featureFlags';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { useSectionIntelligence } from '../../hooks/useSectionIntelligence';
import {
  buildMercatoPostRecommendations,
  mercatoScoreMap,
  sortPostsByMercatoFit,
} from '../../core/recommendation/mercatoRecommendation.engine';
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
  onQuickTile: (id: MercatoQuickTileId) => void;
  onOpenApplications: () => void;
  onSearchPlayers: () => void;
  showSpaceBanner: boolean;
  onOpenMenHub: () => void;
  onOpenWomenHub: () => void;
  onOpenUnderU13Hub: () => void;
  onRefresh?: () => Promise<void>;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

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
  onQuickTile,
  onOpenApplications,
  onSearchPlayers,
  showSpaceBanner,
  onOpenMenHub,
  onOpenWomenHub,
  onOpenUnderU13Hub,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const isWoman = productLine === 'woman';
  const useV3Header = isV3ShellEnabled();
  const brain = useProDayBrain(profile, productLine);
  const mercatoRecs = useMemo(
    () =>
      buildMercatoPostRecommendations({
        profile,
        posts,
        pulseScore: brain.ai.dynamicScore,
        profileCompletion: getProfileCompletion(profile).percent,
      }),
    [profile, posts, brain.ai.dynamicScore]
  );
  const mercatoScores = useMemo(() => mercatoScoreMap(mercatoRecs), [mercatoRecs]);
  const highFitCount = useMemo(
    () => mercatoRecs.filter((rec) => rec.iaScore >= 55).length,
    [mercatoRecs]
  );
  const intelligence = useSectionIntelligence('recrutement', profile, productLine, {
    mercatoPosts: highFitCount,
  });
  const [chapter, setChapter] = useState<CandidatureChapterId>('annonces');
  const [postFilters, setPostFilters] = useState<PostListFilters>(DEFAULT_POST_FILTERS);
  const [alertCriteria, setAlertCriteria] = useState<MercatoAlertCriteria | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<
    { application: Application; post: RecruitmentPost | null }[]
  >([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    const apps = await recruitmentService.listMyApplications(profile.uid);
    const withPosts = await Promise.all(
      apps.map(async (application) => ({
        application,
        post: await recruitmentService.getPostById(application.post_id),
      }))
    );
    setApplications(withPosts);
    setLoadingApps(false);
  }, [profile.uid]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications, applicationsCount]);

  useEffect(() => {
    void loadMercatoAlert(profile.uid).then((criteria) => {
      setAlertCriteria(criteria);
      if (criteria.enabled) {
        void saveMercatoAlert(profile.uid, criteria);
      }
    });
  }, [profile.uid]);

  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile]);

  const filtersActive = useMemo(
    () =>
      search.trim().length > 0 ||
      postFilters.position !== DEFAULT_POST_FILTERS.position ||
      postFilters.level !== DEFAULT_POST_FILTERS.level ||
      postFilters.category !== DEFAULT_POST_FILTERS.category ||
      Boolean(postFilters.city),
    [search, postFilters]
  );

  const filteredPosts = useMemo(() => {
    const base = filterRecruitmentPosts(posts, postFilters);
    return sortPostsByMercatoFit(base, mercatoRecs, useV3Header && !filtersActive);
  }, [posts, postFilters, mercatoRecs, useV3Header, filtersActive]);

  const searchSuggestions = useMemo(
    () =>
      buildMercatoSearchSuggestions(
        posts,
        search,
        config.quickTiles.find((t) => t.id === 'players')?.title ?? 'Joueurs'
      ),
    [posts, search, config.quickTiles]
  );

  const alertMatches = useMemo(() => {
    if (!alertCriteria?.enabled) return [];
    return postsMatchingAlert(posts, alertCriteria);
  }, [posts, alertCriteria]);

  const toggleAlert = async () => {
    const next: MercatoAlertCriteria = {
      search,
      position: postFilters.position,
      level: postFilters.level,
      category: postFilters.category,
      city: postFilters.city,
      enabled: !(alertCriteria?.enabled ?? false),
    };
    setAlertCriteria(next);
    await saveMercatoAlert(profile.uid, next);
  };

  const updatePostFilter = <K extends keyof PostListFilters>(key: K, value: PostListFilters[K]) => {
    setPostFilters((f) => ({ ...f, [key]: value }));
  };

  useEffect(() => {
    if (!alertCriteria?.enabled || posts.length === 0) return;
    const matches = postsMatchingAlert(posts, alertCriteria);
    if (matches.length === 0) return;
    const sample = matches[0];
    void notifyNewMercatoMatches(
      profile.uid,
      matches.map((p) => p.id),
      `${sample.club_name} — ${sample.position}`
    );
  }, [posts, alertCriteria, profile.uid]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([onRefresh?.(), loadApplications()]);
    setRefreshing(false);
  };

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    nestedScrollEnabled: true,
    keyboardShouldPersistTaps: 'handled' as const,
  };

  const pages = useMemo(
    () => [
      {
        id: 'annonces' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            {showSpaceBanner ? (
              <View style={styles.banner}>
                <AppSpaceBanner
                  showHubLinks
                  onOpenMenHub={onOpenMenHub}
                  onOpenWomenHub={onOpenWomenHub}
                  onOpenUnderU13Hub={onOpenUnderU13Hub}
                />
              </View>
            ) : null}

            <SearchBar
              placeholder={config.searchPlaceholder}
              value={search}
              onChangeText={onSearchChange}
            />

            <MercatoSearchSuggestions
              suggestions={searchSuggestions}
              onPick={(s) => {
                if (s.kind === 'explorer') onQuickTile(s.tileId);
                else onSearchChange(s.query);
              }}
            />

            <View style={styles.filtersStack}>
              <ProDaySelect<MercatoQuickTileId>
                label="Explorer"
                placeholder="Joueurs, clubs, détections…"
                options={config.quickTiles.map((tile) => ({
                  id: tile.id,
                  label: tile.title,
                  hint: tile.hint,
                }))}
                onChange={onQuickTile}
                resetOnSelect
              />

              <ProDaySelect<PositionFilterId>
                label="Poste recherché"
                placeholder="Tous les postes"
                options={POSITION_FILTERS.map((f) => ({
                  id: f.id,
                  label: f.label,
                }))}
                value={postFilters.position}
                onChange={(id) => updatePostFilter('position', id)}
              />

              <ProDaySelect<PostListFilters['level']>
                label="Niveau"
                placeholder="Tous niveaux"
                options={POST_LEVEL_OPTIONS.map((o) => ({
                  id: o.id,
                  label: o.label,
                }))}
                value={postFilters.level}
                onChange={(id) => updatePostFilter('level', id)}
              />

              <ProDaySelect<PostListFilters['category']>
                label="Catégorie"
                placeholder="Toutes catégories"
                options={POST_CATEGORY_OPTIONS.map((o) => ({
                  id: o.id,
                  label: o.label,
                }))}
                value={postFilters.category}
                onChange={(id) => updatePostFilter('category', id)}
              />

              <ProDaySelect<string>
                label="Ville"
                placeholder="Toutes villes"
                options={[
                  { id: 'all', label: 'Toutes villes' },
                  ...Array.from(new Set(posts.map((p) => p.city).filter(Boolean)))
                    .slice(0, 12)
                    .map((city) => ({ id: city, label: city })),
                ]}
                value={postFilters.city || 'all'}
                onChange={(id) => updatePostFilter('city', id === 'all' ? '' : id)}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.alertRow,
                {
                  backgroundColor: alertCriteria?.enabled ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => void toggleAlert()}
            >
              <Icon
                name={alertCriteria?.enabled ? 'notifications' : 'notifications'}
                size={18}
                color={colors.accent}
              />
              <View style={styles.alertCopy}>
                <ProDayText variant="caption" accent style={styles.alertTitle}>
                  {alertCriteria?.enabled ? 'Alerte active' : 'Créer une alerte'}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {alertCriteria?.enabled
                    ? `${alertMatches.length} annonce${alertMatches.length > 1 ? 's' : ''} correspondent`
                    : 'Sauvegarder ces filtres et être notifié'}
                </ProDayText>
              </View>
            </TouchableOpacity>

            {profileCompletion.percent < 80 ? (
              <ProDaySurface variant="accent" style={styles.completionHint}>
                <ProDayText variant="caption" accent style={styles.alertTitle}>
                  Profil à {profileCompletion.percent}% — complétez pour mieux postuler
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {profileCompletion.missingLabels.slice(0, 2).join(' · ')}
                </ProDayText>
              </ProDaySurface>
            ) : null}

            {search.trim().length > 0 ? (
              <TouchableOpacity
                style={[styles.searchHint, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                onPress={onSearchPlayers}
              >
                <Icon name="people" size={18} color={colors.accent} />
                <ProDayText variant="body" style={styles.searchHintText}>
                  {config.playersSearchHint} « {search.trim()} »
                </ProDayText>
              </TouchableOpacity>
            ) : null}

            <View style={styles.sectionHead}>
              <ProDayText variant="eyebrow" accent>
                {config.postsSectionTitle}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {loading ? '…' : `${filteredPosts.length} annonce${filteredPosts.length > 1 ? 's' : ''}`}
              </ProDayText>
            </View>

            {loading ? (
              <SkeletonList count={4} variant="card" />
            ) : filteredPosts.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="search" size={32} color={colors.textMuted} />
                <ProDayText variant="section">Aucune annonce</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  {emptyMessage}
                </ProDayText>
                {filtersActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      onSearchChange('');
                      setPostFilters(DEFAULT_POST_FILTERS);
                    }}
                  >
                    <ProDayGradient kind="cta" style={styles.emptyCta}>
                      <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                        Réinitialiser les filtres
                      </ProDayText>
                    </ProDayGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={onSearchPlayers}>
                    <ProDayGradient kind="cta" style={styles.emptyCta}>
                      <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                        Explorer les joueurs
                      </ProDayText>
                    </ProDayGradient>
                  </TouchableOpacity>
                )}
              </ProDaySurface>
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
                    iaScore={useV3Header ? mercatoScores.get(post.id)?.iaScore : undefined}
                    fitLabel={useV3Header ? mercatoScores.get(post.id)?.fitLabel : undefined}
                    onPress={() => {
                      if (useV3Header) {
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
        ),
      },
      {
        id: 'suivi' as const,
        render: () => (
          <ScrollView
            contentContainerStyle={pagePad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
            {...scrollProps}
          >
            <AppStatChips
              items={[
                { value: applicationsCount, label: 'Envoyées', highlight: applicationsCount > 0 },
              ]}
            />
            <ProDayText variant="body" muted style={styles.suiviSub}>
              Suivez vos réponses clubs et relancez depuis votre profil.
            </ProDayText>

            <View style={styles.tips}>
              <ProDayText variant="eyebrow" accent>
                Conseils
              </ProDayText>
              {[
                'Personnalisez chaque lettre de motivation',
                'Complétez votre CV joueur avant de postuler',
                'Répondez vite si un club vous contacte',
              ].map((tip) => (
                <View key={tip} style={styles.tipRow}>
                  <Icon name="football" size={12} color={colors.accent} variant="filled" />
                  <ProDayText variant="caption" muted style={styles.tipText}>
                    {tip}
                  </ProDayText>
                </View>
              ))}
            </View>

            {loadingApps ? (
              <SkeletonList count={3} variant="card" />
            ) : applications.length === 0 ? (
              <ProDaySurface variant="module" style={styles.empty}>
                <Icon name="briefcase" size={28} color={colors.textMuted} />
                <ProDayText variant="section">Aucune candidature</ProDayText>
                <ProDayText variant="body" muted style={styles.emptySub}>
                  Parcourez les annonces et postulez en quelques lignes.
                </ProDayText>
                <TouchableOpacity onPress={() => setChapter('annonces')}>
                  <ProDayGradient kind="cta" style={styles.emptyCta}>
                    <ProDayText variant="caption" inverse style={styles.emptyCtaText}>
                      Voir les annonces
                    </ProDayText>
                  </ProDayGradient>
                </TouchableOpacity>
              </ProDaySurface>
            ) : (
              applications.map(({ application, post }, index) => (
                <InteractiveListItem
                  key={application.id}
                  index={index}
                  onPress={() => post && onSelectPost(post.id)}
                >
                  <View
                    style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.appHead}>
                      <ProDayText variant="section" numberOfLines={1}>
                        {post?.club_name ?? 'Club'}
                      </ProDayText>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              application.status === 'ACCEPTED'
                                ? colors.successBg
                                : application.status === 'REJECTED'
                                  ? colors.warningBg
                                  : colors.accentSoft,
                          },
                        ]}
                      >
                        <ProDayText variant="caption" accent>
                          {APPLICATION_STATUS_LABEL[application.status]}
                        </ProDayText>
                      </View>
                    </View>
                    <ProDayText variant="body" muted numberOfLines={1}>
                      {post?.title ?? post?.position ?? 'Annonce'}
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.appDate}>
                      {formatTimeAgo(application.created_at)}
                    </ProDayText>
                  </View>
                </InteractiveListItem>
              ))
            )}

            {applicationsCount > 0 ? (
              <TouchableOpacity onPress={onOpenApplications} style={styles.linkBtn}>
                <ProDayText variant="caption" accent>
                  Voir tout dans mon profil →
                </ProDayText>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        ),
      },
    ],
    [
      search,
      onSearchChange,
      config,
      colors,
      loading,
      filteredPosts,
      emptyMessage,
      postFilters,
      alertCriteria,
      profileCompletion,
      onSearchPlayers,
      onSelectPost,
      showSpaceBanner,
      onOpenMenHub,
      onOpenWomenHub,
      onOpenUnderU13Hub,
      onQuickTile,
      stats,
      applicationsCount,
      isWoman,
      loadingApps,
      applications,
      onOpenApplications,
      refreshing,
      mercatoScores,
      useV3Header,
    ]
  );

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
      activeChapter={chapter}
      onChapterChange={setChapter}
      suiviBadge={applicationsCount}
    />
  );

  if (useV3Header) {
    return (
      <V3TabShell
        title={config.screenTitle}
        subtitle={config.screenSubtitle}
        right={applicationsBadge}
        flat
        intelligence={intelligence}
        stats={
          stats
            ? [
                { value: stats.recruitment_posts_open, label: 'Live' },
                { value: highFitCount, label: 'Compatibles', highlight: highFitCount > 0 },
                { value: stats.clubs, label: 'Clubs' },
              ]
            : undefined
        }
      >
        {pager}
      </V3TabShell>
    );
  }

  return (
    <View style={styles.root}>
      <AppTabHeader
        title={config.screenTitle}
        subtitle={config.screenSubtitle}
        right={applicationsBadge}
        footer={
          stats ? (
            <AppStatChips
              items={[
                { value: stats.recruitment_posts_open, label: 'Live' },
                { value: stats.clubs, label: 'Clubs' },
              ]}
            />
          ) : undefined
        }
      />

      {pager}
    </View>
  );
};

const MiniStat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.miniStat}>
    <ProDayText variant="section" inverse>
      {value}
    </ProDayText>
    <ProDayText variant="caption" inverse muted>
      {label}
    </ProDayText>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBand: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  topCopy: { flex: 1 },
  topEyebrow: { opacity: 0.85, marginBottom: 2 },
  topStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  topStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  miniStat: { alignItems: 'center' },
  searchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchHintText: { flex: 1 },
  banner: { marginBottom: spacing.md },
  filtersStack: { gap: spacing.xs, marginBottom: spacing.sm },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  alertCopy: { flex: 1, gap: 2 },
  alertTitle: { fontWeight: '800' },
  completionHint: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: 4,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  loader: { marginVertical: spacing.xl },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptySub: { textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyCtaText: { fontWeight: '800' },
  suiviSub: { marginTop: spacing.sm, marginBottom: spacing.md },
  tips: { marginBottom: spacing.lg, gap: spacing.sm },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tipText: { flex: 1, lineHeight: 18 },
  appCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  appHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  appDate: { marginTop: 4 },
  linkBtn: { alignItems: 'center', marginTop: spacing.md },
});
