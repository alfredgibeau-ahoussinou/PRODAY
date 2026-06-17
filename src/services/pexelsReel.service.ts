import type { ReelSeed } from '../content/reelSeedCatalog';

const PEXELS_API = 'https://api.pexels.com/videos/search';

/** Vidéos foot libres de droits (fallback sans clé API). */
export const PEXELS_STATIC_SEEDS: ReelSeed[] = [
  {
    source: 'pexels',
    externalId: 'football-training-1',
    authorHandle: 'pexels',
    authorName: 'Pexels',
    tags: ['#skills', '#training', '#football'],
    themes: ['skills'],
    directVideoUrl:
      'https://videos.pexels.com/video-files/3991879/3991879-hd_720_1366_25fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/3991879/pictures/preview-0.jpg',
  },
  {
    source: 'pexels',
    externalId: 'football-match-1',
    authorHandle: 'pexels',
    authorName: 'Pexels',
    tags: ['#football', '#motivation', '#match'],
    themes: ['motivation'],
    directVideoUrl:
      'https://videos.pexels.com/video-files/5752719/5752719-hd_720_1280_25fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/5752719/pictures/preview-0.jpg',
  },
  {
    source: 'pexels',
    externalId: 'fitness-stretch-1',
    authorHandle: 'pexels',
    authorName: 'Pexels',
    tags: ['#recovery', '#stretch', '#nutrition'],
    themes: ['nutrition'],
    directVideoUrl:
      'https://videos.pexels.com/video-files/4761418/4761418-hd_720_1280_25fps.mp4',
    posterUrl: 'https://images.pexels.com/videos/4761418/pictures/preview-0.jpg',
  },
];

function apiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_PEXELS_API_KEY?.trim() || undefined;
}

export async function fetchPexelsFootballSeeds(query = 'football skills'): Promise<ReelSeed[]> {
  const key = apiKey();
  if (!key) return PEXELS_STATIC_SEEDS;

  try {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=6&orientation=portrait`,
      { headers: { Authorization: key } },
    );
    if (!res.ok) return PEXELS_STATIC_SEEDS;
    const data = (await res.json()) as {
      videos?: {
        id: number;
        url: string;
        image: string;
        video_files?: { link: string; quality?: string; width?: number }[];
      }[];
    };
    const videos = data.videos ?? [];
    if (!videos.length) return PEXELS_STATIC_SEEDS;

    return videos.map((v) => {
      const files = [...(v.video_files ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
      const best = files.find((f) => f.link.includes('.mp4')) ?? files[0];
      return {
        source: 'pexels' as const,
        externalId: String(v.id),
        authorHandle: 'pexels',
        authorName: 'Pexels',
        tags: ['#football', '#pexels'],
        directVideoUrl: best?.link,
        posterUrl: v.image,
        sourceUrl: v.url,
      };
    });
  } catch {
    return PEXELS_STATIC_SEEDS;
  }
}
