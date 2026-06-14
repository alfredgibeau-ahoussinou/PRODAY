import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReelSlide } from './ReelSlide';
import { useReelsPlaylist } from '../../hooks/useReelsPlaylist';
import type { PlaybackReel } from '../../content/footballReels';
import { polesForUniverse, type ReelPoleId } from '../../content/reelSeedCatalog';
import type { ProductLineId } from '../../models/ProductLine';
import { TAB_BAR_CONTENT_INSET } from '../navigation/BottomTabBar';
import { PressableSpring } from '../motion';
import { ProDayScreenCanvas } from '../ui/ProDayScreenCanvas';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { UniverseBadge } from '../branding/UniverseBadge';
import { useAppTheme } from '../../context/ProductLineContext';
import { getUniverseIdentity } from '../../content/brandExperience';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { loadReelBookmarks, toggleReelBookmark } from '../../utils/reelBookmarks';
import { spacing, radius } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { isV3ShellEnabled } from '../../config/featureFlags';
import { rankReelSeeds } from '../../core/recommendation/reelsRanking.engine';
import { trackV3Event } from '../../core/analytics/v3Events';
import { recordV3UserAction } from '../../utils/recordV3Action';

const POLE_CHIPS: { id: ReelPoleId; label: string }[] = [
  { id: 'foot', label: 'Foot' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'sante', label: 'Santé' },
];

