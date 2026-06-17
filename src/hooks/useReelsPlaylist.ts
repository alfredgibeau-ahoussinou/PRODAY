import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductLineId } from '../models/ProductLine';
import {
  instagramUrlForShortCode,
  tiktokUrlForVideo,
  youtubeShortsUrl,
  type PlaybackReel,
} from '../content/footballReels';
import {
  dedupeSeeds,
  filterSeedsForPole,
  seedKey,
  type ReelPoleId,
  type ReelSeed,
} from '../content/reelSeedCatalog';
import type { ReelThemeId } from '../content/reelThemes';
import { filterSeedsByTheme } from '../content/reelThemes';
import { editorialSortSeeds } from '../utils/reelEditorialMix';
import { seedWithDirectPlayback } from '../utils/communityReelPlayback';
import {
  resolveReelPlayback,
  shouldUseEmbedPlayback,
} from '../services/reelResolver.service';

const INITIAL_BATCH = 12;
const LOAD_MORE_BATCH = 10;
const PREFETCH_AHEAD = 2;
const MAX_RESOLVE_RETRIES = 3;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sourceUrlForSeed(seed: ReelSeed): string {
  if (seed.sourceUrl) return seed.sourceUrl;
  switch (seed.source) {
    case 'tiktok':
      return tiktokUrlForVideo(seed.authorHandle, seed.externalId);
    case 'youtube':
      return youtubeShortsUrl(seed.externalId);
    case 'pexels':
    case 'proday':
      return seed.directVideoUrl ?? '';
    default:
      return instagramUrlForShortCode(seed.externalId, seed.authorHandle);
  }
}

function seedToPlaceholder(
  seed: ReelSeed | undefined,
  universe: ProductLineId,
  reelId: string,
): PlaybackReel | null {
  if (!seed) return null;
  const direct = seedWithDirectPlayback(seed, universe, reelId);
  if (direct) return direct;
  return {
    id: reelId,
    bookmarkKey: seedKey(seed),
    shortCode: seed.externalId,
    universe,
    source: seed.source,
    videoUrl: '',
    sourceUrl: sourceUrlForSeed(seed),
    authorHandle: seed.authorHandle,
    authorName: seed.authorName,
    caption: '',
    tags: seed.tags,
    loading: !shouldUseEmbedPlayback(),
  };
}

