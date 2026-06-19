import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReelSlide } from './ReelSlide';
import { ReelFavoritesSheet } from './ReelFavoritesSheet';
import { ReelUploadSheet } from './ReelUploadSheet';
import { ReelsEmptyState } from './ReelsEmptyState';
import { useReelsPlaylist } from '../../hooks/useReelsPlaylist';
import type { PlaybackReel } from '../../content/footballReels';
import { polesForUniverse, type ReelPoleId, type ReelSeed } from '../../content/reelSeedCatalog';
import { REEL_THEME_CHIPS, type ReelThemeId } from '../../content/reelThemes';
import type { ProductLineId } from '../../models/ProductLine';
import { TAB_BAR_CONTENT_INSET } from '../navigation/BottomTabBar';
import { PressableSpring } from '../motion';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { UniverseBadge } from '../branding/UniverseBadge';
import { useAppTheme } from '../../context/ProductLineContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import {
  loadReelBookmarkEntries,
  loadReelBookmarks,
  toggleReelBookmark,
  type ReelBookmarkEntry,
} from '../../utils/reelBookmarks';
import { loadReelLikes, toggleReelLike } from '../../utils/reelLikes';
import { loadHiddenReels } from '../../utils/reelReports';
import { loadReelResume, saveReelResume } from '../../utils/reelResume';
import { spacing, radius } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LocaleContext';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { rankReelSeeds } from '../../core/recommendation/reelsRanking.engine';
import { trackV3Event } from '../../core/analytics/v3Events';
import { recordV3UserAction } from '../../utils/recordV3Action';
import { fetchActorReelSeeds } from '../../services/actorReels.service';
import { communityReelsService } from '../../services/communityReels.service';
import { pickReelVideo } from '../../utils/pickReelVideo';
import { storageService } from '../../services/storage.service';

const POLE_CHIP_IDS: ReelPoleId[] = ['foot', 'mercato', 'sante'];

