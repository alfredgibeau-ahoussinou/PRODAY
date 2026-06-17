import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '../models/User';
import type { RecruitmentPost, Application } from '../models/Player';
import type { ProductLineId } from '../models/ProductLine';
import type { CandidatureChapterId } from '../content/candidatureChapters';
import {
  DEFAULT_POST_FILTERS,
  filterRecruitmentPosts,
  postsMatchingAlert,
  type PostListFilters,
} from '../utils/postFilters';
import { buildMercatoSearchSuggestions } from '../utils/mercatoSearchSuggestions';
import {
  loadMercatoAlert,
  notifyNewMercatoMatches,
  saveMercatoAlert,
  type MercatoAlertCriteria,
} from '../services/mercatoAlerts.service';
import { getProfileCompletion } from '../utils/profileCompletion';
import { recruitmentService } from '../services/recruitment.service';
import { useProDayBrain } from './useProDayBrain';
import {
  buildMercatoPostRecommendations,
  mercatoScoreMap,
  sortPostsByMercatoFit,
} from '../core/recommendation/mercatoRecommendation.engine';
import type { MercatoExperienceConfig } from '../content/mercatoExperience';
export function useCandidatureMercato(
  profile: User,
  productLine: ProductLineId,
  posts: RecruitmentPost[],
  search: string,
  applicationsCount: number,
  config: MercatoExperienceConfig,
  onRefresh?: () => Promise<void>
) {
  const useSmartRanking = true;
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
    return sortPostsByMercatoFit(base, mercatoRecs, useSmartRanking && !filtersActive);
  }, [posts, postFilters, mercatoRecs, filtersActive]);

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

  const resetPostFilters = () => setPostFilters(DEFAULT_POST_FILTERS);

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

  return {
    useSmartRanking,
    highFitCount,
    chapter,
    setChapter,
    postFilters,
    updatePostFilter,
    resetPostFilters,
    alertCriteria,
    alertMatches,
    toggleAlert,
    refreshing,
    handleRefresh,
    applications,
    loadingApps,
    profileCompletion,
    filtersActive,
    filteredPosts,
    searchSuggestions,
    mercatoScores,
  };
}
