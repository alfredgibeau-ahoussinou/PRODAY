import { buildSocialSuggestions } from '../features/v3/engines/socialRecommendation.engine';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';

const profile: User = {
  uid: 'p1',
  display_name: 'Joueur',
  email: 'j@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  profile: { level: 'Régional' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Paris',
  location: { latitude: 48.86, longitude: 2.35 },
};

const matches: FriendlyMatch[] = [
  {
    id: 'm1',
    requester_uid: 'club-uid-1',
    requester_club_id: 'c1',
    requester_club_name: 'FC Paris',
    city: 'Paris',
    date: new Date(),
    category: 'Senior',
    level: 'Régional',
    level_type: 'competition',
    has_pitch: true,
    status: 'OPEN',
    created_at: new Date(),
  },
];

describe('Phase 8. Réseau social + Discover', () => {
  it('suggère des clubs proches avec uid contactable', () => {
    const suggestions = buildSocialSuggestions({
      user: profile,
      userLocation: profile.location,
      openMatches: matches,
    });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].targetUid).toBe('club-uid-1');
    expect(suggestions[0].actionTab).toBe('matchs');
  });

  it('ne propose plus de fausse communauté locale', () => {
    const suggestions = buildSocialSuggestions({
      user: profile,
      openMatches: [],
    });
    expect(suggestions.some((s) => s.id === 'community-local')).toBe(false);
  });
});
