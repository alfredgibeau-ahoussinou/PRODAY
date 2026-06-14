import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProductLineId } from '../models/ProductLine';
import {
  instagramUrlForShortCode,
  tiktokUrlForVideo,
  youtubeShortsUrl,
  type PlaybackReel,
} from '../content/footballReels';
import { seedKey, seedsForUniverse, type ReelPoleId, type ReelSeed } from '../content/reelSeedCatalog';
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

function dedupeSeeds(seeds: ReelSeed[]): ReelSeed[] {
  const seen = new Set<string>();
  return seeds.filter((seed) => {
    const key = seedKey(seed);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceUrlForSeed(seed: ReelSeed): string {
  switch (seed.source) {
    case 'tiktok':
      return tiktokUrlForVideo(seed.authorHandle, seed.externalId);
    case 'youtube':
      return youtubeShortsUrl(seed.externalId);
    default:
      return instagramUrlForShortCode(seed.externalId, seed.authorHandle);
  }
}

function seedToPlaceholder(
  seed: ReelSeed,
  universe: ProductLineId,
  reelId: string,
): PlaybackReel {
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
  options?: { rankSeeds?: (seeds: ReelSeed[]) => ReelSeed[] },
) {
  const [reels, setReels] = useState<PlaybackReel[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const uniqueSeeds = useMemo(() => dedupeSeeds(seedsForUniverse(universe, pole)), [universe, pole]);
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
      const batch: ReelSeed[] = [];
      for (let i = 0; i < count; i++) {
        if (poolIdxRef.current >= poolRef.current.length) {
          poolRef.current = options?.rankSeeds
            ? options.rankSeeds([...uniqueSeeds])
            : shuffle(uniqueSeeds);
          poolIdxRef.current = 0;
        }
        batch.push(poolRef.current[poolIdxRef.current]);
        poolIdxRef.current += 1;
      }
      return batch;
    },
    [uniqueSeeds, options?.rankSeeds],
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
          setReels((prev) =>
            prev.map((r) => (r.id === reel.id ? replacement : r)),
          );
          resolvingRef.current.delete(reel.id);
          await resolveReel(replacement, attempt + 1, true);
          return;
        }
        setReels((prev) =>
          prev.map((r) =>
            r.id === reel.id ? { ...r, loading: false, failed: true } : r,
          ),
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
      const seeds = takeSocialSeeds(count);
      return shuffle(seeds.map((seed) => seedToPlaceholder(seed, universe, nextId())));
    },
    [takeSocialSeeds, universe],
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
      loading: !shouldUseEmbedPlayback(),
      failed: false,
      videoUrl: '',
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
    poolRef.current = options?.rankSeeds
      ? options.rankSeeds([...uniqueSeeds])
      : shuffle(uniqueSeeds);
    poolIdxRef.current = 0;
    seqRef.current = 0;
    resolvingRef.current.clear();
    loadingMoreRef.current = false;

    const items = buildBatchRef.current(INITIAL_BATCH);
    setReels(items);
    if (items[0]) {
      prioritizeReelRef.current(items[0].id, 0);
    }
  }, [universe, pole, uniqueSeeds, options?.rankSeeds]);

  const onNearEnd = useCallback(
    (activeIndex: number) => {
      if (reels.length === 0) return;
      if (activeIndex >= reels.length - 6) {
        loadMore(activeIndex);
      }
    },
    [loadMore, reels.length],
  );

  return {
    reels,
    hasSeeds: uniqueSeeds.length > 0,
    loadingMore,
    loadMore,
    onNearEnd,
    prioritizeReel,
    retryReel,
  };
}
