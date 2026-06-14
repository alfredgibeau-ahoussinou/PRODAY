import type { ProductLineId } from '../models/ProductLine';
import type { ReelSource } from './footballReels';

/** Seed — Instagram, TikTok ou YouTube Shorts. */
export type ReelSeed = {
  source: ReelSource;
  externalId: string;
  authorHandle: string;
  authorName: string;
  tags: string[];
};

export const REEL_ACCOUNTS: Record<ProductLineId, { handle: string; name: string }[]> = {
  homme: [
    { handle: '433', name: '433' },
    { handle: 'onefootball', name: 'OneFootball' },
  ],
  woman: [
    { handle: 'barclayswsl', name: 'Barclays WSL' },
    { handle: 'wchampionsleague', name: 'UWCL' },
    { handle: 'britifyuk', name: 'Britify' },
  ],
  pro: [
    { handle: 'coachesvoice', name: "Coaches' Voice" },
    { handle: '433', name: '433' },
  ],
  sante: [],
};

const HOMME_SEEDS: ReelSeed[] = [
  { source: 'instagram', externalId: 'C9CzDzICDcK', authorHandle: '433', authorName: '433', tags: ['#mbappe', '#laliga'] },
  { source: 'instagram', externalId: 'C4jD5JzL89x', authorHandle: '433', authorName: '433', tags: ['#psg', '#skills'] },
  { source: 'instagram', externalId: 'CpUpOWRjxLD', authorHandle: '433', authorName: '433', tags: ['#vinijr', '#skills'] },
  { source: 'instagram', externalId: 'C_vhhXWtdTW', authorHandle: '433', authorName: '433', tags: ['#mbappe'] },
  { source: 'instagram', externalId: 'DDtu66sI3p2', authorHandle: '433', authorName: '433', tags: ['#messi', '#worldcup'] },
  { source: 'instagram', externalId: 'C_Gp451NkWU', authorHandle: '433', authorName: '433', tags: ['#endrick', '#realmadrid'] },
  { source: 'instagram', externalId: 'DIOm6O-CZ2F', authorHandle: '433', authorName: '433', tags: ['#ucl', '#legends'] },
  { source: 'instagram', externalId: 'DDXKPNBAcIO', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#benzema', '#cr7'] },
  { source: 'instagram', externalId: 'DEcIqIVM7s9', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#cr7', '#spl'] },
  { source: 'instagram', externalId: 'ChaksvtjPMB', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#messi'] },
  { source: 'instagram', externalId: 'CXBLSskjD17', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#cr7', '#stats'] },
  { source: 'instagram', externalId: 'DETIgrZsFXv', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#zlatan', '#mls'] },
  { source: 'instagram', externalId: 'DJCKBB9Icm2', authorHandle: 'barclayswsl', authorName: 'Barclays WSL', tags: ['#football', '#highlights'] },
  { source: 'instagram', externalId: 'DDttm9rNM3z', authorHandle: 'britifyuk', authorName: 'Britify', tags: ['#skills', '#viral'] },
  { source: 'tiktok', externalId: '7506195349518830870', authorHandle: '433', authorName: '433', tags: ['#fc25', '#skills'] },
  { source: 'tiktok', externalId: '7506195349518830870', authorHandle: 'covplaysfifa', authorName: 'Cov Plays FIFA', tags: ['#fc25', '#tactics'] },
  { source: 'tiktok', externalId: '7493451311459994898', authorHandle: 'fcmobileplayer66', authorName: 'FC Mobile', tags: ['#tactics', '#433'] },
  { source: 'youtube', externalId: 'l1bCLWFwSfU', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#skills', '#footwork'] },
  { source: 'youtube', externalId: '3JZ_D3ELwOQ', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#skills', '#viral'] },
];

const WOMAN_SEEDS: ReelSeed[] = [
  { source: 'instagram', externalId: 'DJCKBB9Icm2', authorHandle: 'barclayswsl', authorName: 'Barclays WSL', tags: ['#WSL'] },
  { source: 'instagram', externalId: 'DI4Jalsowll', authorHandle: 'wchampionsleague', authorName: 'UWCL', tags: ['#UWCL', '#ChloeKelly'] },
  { source: 'instagram', externalId: 'DIzGFplI-K_', authorHandle: 'wchampionsleague', authorName: 'UWCL', tags: ['#UWCL'] },
  { source: 'instagram', externalId: 'DDttm9rNM3z', authorHandle: 'britifyuk', authorName: 'Britify', tags: ['#UWCL', '#WomensFootball'] },
  { source: 'instagram', externalId: 'C9CzDzICDcK', authorHandle: '433', authorName: '433', tags: ['#football', '#skills'] },
  { source: 'instagram', externalId: 'CpUpOWRjxLD', authorHandle: '433', authorName: '433', tags: ['#skills'] },
  { source: 'instagram', externalId: 'C4jD5JzL89x', authorHandle: '433', authorName: '433', tags: ['#football'] },
  { source: 'instagram', externalId: 'DDtu66sI3p2', authorHandle: '433', authorName: '433', tags: ['#worldcup'] },
  { source: 'instagram', externalId: 'DEcIqIVM7s9', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#WomensFootball'] },
  { source: 'instagram', externalId: 'ChaksvtjPMB', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#soccer'] },
  { source: 'tiktok', externalId: '7506195349518830870', authorHandle: '433', authorName: '433', tags: ['#WomensFootball', '#skills'] },
  { source: 'tiktok', externalId: '7493451311459994898', authorHandle: 'fcmobileplayer66', authorName: 'FC Mobile', tags: ['#WSL', '#tactics'] },
  { source: 'youtube', externalId: 'l1bCLWFwSfU', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#skills', '#WSL'] },
  { source: 'youtube', externalId: '3JZ_D3ELwOQ', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#WomensFootball', '#viral'] },
];

const PRO_SEEDS: ReelSeed[] = [
  { source: 'instagram', externalId: 'C8M8RKps9gr', authorHandle: 'coachesvoice', authorName: "Coaches' Voice", tags: ['#tactique', '#coaching'] },
  { source: 'instagram', externalId: 'DErno_qM_nh', authorHandle: 'coachesvoice', authorName: "Coaches' Voice", tags: ['#tactique', '#masterclass'] },
  { source: 'instagram', externalId: 'DIOm6O-CZ2F', authorHandle: '433', authorName: '433', tags: ['#ucl', '#analyse'] },
  { source: 'instagram', externalId: 'C4jD5JzL89x', authorHandle: '433', authorName: '433', tags: ['#tactics', '#collectif'] },
  { source: 'instagram', externalId: 'C_Gp451NkWU', authorHandle: '433', authorName: '433', tags: ['#training', '#pro'] },
  { source: 'instagram', externalId: 'DDtu66sI3p2', authorHandle: '433', authorName: '433', tags: ['#culture', '#football'] },
  { source: 'instagram', externalId: 'CXBLSskjD17', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#analyse', '#stats'] },
  { source: 'instagram', externalId: 'DETIgrZsFXv', authorHandle: 'onefootball', authorName: 'OneFootball', tags: ['#pro', '#mls'] },
  { source: 'tiktok', externalId: '7493451311459994898', authorHandle: 'fcmobileplayer66', authorName: 'FC Mobile', tags: ['#tactics', '#433'] },
  { source: 'tiktok', externalId: '7506195349518830870', authorHandle: 'covplaysfifa', authorName: 'Cov Plays FIFA', tags: ['#fc25', '#tactics'] },
  { source: 'tiktok', externalId: '7506195349518830870', authorHandle: '433', authorName: '433', tags: ['#coaching', '#formation'] },
  { source: 'youtube', externalId: 'l1bCLWFwSfU', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#analyse', '#skills'] },
  { source: 'youtube', externalId: '3JZ_D3ELwOQ', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#tactique', '#training'] },
];

const SANTE_EXTRA: ReelSeed[] = [
  { source: 'youtube', externalId: 'l1bCLWFwSfU', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#fitness', '#warmup'] },
  { source: 'youtube', externalId: '3JZ_D3ELwOQ', authorHandle: 'youtube', authorName: 'YouTube', tags: ['#recovery', '#stretch'] },
];

export const REEL_SEEDS: Record<ProductLineId, ReelSeed[]> = {
  homme: HOMME_SEEDS,
  woman: WOMAN_SEEDS,
  pro: PRO_SEEDS,
  sante: [],
};

export type ReelPoleId = 'foot' | 'mercato' | 'sante';

/** Pôles affichés dans le feed selon l’univers actif. */
export function polesForUniverse(universe: ProductLineId): ReelPoleId[] {
  switch (universe) {
    case 'pro':
      return ['foot', 'mercato'];
    case 'sante':
      return ['sante'];
    default:
      return ['foot', 'mercato', 'sante'];
  }
}

const POLE_HINTS: Record<ReelPoleId, string[]> = {
  foot: [
    'skills', 'football', 'ucl', 'mbappe', 'messi', 'cr7', 'wsl', 'uwcl', 'womensfootball',
    'soccer', 'viral', 'worldcup', 'laliga', 'psg', 'fc25', 'footwork', 'vinijr', 'endrick',
    'benzema', 'zlatan', 'spl', 'legends', 'realmadrid',
  ],
  mercato: [
    'tactics', 'coaching', 'tactique', 'analyse', 'training', 'pro', 'formation', 'masterclass',
    'collectif', 'stats', 'culture',
  ],
  sante: ['recovery', 'fitness', 'prevention', 'kiné', 'warmup', 'stretch'],
};

function seedMatchesPole(seed: ReelSeed, pole: ReelPoleId): boolean {
  const hints = POLE_HINTS[pole];
  return seed.tags.some((tag) => {
    const t = tag.replace('#', '').toLowerCase();
    return hints.some((h) => t.includes(h));
  });
}

export function seedsForUniverse(universe: ProductLineId, pole: ReelPoleId = 'foot'): ReelSeed[] {
  const base = REEL_SEEDS[universe];
  const pool = pole === 'sante' ? dedupeSeeds([...base, ...SANTE_EXTRA]) : base;
  const filtered = pool.filter((s) => seedMatchesPole(s, pole));
  return filtered.length > 0 ? filtered : base;
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

export function seedKey(seed: ReelSeed): string {
  return `${seed.source}-${seed.externalId}-${seed.authorHandle}`;
}