export function useReelsPlaylist(
  universe: ProductLineId,
  pole: ReelPoleId = 'foot',
  options?: {
    rankSeeds?: (seeds: ReelSeed[]) => ReelSeed[];
    theme?: ReelThemeId;
    extraSeeds?: ReelSeed[];
    hiddenKeys?: Set<string>;
    resumeBookmarkKey?: string;
  },
) {
  const theme = options?.theme ?? 'all';
  const [reels, setReels] = useState<PlaybackReel[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [resumeIndex, setResumeIndex] = useState(0);

  const uniqueSeeds = useMemo(() => {
    const base = dedupeSeeds(options?.extraSeeds ?? []).filter((s) =>
      Boolean(s.directVideoUrl?.trim()),
    );
    const poled = filterSeedsForPole(base, pole);
    const themed = filterSeedsByTheme(poled, theme);
    const ranked = options?.rankSeeds ? options.rankSeeds(themed) : themed;
    const mixed = editorialSortSeeds(ranked);
    if (!options?.hiddenKeys?.size) return mixed;
    return mixed.filter((s) => !options.hiddenKeys!.has(seedKey(s)));
  }, [pole, theme, options?.extraSeeds, options?.rankSeeds, options?.hiddenKeys]);

  const poolRef = useRef<ReelSeed[]>([]);
  const poolIdxRef = useRef(0);
  const seqRef = useRef(0);
  const resolvingRef = useRef(new Set<string>());
  const loadingMoreRef = useRef(false);
  const reelsRef = useRef<PlaybackReel[]>([]);
  reelsRef.current = reels;

  const nextId = () => {
    const id = `reel-${seqRef.current}`;
    seqRef.current += 1;
    return id;
  };

  const takeSocialSeeds = useCallback(
    (count: number): ReelSeed[] => {
      if (uniqueSeeds.length === 0) return [];
      const batch: ReelSeed[] = [];
      for (let i = 0; i < count; i++) {
        if (poolIdxRef.current >= poolRef.current.length) {
          poolRef.current = shuffle([...uniqueSeeds]);
          poolIdxRef.current = 0;
        }
        const seed = poolRef.current[poolIdxRef.current];
        poolIdxRef.current += 1;
        if (seed) batch.push(seed);
      }
      return batch;
    },
    [uniqueSeeds],
  );

  const takeSocialSeedsRef = useRef(takeSocialSeeds);
  takeSocialSeedsRef.current = takeSocialSeeds;

  const applyResolved = useCallback(
    (reelId: string, resolved: NonNullable<Awaited<ReturnType<typeof resolveReelPlayback>>>) => {
      setReels((prev) =>
        prev.map((r) => {
          if (r.id !== reelId) return r;
          return {
            ...r,
            videoUrl: resolved.videoUrl,
            posterUrl: resolved.posterUrl ?? r.posterUrl,
            width: resolved.width,
            height: resolved.height,
            caption: resolved.caption ?? r.caption,
            authorHandle: resolved.authorHandle ?? r.authorHandle,
            authorName: resolved.authorName ?? r.authorName,
            loading: false,
            failed: false,
          };
        }),
      );
    },
    [],
  );

  const resolveReel = useCallback(
    async (reel: PlaybackReel, attempt = 0, force = false): Promise<void> => {
      if (reel.source === 'proday') {
        if (reel.videoUrl) {
          setReels((prev) =>
            prev.map((r) => (r.id === reel.id ? { ...r, loading: false, failed: false } : r)),
          );
        }
        return;
      }

      if (shouldUseEmbedPlayback()) {
        setReels((prev) =>
          prev.map((r) => (r.id === reel.id ? { ...r, loading: false, failed: false } : r)),
        );
        return;
      }

      if (resolvingRef.current.has(reel.id)) return;
      resolvingRef.current.add(reel.id);

      const resolved = await resolveReelPlayback(reel, force);

      if (!resolved?.videoUrl) {
        if (attempt < MAX_RESOLVE_RETRIES) {
          const [nextSeed] = takeSocialSeedsRef.current(1);
          const replacement = seedToPlaceholder(nextSeed, universe, reel.id);
          if (!replacement) {
            setReels((prev) =>
              prev.map((r) => (r.id === reel.id ? { ...r, loading: false, failed: true } : r)),
            );
            resolvingRef.current.delete(reel.id);
            return;
          }
          setReels((prev) => prev.map((r) => (r.id === reel.id ? replacement : r)));
          resolvingRef.current.delete(reel.id);
          await resolveReel(replacement, attempt + 1, true);
          return;
        }
        setReels((prev) =>
          prev.map((r) => (r.id === reel.id ? { ...r, loading: false, failed: true } : r)),
        );
        resolvingRef.current.delete(reel.id);
        return;
      }

      applyResolved(reel.id, resolved);
      resolvingRef.current.delete(reel.id);
    },
    [applyResolved, universe],
  );

  const resolveReelRef = useRef(resolveReel);
  resolveReelRef.current = resolveReel;

  const prefetchAround = useCallback((activeIndex: number) => {
    if (shouldUseEmbedPlayback()) return;
    const list = reelsRef.current;
    for (let offset = 0; offset <= PREFETCH_AHEAD; offset++) {
      const reel = list[activeIndex + offset];
      if (!reel || reel.failed) continue;
      if (offset === 0 || !reel.videoUrl) {
        void resolveReelRef.current(reel, 0, offset === 0);
      }
    }
  }, []);

  const buildBatch = useCallback(
    (count: number): PlaybackReel[] => {
      if (uniqueSeeds.length === 0) return [];
      const seeds = takeSocialSeeds(count);
      return shuffle(
        seeds
          .map((seed) => seedToPlaceholder(seed, universe, nextId()))
          .filter((reel): reel is PlaybackReel => reel != null),
      );
    },
    [takeSocialSeeds, universe, uniqueSeeds.length],
  );

  const prioritizeReel = useCallback(
    (reelId: string | null, activeIndex = 0) => {
      if (reelId) {
        const reel = reelsRef.current.find((r) => r.id === reelId);
        if (reel && !reel.failed) {
          void resolveReelRef.current(reel, 0, true);
        }
      }
      prefetchAround(activeIndex);
    },
    [prefetchAround],
  );

  const retryReel = useCallback((reelId: string) => {
    const reel = reelsRef.current.find((r) => r.id === reelId);
    if (!reel) return;
    resolvingRef.current.delete(reelId);
    const reset: PlaybackReel = {
      ...reel,
      loading: reel.source !== 'proday' && !shouldUseEmbedPlayback(),
      failed: false,
      videoUrl: reel.source === 'proday' ? reel.videoUrl : '',
    };
    setReels((prev) => prev.map((r) => (r.id === reelId ? reset : r)));
    if (!shouldUseEmbedPlayback()) {
      void resolveReelRef.current(reset, 0, true);
    }
  }, []);

  const buildBatchRef = useRef(buildBatch);
  buildBatchRef.current = buildBatch;
  const prioritizeReelRef = useRef(prioritizeReel);
  prioritizeReelRef.current = prioritizeReel;

  const appendBatch = useCallback(
    (count: number, activeIndex: number) => {
      const items = buildBatch(count);
      setReels((prev) => [...prev, ...items]);
      prefetchAround(activeIndex);
      return items.length;
    },
    [buildBatch, prefetchAround],
  );

  const loadMore = useCallback(
    (activeIndex: number) => {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        appendBatch(LOAD_MORE_BATCH, activeIndex);
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    },
    [appendBatch],
  );

  useEffect(() => {
    poolRef.current = shuffle([...uniqueSeeds]);
    poolIdxRef.current = 0;
    seqRef.current = 0;
    resolvingRef.current.clear();
    loadingMoreRef.current = false;

    if (uniqueSeeds.length === 0) {
      setReels([]);
      setResumeIndex(0);
      return;
    }

    const items = buildBatchRef.current(INITIAL_BATCH);
    setReels(items);

    let startIndex = 0;
    if (options?.resumeBookmarkKey) {
      const idx = items.findIndex((r) => r.bookmarkKey === options.resumeBookmarkKey);
      if (idx >= 0) startIndex = idx;
    }
    setResumeIndex(startIndex);

    const startReel = items[startIndex] ?? items[0];
    if (startReel) {
      prioritizeReelRef.current(startReel.id, startIndex);
    }
  }, [universe, pole, theme, uniqueSeeds, options?.resumeBookmarkKey]);

  const onNearEnd = useCallback(
    (activeIndex: number) => {
      if (reels.length === 0) return;
      if (activeIndex >= reels.length - 6) {
        loadMore(activeIndex);
      }
    },
    [loadMore, reels.length],
  );

  const removeReel = useCallback((bookmarkKey: string) => {
    setReels((prev) => prev.filter((r) => r.bookmarkKey !== bookmarkKey));
  }, []);

  return {
    reels,
    resumeIndex,
    hasSeeds: uniqueSeeds.length > 0,
    loadingMore,
    loadMore,
    onNearEnd,
    prioritizeReel,
    retryReel,
    removeReel,
  };
}
