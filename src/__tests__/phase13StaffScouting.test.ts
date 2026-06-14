import {
  scorePlayerForScouting,
  sortPlayersByScouting,
  scoutingScoreMap,
} from '../features/v3/engines/playerScouting.engine';
import type { User } from '../models/User';

const coach: User = {
  uid: 'coach-1',
  display_name: 'Coach',
  email: 'c@test.com',
  role: 'coach',
  is_verified: true,
  verification_status: 'VERIFIED',
  profile: { level: 'Régional', club_id: 'club-1' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Paris',
};

const playerA: User = {
  uid: 'p-a',
  display_name: 'Alice',
  email: 'a@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  avatar_url: 'https://cdn.test/a.jpg',
  city: 'Paris',
  profile: {
    position: 'Milieu',
    level: 'Régional',
    category: 'Senior',
    season_stats: { matches: 10, goals: 3, assists: 2 },
    highlight_video_urls: ['https://v.test/1.mp4'],
  },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
};

const playerB: User = {
  uid: 'p-b',
  display_name: 'Bob',
  email: 'b@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  profile: { level: 'Départemental' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Lyon',
};

describe('Phase 13 — Scouting staff + animations', () => {
  it('score plus haut pour un profil complet et local', () => {
    const scoreA = scorePlayerForScouting(coach, playerA);
    const scoreB = scorePlayerForScouting(coach, playerB);
    expect(scoreA.score).toBeGreaterThan(scoreB.score);
    expect(scoreA.label).toMatch(/prometteur|explorer/i);
  });

  it('trie les joueurs par score scouting', () => {
    const sorted = sortPlayersByScouting(coach, [playerB, playerA]);
    expect(sorted[0].uid).toBe('p-a');
  });

  it('expose une map de scores par uid', () => {
    const map = scoutingScoreMap(coach, [playerA, playerB]);
    expect(map.get('p-a')?.score).toBeGreaterThan(map.get('p-b')?.score ?? 0);
  });
});