type ReelsFeedProps = {
  productLine: ProductLineId;
};

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ productLine }) => {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const brain = useProDayBrain(profile, productLine);
  const useV3Ranking = isV3ShellEnabled();
  const allowedPoles = useMemo(() => polesForUniverse(productLine), [productLine]);
  const poleChips = useMemo(
    () => POLE_CHIPS.filter((chip) => allowedPoles.includes(chip.id)),
    [allowedPoles],
  );
  const [pole, setPole] = useState<ReelPoleId>(() => polesForUniverse(productLine)[0] ?? 'foot');
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());

  const rankSeeds = useCallback(
    (seeds: import('../../content/reelSeedCatalog').ReelSeed[]) => {
      if (!useV3Ranking) return seeds;
      const ranked = rankReelSeeds({
        seeds,
        pole,
        healthState: brain.ai.health.state,
        usefulnessMin: brain.ai.contentFilter.reelsUsefulnessMin,
      });
      return ranked.length > 0 ? ranked : seeds;
    },
    [useV3Ranking, pole, brain.ai.health.state, brain.ai.contentFilter.reelsUsefulnessMin]
  );

  const { reels, hasSeeds, loadingMore, onNearEnd, prioritizeReel, retryReel } = useReelsPlaylist(
    productLine,
    pole,
    useV3Ranking ? { rankSeeds } : undefined,
  );
  const identity = useMemo(() => getUniverseIdentity(productLine), [productLine]);

  const slideHeight = windowH - TAB_BAR_CONTENT_INSET;

  const listExtraData = useMemo(
    () =>
      reels
        .map((r) => `${r.id}:${r.loading ? 'L' : 'R'}:${r.videoUrl ? 'V' : '-'}`)
        .join('|'),
    [reels],
  );

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    setPole((current) =>
      allowedPoles.includes(current) ? current : allowedPoles[0] ?? 'foot',
    );
  }, [productLine, allowedPoles]);

  useEffect(() => {
    setActiveIndex(0);
  }, [pole, productLine]);

  useEffect(() => {
    void loadReelBookmarks().then(setBookmarks);
  }, []);

  const onBookmarkToggle = useCallback(async (bookmarkKey: string) => {
    const saved = await toggleReelBookmark(bookmarkKey);
    if (useV3Ranking && saved) trackV3Event('reel_saved', { bookmarkKey });
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (saved) next.add(bookmarkKey);
      else next.delete(bookmarkKey);
      return next;
    });
    return saved;
  }, [useV3Ranking]);

  const onNearEndRef = useRef(onNearEnd);
  onNearEndRef.current = onNearEnd;
  const prioritizeReelRef = useRef(prioritizeReel);
  prioritizeReelRef.current = prioritizeReel;

  const useV3Ref = useRef(useV3Ranking);
  useV3Ref.current = useV3Ranking;
  const poleRef = useRef(pole);
  poleRef.current = pole;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const viewedReelsRef = useRef(new Set<string>());
  const reelViewStartedRef = useRef<{ id: string; at: number } | null>(null);

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
          reelViewStartedRef.current = { id: item.id, at: Date.now() };
          prioritizeReelRef.current(item.id, first.index);
          if (useV3Ref.current) {
            trackV3Event('reel_view', {
              reelId: item.id,
              pole: poleRef.current,
              index: first.index,
            });
            const user = profileRef.current;
            if (user && !viewedReelsRef.current.has(item.id)) {
              viewedReelsRef.current.add(item.id);
              recordV3UserAction(user, 'view_reel');
            }
          }
        }
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: PlaybackReel; index: number }) => (
      <ReelSlide
        reel={item}
        isActive={index === activeIndex}
        height={slideHeight}
        width={windowW}
        bookmarked={bookmarks.has(item.bookmarkKey)}
        onBookmarkToggle={onBookmarkToggle}
        onRetry={() => retryReel(item.id)}
      />
    ),
    [activeIndex, slideHeight, windowW, bookmarks, onBookmarkToggle, retryReel],
  );

  const ListFooter = loadingMore ? (
    <View style={[styles.footer, { height: slideHeight * 0.08 }]}>
      <ActivityIndicator color="#fff" size="small" />
    </View>
  ) : null;

  return (
    <ProDayScreenCanvas immersive>
      <FlatList
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
        extraData={`${activeIndex}|${pole}|${bookmarks.size}|${listExtraData}`}
        ListFooterComponent={ListFooter}
        key={`${productLine}-${pole}-${slideHeight}`}
        style={styles.list}
      />

      <View style={[styles.header, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <ProDayText variant="brand" inverse style={styles.brandTitle}>
            Reels
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
          {identity.tagline}
        </ProDayText>
        {poleChips.length > 1 ? (
          <View style={styles.poleRow}>
            {poleChips.map((chip) => {
              const on = chip.id === pole;
              return (
                <PressableSpring
                  key={chip.id}
                  style={[styles.poleChip, on && styles.poleChipOn]}
                  onPress={() => {
                    prodayHaptics.tabSwitch();
                    setPole(chip.id);
                  }}
                  scaleTo={0.94}
                  haptic
                >
                  <ProDayText variant="caption" inverse={on} style={on ? styles.poleTextOn : styles.poleText}>
                    {chip.label}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>
        ) : null}
      </View>

      {!hasSeeds ? (
        <View style={styles.empty} pointerEvents="box-none">
          <ProDayText variant="section" inverse style={styles.emptyTitle}>
            Aucun reel pour ce pôle
          </ProDayText>
          <ProDayText variant="caption" inverse muted style={styles.emptyText}>
            Essayez un autre univers ou revenez plus tard.
          </ProDayText>
          {allowedPoles[0] && pole !== allowedPoles[0] ? (
            <PressableSpring
              style={styles.emptyCta}
              onPress={() => setPole(allowedPoles[0])}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" style={styles.emptyCtaText}>
                Voir {POLE_CHIPS.find((c) => c.id === allowedPoles[0])?.label ?? 'Foot'}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.empty} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
          <ProDayText variant="caption" inverse muted style={styles.emptyText}>
            Chargement des reels…
          </ProDayText>
        </View>
      ) : null}
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
  brandTitle: {
    color: '#fff',
  },
  headerLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  poleRow: {
    flexDirection: 'row',
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
  poleChipOn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.92)',
  },
  poleText: { color: 'rgba(255,255,255,0.95)', fontWeight: '700' },
  poleTextOn: { color: '#111', fontWeight: '800' },
  empty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: spacing.md,
  },
  emptyTitle: { fontWeight: '800' },
  emptyText: { marginTop: spacing.sm, textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  emptyCtaText: { color: '#111', fontWeight: '800' },
});
