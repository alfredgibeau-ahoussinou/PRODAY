import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReelSlide } from './ReelSlide';
import { ReelFavoritesSheet } from './ReelFavoritesSheet';
import { ReelUploadSheet } from './ReelUploadSheet';
import { ReelsEmptyState } from './ReelsEmptyState';
import { ReelCollectionSheet } from './ReelCollectionSheet';
import { ReelCommentsSheet } from './ReelCommentsSheet';
import { useReelsPlaylist } from '../../hooks/useReelsPlaylist';
import type { PlaybackReel } from '../../content/footballReels';
import { polesForUniverse, type ReelPoleId, type ReelSeed } from '../../content/reelSeedCatalog';
import { REEL_THEME_CHIPS, type ReelThemeId } from '../../content/reelThemes';
import type { ProductLineId } from '../../models/ProductLine';
import { PressableSpring } from '../motion';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { Icon } from '../ui/Icon';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  loadReelBookmarkEntries,
  loadReelBookmarks,
  toggleReelBookmark,
  type ReelBookmarkEntry,
} from '../../utils/reelBookmarks';
import { loadReelLikes, toggleReelLike } from '../../utils/reelLikes';
import { loadReelFollows, reelAuthorKey, toggleReelFollow } from '../../utils/reelFollows';
import { loadReelCommentCounts } from '../../utils/reelComments';
import { loadHiddenReels } from '../../utils/reelReports';
import { loadReelResume, saveReelResume } from '../../utils/reelResume';
import { spacing } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LocaleContext';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { rankReelSeeds } from '../../core/recommendation/reelsRanking.engine';
import { trackV3Event } from '../../core/analytics/v3Events';
import { recordV3UserAction } from '../../utils/recordV3Action';
import { fetchActorReelSeeds } from '../../services/actorReels.service';
import { communityReelsService } from '../../services/communityReels.service';
import { storageService } from '../../services/storage.service';
import type { UploadFileInput } from '../../services/storage.service';
import {
  reelsTheme,
  REEL_TOP_SCRIM,
  REEL_STAGE_ATMOSPHERE,
  REEL_STAGE_GLOW,
} from './reelsTheme';

const POLE_CHIP_IDS: ReelPoleId[] = ['foot', 'mercato', 'sante'];

/** Largeur max de la scène verticale — au-delà, marges atmosphériques (desktop/tablette). */
const STAGE_MAX_WIDTH = 480;
const STAGE_SIDE_GUTTER = 24;
const STAGE_TOP_GUTTER = 18;
const STAGE_BOTTOM_GUTTER = 18;
const REEL_ASPECT_RATIO = 9 / 16;

