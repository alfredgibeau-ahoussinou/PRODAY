import type { RecruitmentPost } from '../models/Player';
import type { MercatoQuickTileId } from '../content/mercatoExperience';

export type MercatoSearchSuggestion =
  | { kind: 'club'; label: string; query: string }
  | { kind: 'city'; label: string; query: string }
  | { kind: 'position'; label: string; query: string }
  | { kind: 'explorer'; label: string; hint: string; tileId: MercatoQuickTileId };

export function buildMercatoSearchSuggestions(
  posts: RecruitmentPost[],
  query: string,
  playersLabel: string
): MercatoSearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const suggestions: MercatoSearchSuggestion[] = [];
  const seen = new Set<string>();

  const push = (s: MercatoSearchSuggestion) => {
    const key = `${s.kind}:${'query' in s ? s.query : s.tileId}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(s);
  };

  for (const post of posts) {
    if (post.club_name.toLowerCase().includes(q)) {
      push({ kind: 'club', label: post.club_name, query: post.club_name });
    }
    if (post.city.toLowerCase().includes(q)) {
      push({ kind: 'city', label: post.city, query: post.city });
    }
    if (post.position.toLowerCase().includes(q)) {
      push({ kind: 'position', label: post.position, query: post.position });
    }
    if (suggestions.length >= 6) break;
  }

  if (q.includes('jou') || q.includes('profil')) {
    push({
      kind: 'explorer',
      label: playersLabel,
      hint: 'Profils & CV',
      tileId: 'players',
    });
  }
  if (q.includes('club') || q.includes('struct')) {
    push({ kind: 'explorer', label: 'Clubs', hint: 'Structures', tileId: 'clubs' });
  }
  if (q.includes('detect') || q.includes('essai') || q.includes('scout')) {
    push({
      kind: 'explorer',
      label: 'Détections',
      hint: 'Essais & scouting',
      tileId: 'detections',
    });
  }
  if (q.includes('stage') || q.includes('camp')) {
    push({
      kind: 'explorer',
      label: 'Stages',
      hint: 'Camps & stages',
      tileId: 'stages',
    });
  }

  return suggestions.slice(0, 8);
}