type ReelsFeedProps = {
  productLine: ProductLineId;
};

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ productLine }) => {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const brain = useProDayBrain(profile, productLine);
  const listRef = useRef<FlatList<PlaybackReel>>(null);

  const allowedPoles = useMemo(() => polesForUniverse(productLine), [productLine]);
  const poleChips = useMemo(() => {
    const poleLabels: Record<ReelPoleId, string> = {
      foot: t('reels.pole.foot'),
      mercato: t('reels.pole.mercato'),
      sante: t('reels.pole.sante'),
    };
    return POLE_CHIP_IDS.filter((id) => allowedPoles.includes(id)).map((id) => ({
      id,
      label: poleLabels[id],
    }));
  }, [allowedPoles, t]);

  const [pole, setPole] = useState<ReelPoleId>(() => polesForUniverse(productLine)[0] ?? 'foot');
  const [theme, setTheme] = useState<ReelThemeId>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());
  const [likes, setLikes] = useState<Set<string>>(() => new Set());
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set());
  const [bookmarkEntries, setBookmarkEntries] = useState<ReelBookmarkEntry[]>([]);
  const [extraSeeds, setExtraSeeds] = useState<ReelSeed[]>([]);
  const [actorSeedsLoading, setActorSeedsLoading] = useState(true);
  const [resumeBookmarkKey, setResumeBookmarkKey] = useState<string | undefined>();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickedVideo, setPickedVideo] = useState<{ uri: string; mimeType: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const canUpload =
    profile &&
    ['player', 'club', 'coach'].includes(profile.role);

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

  const slideHeight = windowH - TAB_BAR_CONTENT_INSET;

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

  useEffect(() => {
    setActorSeedsLoading(true);
    void (async () => {
      try {
        const [bm, lk, hidden, resume, actorSeeds] = await Promise.all([
          loadReelBookmarks(),
          loadReelLikes(),
          loadHiddenReels(),
          loadReelResume(productLine, pole, theme),
          fetchActorReelSeeds({
            clubId: profile?.profile?.club_id,
            productLine,
          }),
        ]);
        setBookmarks(bm);
        setLikes(lk);
        setHiddenKeys(hidden);
        setBookmarkEntries(await loadReelBookmarkEntries());
        setResumeBookmarkKey(resume?.bookmarkKey);
        setExtraSeeds(actorSeeds);
      } finally {
        setActorSeedsLoading(false);
      }
    })();
  }, [productLine, pole, theme, profile?.profile?.club_id]);

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

  const handlePickVideo = useCallback(async () => {
    const file = await pickReelVideo();
    if (!file) return false;
    setPickedVideo(file);
    return true;
  }, []);

  const handleUpload = useCallback(
    async (caption: string, uploadTheme: Exclude<ReelThemeId, 'all'>) => {
      if (!profile || !pickedVideo) return;
      setUploading(true);
      try {
        const video_url = await storageService.uploadCommunityReel(profile.uid, pickedVideo);
        await communityReelsService.submit(profile.uid, profile.display_name, {
          caption,
          theme: uploadTheme,
          club_id: profile.profile?.club_id,
          video_url,
        });
        setPickedVideo(null);
        trackV3Event('reel_upload_submitted', { theme: uploadTheme });
      } finally {
        setUploading(false);
      }
    },
    [profile, pickedVideo],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PlaybackReel; index: number }) => (
      <ReelSlide
        reel={item}
        isActive={index === activeIndex}
        height={slideHeight}
        width={windowW}
        bookmarked={bookmarks.has(item.bookmarkKey)}
        liked={likes.has(item.bookmarkKey)}
        reporterUid={profile?.uid}
        onBookmarkToggle={(key) => onBookmarkToggle(key, item)}
        onLikeToggle={onLikeToggle}
        onReported={onReported}
        onRetry={() => retryReel(item.id)}
      />
    ),
    [
      activeIndex,
      slideHeight,
      windowW,
      bookmarks,
      likes,
      profile?.uid,
      onBookmarkToggle,
      onLikeToggle,
      onReported,
      retryReel,
    ],
  );

  const ListFooter = loadingMore ? (
    <View style={[styles.footer, { height: slideHeight * 0.08 }]}>
      <ActivityIndicator color="#fff" size="small" />
    </View>
  ) : null;

  return (
    <ProDayScreenCanvas immersive>
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
        extraData={`${activeIndex}|${pole}|${theme}|${bookmarks.size}|${likes.size}|${listExtraData}`}
        ListFooterComponent={ListFooter}
        key={`${productLine}-${pole}-${theme}-${slideHeight}`}
        style={styles.list}
      />

      <View style={[styles.header, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <ProDayText variant="brand" inverse style={styles.brandTitle}>
            {t('reels.title')}
          </ProDayText>
          <UniverseBadge productLine={productLine} colors={colors} compact />
        </View>
        <ProDayGradient
          kind="cta"
          style={styles.headerLine}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
        <ProDayText variant="caption" inverse muted style={styles.headerSub}>
          {t('reels.subtitle')}
        </ProDayText>

        <View style={styles.poleRow}>
          {poleChips.length > 1
            ? poleChips.map((chip) => {
                const on = chip.id === pole;
                return (
                  <PressableSpring
                    key={chip.id}
                    style={[styles.poleChip, on && styles.poleChipOn]}
                    onPress={() => {
                      prodayHaptics.tabSwitch();
                      setPole(chip.id);
                      setResumeBookmarkKey(undefined);
                    }}
                    scaleTo={0.94}
                    haptic
                  >
                    <ProDayText
                      variant="caption"
                      inverse={on}
                      style={on ? styles.poleTextOn : styles.poleText}
                    >
                      {chip.label}
                    </ProDayText>
                  </PressableSpring>
                );
              })
            : null}
        </View>

        <View style={styles.poleRow}>
          {REEL_THEME_CHIPS.map((chip) => {
            const on = chip.id === theme;
            return (
              <PressableSpring
                key={chip.id}
                style={[styles.themeChip, on && styles.poleChipOn]}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  setTheme(chip.id);
                  setResumeBookmarkKey(undefined);
                }}
                scaleTo={0.94}
                haptic
              >
                <ProDayText
                  variant="caption"
                  inverse={on}
                  style={on ? styles.poleTextOn : styles.poleText}
                >
                  {chip.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <PressableSpring
            style={styles.actionBtn}
            onPress={() => setFavoritesOpen(true)}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" inverse style={styles.actionText}>
              {t('reels.favorites', { n: bookmarkEntries.length })}
            </ProDayText>
          </PressableSpring>
          {canUpload ? (
            <PressableSpring
              style={styles.actionBtn}
              onPress={() => setUploadOpen(true)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" inverse style={styles.actionText}>
                {t('reels.publish')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      </View>

      {actorSeedsLoading || (hasSeeds && reels.length === 0) ? (
        <ReelsEmptyState loading />
      ) : !hasSeeds ? (
        <ReelsEmptyState
          canPublish={Boolean(canUpload)}
          onPublish={() => setUploadOpen(true)}
        />
      ) : null}

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
        onPickVideo={handlePickVideo}
        hasVideo={Boolean(pickedVideo)}
        uploading={uploading}
        onSubmit={handleUpload}
      />
    </ProDayScreenCanvas>
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#000' },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTitle: { color: '#fff' },
  headerLine: { width: 48, height: 3, borderRadius: 2 },
  headerSub: { color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  poleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  poleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  themeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  poleChipOn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.92)',
  },
  poleText: { color: 'rgba(255,255,255,0.95)', fontWeight: '700' },
  poleTextOn: { color: '#111', fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  actionText: { fontWeight: '800' },
});
