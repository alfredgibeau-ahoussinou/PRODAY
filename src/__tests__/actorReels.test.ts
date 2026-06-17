import { fetchActorReelSeeds } from '../services/actorReels.service';
import { communityReelToSeed } from '../utils/communityReelPlayback';
import type { CommunityReel } from '../models/CommunityReel';
import type { User } from '../models/User';

jest.mock('../services/communityReels.service', () => ({
  communityReelsService: {
    listApproved: jest.fn(),
  },
}));

jest.mock('../services/users.service', () => ({
  usersService: {
    listPlayers: jest.fn(),
    listByRole: jest.fn(),
  },
}));

import { communityReelsService } from '../services/communityReels.service';
import { usersService } from '../services/users.service';

const communityReel: CommunityReel = {
  id: 'reel-1',
  author_uid: 'uid-a',
  author_name: 'Lucas M.',
  video_url: 'https://cdn.test/reel.mp4',
  caption: 'Enchaînement skills',
  theme: 'skills',
  status: 'approved',
  created_at: new Date(),
  updated_at: new Date(),
};

const playerWithHighlight: User = {
  uid: 'uid-b',
  display_name: 'Emma D.',
  email: 'emma@test.com',
  role: 'player',
  email_verified: true,
  onboarding_documents_submitted: false,
  is_verified: false,
  verification_status: 'NOT_REQUIRED',
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  documents: [],
  profile: {
    highlight_video_urls: ['https://cdn.test/highlight.mp4'],
    position: 'Milieu',
  },
};

describe('actorReels.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (communityReelsService.listApproved as jest.Mock).mockResolvedValue([communityReel]);
    (usersService.listPlayers as jest.Mock).mockResolvedValue([playerWithHighlight]);
    (usersService.listByRole as jest.Mock).mockResolvedValue([]);
  });

  it('agrège reels communautaires et highlights profil', async () => {
    const seeds = await fetchActorReelSeeds({ productLine: 'homme' });
    expect(seeds).toHaveLength(2);
    expect(seeds[0]).toMatchObject(communityReelToSeed(communityReel));
    expect(seeds[1]).toMatchObject({
      source: 'proday',
      authorName: 'Emma D.',
      directVideoUrl: 'https://cdn.test/highlight.mp4',
    });
  });
});