type ReelsFeedProps = {
  productLine: ProductLineId;
};

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ productLine }) => {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const brain = useProDayBrain(profile, productLine);
  const listRef = useRef<FlatList<PlaybackReel>>(null);

  const allowedPoles = useMemo(() => polesForUniverse(productLine), [productLine]);
  const poleLabels = useMemo<Record<ReelPoleId, string>>(
    () => ({
      foot: t('reels.pole.foot'),
      mercato: t('reels.pole.mercato'),
      sante: t('reels.pole.sante'),
    }),
    [t],
  );
  const poleOptions = useMemo(
    () =>
      POLE_CHIP_IDS.filter((id) => allowedPoles.includes(id)).map((id) => ({
        id,
        label: poleLabels[id],
      })),
    [allowedPoles, poleLabels],
  );

  const [pole, setPole] = useState<ReelPoleId>(() => polesForUniverse(productLine)[0] ?? 'foot');
  const [theme, setTheme] = useState<ReelThemeId>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [likes, setLikes] = useState<Set<string>>(() => new Set());
  const [follows, setFollows] = useState<Set<string>>(() => new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => ({}));
  const [commentsReel, setCommentsReel] = useState<PlaybackReel | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());
  const [bookmarkEntries, setBookmarkEntries] = useState<ReelBookmarkEntry[]>([]);
  const [extraSeeds, setExtraSeeds] = useState<ReelSeed[]>([]);
  const [actorSeedsLoading, setActorSeedsLoading] = useState(true);
  const [resumeBookmarkKey, setResumeBookmarkKey] = useState<string | undefined>();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickedVideo, setPickedVideo] = useState<UploadFileInput | null>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload = Boolean(profile && ['player', 'club', 'coach'].includes(profile.role));

  const rankSeeds = useCallback(
    (seeds: ReelSeed[]) => {
      const ranked = rankReelSeeds({
        seeds,
        pole,
        healthState: brain.ai.health.state,
        usefulnessMin: brain.ai.contentFilter.reelsUsefulnessMin,
        position: profile?.profile?.position,
        clubId: profile?.profile?.club_id,
        city: profile?.city,
        level: profile?.profile?.level,
      });
      return ranked.length > 0 ? ranked : seeds;
    },
    [
      pole,
      brain.ai.health.state,
      brain.ai.contentFilter.reelsUsefulnessMin,
      profile?.profile?.position,
      profile?.profile?.club_id,
      profile?.city,
      profile?.profile?.level,
    ],
  );

  const {
    reels,
    resumeIndex,
    hasSeeds,
    loadingMore,
    onNearEnd,
    prioritizeReel,
    retryReel,
    removeReel,
  } = useReelsPlaylist(productLine, pole, {
    rankSeeds,
    theme,
    extraSeeds,
    hiddenKeys,
    resumeBookmarkKey,
  });

  const fullHeight = windowH;
  const availableWideHeight = Math.max(
    fullHeight - (insets.top + insets.bottom + STAGE_TOP_GUTTER + STAGE_BOTTOM_GUTTER),
    0,
  );
  const wideMaxByWidth = Math.max(windowW - STAGE_SIDE_GUTTER * 2, 0);
  const wideWidth = Math.min(
    STAGE_MAX_WIDTH,
    wideMaxByWidth,
    Math.floor(availableWideHeight * REEL_ASPECT_RATIO),
  );
  const isWide = windowW >= STAGE_MAX_WIDTH + STAGE_SIDE_GUTTER * 2 && wideWidth > 0;
  const stageWidth = isWide ? wideWidth : windowW;
  const slideHeight = isWide ? Math.round(stageWidth / REEL_ASPECT_RATIO) : fullHeight;
  const compactHeader = stageWidth <= 400;

  const listExtraData = useMemo(
    () =>
      reels
        .map((r) => `${r.id}:${r.loading ? 'L' : 'R'}:${r.videoUrl ? 'V' : '-'}`)
        .join('|'),
    [reels],
  );

  useEffect(() => {
    void (async () => {
      try {
        const { setAudioModeAsync } = await import('expo-audio');
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
      } catch {
        // Module natif absent.
      }
    })();
  }, []);

  useEffect(() => {
    setPole((current) =>
      allowedPoles.includes(current) ? current : allowedPoles[0] ?? 'foot',
    );
  }, [productLine, allowedPoles]);

  const reloadActorSeeds = useCallback(async () => {
    const actorSeeds = await fetchActorReelSeeds({
      clubId: profile?.profile?.club_id,
      productLine,
    });
    setExtraSeeds(actorSeeds);
    return actorSeeds;
  }, [productLine, profile?.profile?.club_id]);

  useEffect(() => {
    setActorSeedsLoading(true);
    void (async () => {
      try {
        const [bm, lk, fl, counts, hidden, resume] = await Promise.all([
          loadReelBookmarks(),
          loadReelLikes(),
          loadReelFollows(),
          loadReelCommentCounts(),
          loadHiddenReels(),
          loadReelResume(productLine, pole, theme),
        ]);
        setBookmarks(bm);
        setLikes(lk);
        setFollows(fl);
        setCommentCounts(counts);
        setHiddenKeys(hidden);
        setBookmarkEntries(await loadReelBookmarkEntries());
        setResumeBookmarkKey(resume?.bookmarkKey);
        await reloadActorSeeds();
      } finally {
        setActorSeedsLoading(false);
      }
    })();
  }, [productLine, pole, theme, profile?.profile?.club_id, reloadActorSeeds]);

  useEffect(() => {
    if (resumeIndex > 0 && reels.length > resumeIndex) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: resumeIndex, animated: false });
        setActiveIndex(resumeIndex);
      });
    }
  }, [resumeIndex, reels.length]);

  const onBookmarkToggle = useCallback(
    async (bookmarkKey: string, reel?: PlaybackReel) => {
      const saved = await toggleReelBookmark(bookmarkKey, reel
        ? {
            authorName: reel.authorName,
            caption: reel.caption,
            sourceUrl: reel.sourceUrl,
          }
        : undefined);
      if (saved) trackV3Event('reel_saved', { bookmarkKey });
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (saved) next.add(bookmarkKey);
        else next.delete(bookmarkKey);
        return next;
      });
      setBookmarkEntries(await loadReelBookmarkEntries());
      return saved;
    },
    [],
  );

  const onLikeToggle = useCallback(async (bookmarkKey: string, _liked: boolean) => {
    const persisted = await toggleReelLike(bookmarkKey);
    setLikes((prev) => {
      const next = new Set(prev);
      if (persisted) next.add(bookmarkKey);
      else next.delete(bookmarkKey);
      return next;
    });
    if (persisted) trackV3Event('reel_like', { bookmarkKey });
  }, []);

  const onFollowToggle = useCallback((authorKey: string, next: boolean) => {
    setFollows((prev) => {
      const set = new Set(prev);
      if (next) set.add(authorKey);
      else set.delete(authorKey);
      return set;
    });
    void toggleReelFollow(authorKey);
  }, []);

  const onCommentCountChange = useCallback((bookmarkKey: string, count: number) => {
    setCommentCounts((prev) => ({ ...prev, [bookmarkKey]: count }));
  }, []);

  const onReported = useCallback(
    (bookmarkKey: string) => {
      setHiddenKeys((prev) => new Set(prev).add(bookmarkKey));
      removeReel(bookmarkKey);
    },
    [removeReel],
  );

  const onNearEndRef = useRef(onNearEnd);
  onNearEndRef.current = onNearEnd;
  const prioritizeReelRef = useRef(prioritizeReel);
  prioritizeReelRef.current = prioritizeReel;

  const poleRef = useRef(pole);
  poleRef.current = pole;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const viewedReelsRef = useRef(new Set<string>());
  const reelViewStartedRef = useRef<{ id: string; at: number; bookmarkKey: string } | null>(
    null,
  );

  const persistResume = useCallback(
    (bookmarkKey: string, index: number) => {
      void saveReelResume(productLine, poleRef.current, themeRef.current, {
        bookmarkKey,
        activeIndex: index,
        at: new Date().toISOString(),
      });
    },
    [productLine],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((v) => v.isViewable);
      const prev = reelViewStartedRef.current;
      if (prev && first?.item) {
        const item = first.item as PlaybackReel | undefined;
        if (item?.id && item.id !== prev.id) {
          const elapsed = Date.now() - prev.at;
          if (elapsed < 2500) {
            trackV3Event('reel_skip_fast', { reelId: prev.id, ms: elapsed });
          }
        }
      }
      if (first?.index != null) {
        setActiveIndex(first.index);
        onNearEndRef.current(first.index);
        const item = first.item as PlaybackReel | undefined;
        if (item?.id) {
          reelViewStartedRef.current = {
            id: item.id,
            at: Date.now(),
            bookmarkKey: item.bookmarkKey,
          };
          persistResume(item.bookmarkKey, first.index);
          prioritizeReelRef.current(item.id, first.index);
          trackV3Event('reel_view', {
            reelId: item.id,
            pole: poleRef.current,
            theme: themeRef.current,
            index: first.index,
          });
          const user = profileRef.current;
          if (user && !viewedReelsRef.current.has(item.id)) {
            viewedReelsRef.current.add(item.id);
            recordV3UserAction(user, 'view_reel');
          }
        }
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const handleUpload = useCallback(
    async (caption: string, uploadTheme: Exclude<ReelThemeId, 'all'>) => {
      if (!profile || !pickedVideo) {
        throw new Error(t('reels.upload.videoRequired'));
      }
      setUploading(true);
      try {
        const video_url = await storageService.uploadCommunityReel(profile.uid, pickedVideo);
        await communityReelsService.submit(profile.uid, profile.display_name || 'ProDay User', {
          caption,
          theme: uploadTheme,
          club_id: profile.profile?.club_id,
          video_url,
        }, profile.email);
        setPickedVideo(null);
        setUploadOpen(false);
        // Affiche le thème du reel publié, sinon le filtre courant le masque.
        setTheme(uploadTheme);
        setResumeBookmarkKey(undefined);
        await reloadActorSeeds();
        trackV3Event('reel_upload_submitted', { theme: uploadTheme });
      } catch (error) {
        throw error instanceof Error ? error : new Error(t('common.error'));
      } finally {
        setUploading(false);
      }
    },
    [profile, pickedVideo, t, reloadActorSeeds],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PlaybackReel; index: number }) => (
      <ReelSlide
        reel={item}
        isActive={index === activeIndex}
        height={slideHeight}
        width={stageWidth}
        bookmarked={bookmarks.has(item.bookmarkKey)}
        liked={likes.has(item.bookmarkKey)}
        following={follows.has(reelAuthorKey(item))}
        commentCount={commentCounts[item.bookmarkKey] ?? 0}
        reporterUid={profile?.uid}
        onBookmarkToggle={(key) => onBookmarkToggle(key, item)}
        onLikeToggle={onLikeToggle}
        onFollowToggle={onFollowToggle}
        onOpenComments={setCommentsReel}
        onReported={onReported}
        onRetry={() => retryReel(item.id)}
      />
    ),
    [
      activeIndex,
      slideHeight,
      stageWidth,
      bookmarks,
      likes,
      follows,
      commentCounts,
      profile?.uid,
      onBookmarkToggle,
      onLikeToggle,
      onFollowToggle,
      onReported,
      retryReel,
    ],
  );

  const ListFooter = loadingMore ? (
    <View style={[styles.footer, { height: slideHeight * 0.08 }]}>
      <ActivityIndicator color={reelsTheme.color.amber} size="small" />
    </View>
  ) : null;

  const commentSig = useMemo(
    () => Object.values(commentCounts).reduce((sum, n) => sum + n, 0),
    [commentCounts],
  );

  return (
    <ProDayScreenCanvas immersive>
      {/* Atmosphère desktop/tablette — noir réchauffé et halo de projecteur ambre derrière la scène */}
      {isWide ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={REEL_STAGE_ATMOSPHERE}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={REEL_STAGE_GLOW}
            locations={[0, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.atmosphere}
          />
        </View>
      ) : null}

      <View style={styles.stageWrap}>
        <View
          style={[
            styles.stage,
            { width: stageWidth, height: slideHeight },
            isWide && styles.stageFramed,
          ]}
          pointerEvents="box-none"
        >
          <FlatList
            ref={listRef}
            data={reels}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={slideHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: slideHeight,
              offset: slideHeight * index,
              index,
            })}
            removeClippedSubviews={false}
            windowSize={11}
            maxToRenderPerBatch={6}
            initialNumToRender={4}
            initialScrollIndex={resumeIndex > 0 ? resumeIndex : undefined}
            onScrollToIndexFailed={() => {}}
            extraData={`${activeIndex}|${pole}|${theme}|${bookmarks.size}|${likes.size}|${follows.size}|${commentSig}|${listExtraData}`}
            ListFooterComponent={ListFooter}
            key={`${productLine}-${pole}-${theme}-${slideHeight}-${stageWidth}`}
            style={styles.list}
          />

          {/* Voile haut réchauffé — le bandeau et le contrôle restent lisibles sur vidéo claire */}
          <LinearGradient
            colors={REEL_TOP_SCRIM}
            style={[styles.topScrim, { height: insets.top + 96 }]}
            pointerEvents="none"
          />

          <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
            <View style={styles.masthead} pointerEvents="none">
              <Text
                style={[styles.brandWord, compactHeader && styles.brandWordCompact]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.84}
              >
                PRODAY {t('reels.title').toUpperCase()}
              </Text>
            </View>
            <View style={styles.topActions}>
              <PressableSpring
                style={styles.control}
                scaleTo={0.98}
                haptic
                onPress={() => setCollectionOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('reels.collection.title')}
              >
                <Icon name="tune" size={18} color={reelsTheme.color.text} />
              </PressableSpring>
              {canUpload ? (
                <PressableSpring
                  testID="reels-upload-open"
                  style={styles.control}
                  scaleTo={0.98}
                  haptic
                  onPress={() => setUploadOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('reels.upload.title')}
                >
                  <Icon name="add" size={18} color={reelsTheme.color.text} />
                </PressableSpring>
              ) : null}
            </View>
          </View>

          {actorSeedsLoading || (hasSeeds && reels.length === 0) ? (
            <ReelsEmptyState loading />
          ) : !hasSeeds ? (
            <ReelsEmptyState canPublish={canUpload} onPublish={() => setUploadOpen(true)} />
          ) : null}
        </View>
      </View>

      <ReelCommentsSheet
        visible={Boolean(commentsReel)}
        bookmarkKey={commentsReel?.bookmarkKey}
        authorName={commentsReel?.authorName}
        currentUserName={profile?.display_name}
        currentUserUid={profile?.uid}
        onClose={() => setCommentsReel(null)}
        onCountChange={onCommentCountChange}
      />

      <ReelCollectionSheet
        visible={collectionOpen}
        onClose={() => setCollectionOpen(false)}
        poleOptions={poleOptions}
        pole={pole}
        onPoleChange={(id) => {
          prodayHaptics.tabSwitch();
          setPole(id);
          setResumeBookmarkKey(undefined);
        }}
        themeOptions={REEL_THEME_CHIPS}
        theme={theme}
        onThemeChange={(id) => {
          setTheme(id);
          setResumeBookmarkKey(undefined);
        }}
        favoritesCount={bookmarkEntries.length}
        onOpenFavorites={() => setFavoritesOpen(true)}
        canPublish={canUpload}
        onPublish={() => setUploadOpen(true)}
      />

      <ReelFavoritesSheet
        visible={favoritesOpen}
        entries={bookmarkEntries}
        onClose={() => setFavoritesOpen(false)}
        onResume={(bookmarkKey) => {
          setResumeBookmarkKey(bookmarkKey);
          setTheme('all');
        }}
        onRemove={async (bookmarkKey) => {
          await onBookmarkToggle(bookmarkKey);
        }}
      />

      <ReelUploadSheet
        visible={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setPickedVideo(null);
        }}
        onVideoReady={setPickedVideo}
        onClearVideo={() => setPickedVideo(null)}
        videoUri={pickedVideo?.uri ?? null}
        allowDemoVideo={__DEV__}
        uploading={uploading}
        onSubmit={handleUpload}
      />
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  atmosphere: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  stageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: reelsTheme.color.stage,
  },
  stageFramed: {
    flex: 0,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.7,
    shadowRadius: 56,
    elevation: 16,
  },
  list: { flex: 1, backgroundColor: reelsTheme.color.stage },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: reelsTheme.color.stage,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  masthead: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brandWord: {
    color: reelsTheme.color.text,
    fontFamily: reelsTheme.type.masthead.fontFamily,
    fontSize: reelsTheme.type.masthead.fontSize,
    letterSpacing: reelsTheme.type.masthead.letterSpacing,
  },
  brandWordCompact: {
    fontSize: 14,
    letterSpacing: 2.1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: reelsTheme.space.xs,
  },
  control: {
    width: 42,
    height: 42,
    borderRadius: reelsTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: reelsTheme.color.backdrop,
    borderWidth: 1,
    borderColor: reelsTheme.color.hairlineStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
  },
});
