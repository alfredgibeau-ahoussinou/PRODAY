import type { ProductLineId } from '../models/ProductLine';
import type { User, UserRole } from '../models/User';
import type { ReelSeed } from '../content/reelSeedCatalog';
import { seedKey } from '../content/reelSeedCatalog';
import { communityReelsService } from './communityReels.service';
import { usersService } from './users.service';
import { communityReelToSeed } from '../utils/communityReelPlayback';

const ACTOR_ROLES: UserRole[] = ['player', 'coach', 'club'];

function roleTags(user: User): string[] {
  const tags = ['#proday', '#highlight'];
  if (user.role === 'player') tags.push('#joueur', '#skills', '#football');
  if (user.role === 'coach') tags.push('#coach', '#coaching', '#tactique', '#mercato');
  if (user.role === 'club') tags.push('#club', '#équipe', '#mercato');
  const position = user.profile?.position?.toLowerCase().replace(/\s+/g, '');
  if (position) tags.push(`#${position}`);
  return tags;
}

function roleThemes(user: User): ReelSeed['themes'] {
  if (user.role === 'coach' || user.role === 'club') return ['motivation'];
  if (user.role === 'physio') return ['nutrition'];
  return ['skills'];
}

function highlightCaption(user: User, index: number): string {
  const label =
    user.role === 'player'
      ? 'Highlight joueur'
      : user.role === 'coach'
        ? 'Highlight coach'
        : 'Highlight club';
  const position = user.profile?.position;
  if (position && user.role === 'player') {
    return `${label} · ${position}`;
  }
  if (index > 0) return `${label} ${index + 1}`;
  return label;
}

function userHighlightsToSeeds(user: User): ReelSeed[] {
  const urls = user.profile?.highlight_video_urls?.filter(Boolean) ?? [];
  return urls.map((url, index) => ({
    source: 'proday' as const,
    externalId: `highlight-${user.uid}-${index}`,
    authorHandle: user.uid.slice(0, 10),
    authorName: user.display_name || 'Membre ProDay',
    tags: roleTags(user),
    themes: roleThemes(user),
    directVideoUrl: url,
    sourceUrl: url,
    caption: highlightCaption(user, index),
    actorUid: user.uid,
    actorRole: user.role,
    clubId: user.profile?.club_id,
  }));
}

function matchesUniverse(user: User, productLine: ProductLineId): boolean {
  if (productLine === 'sante') {
    return user.role === 'physio' || user.role === 'coach';
  }
  if (!user.product_line) return true;
  if (productLine === 'pro') {
    return user.role !== 'player' || user.product_line === 'pro';
  }
  return user.product_line === productLine;
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

function sortCommunityFirstClub<T extends { club_id?: string }>(items: T[], clubId?: string): T[] {
  if (!clubId) return items;
  return [
    ...items.filter((item) => item.club_id === clubId),
    ...items.filter((item) => item.club_id !== clubId),
  ];
}

export async function fetchActorReelSeeds(options?: {
  clubId?: string;
  productLine?: ProductLineId;
}): Promise<ReelSeed[]> {
  const productLine = options?.productLine ?? 'homme';

  const [community, players, coaches, clubs] = await Promise.all([
    communityReelsService.listApproved(50),
    usersService.listPlayers(),
    usersService.listByRole('coach'),
    usersService.listByRole('club'),
  ]);

  const communityOrdered = sortCommunityFirstClub(community, options?.clubId);
  const communitySeeds = communityOrdered.map(communityReelToSeed);

  const actors = [...players, ...coaches, ...clubs].filter((user) =>
    ACTOR_ROLES.includes(user.role),
  );
  const universeActors = actors.filter((user) => matchesUniverse(user, productLine));
  const pool = universeActors.length > 0 ? universeActors : actors;
  const highlightSeeds = pool.flatMap(userHighlightsToSeeds);

  const clubHighlights = options?.clubId
    ? [
        ...highlightSeeds.filter((s) => s.clubId === options.clubId),
        ...highlightSeeds.filter((s) => s.clubId !== options.clubId),
      ]
    : highlightSeeds;

  return dedupeSeeds([...communitySeeds, ...clubHighlights]);
}
