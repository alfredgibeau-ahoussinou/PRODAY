jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../services/brainState.service', () => ({
  flushBrainState: jest.fn(() => Promise.resolve()),
  hydrateBrainState: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildNotificationCandidates, rankNotifications } from '../core';
import { peekNotifications } from '../features/v3/engines/smartNotifications.engine';
import { dispatchUserAction } from '../core/actionDispatch';
import {
  maybeRecordProfileCompletion,
  resetProfileCompletionAwardCache,
  PROFILE_COMPLETION_XP_THRESHOLD,
} from '../utils/recordV3Action';
import { getProfileCompletion } from '../utils/profileCompletion';
import { userStateStore } from '../core/state/userState.store';
import type { User } from '../models/User';

const completePlayer: User = {
  uid: 'p-complete',
  display_name: 'Joueur Pro',
  email: 'j@test.com',
  role: 'player',
  is_verified: true,
  verification_status: 'NOT_REQUIRED',
  avatar_url: 'https://cdn.test/avatar.jpg',
  city: 'Paris',
  profile: {
    position: 'Milieu',
    category: 'Senior',
    level: 'Régional',
    bio: 'Joueur motivé',
    season_stats: { matches: 12, goals: 3, assists: 2 },
    gallery_urls: ['https://cdn.test/g1.jpg'],
    highlight_video_urls: ['https://cdn.test/v1.mp4'],
  },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
};

describe('Phase 9 — Santé, profil, notifications', () => {
  const prevV3 = process.env.EXPO_PUBLIC_V3_SHELL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_V3_SHELL = '1';
    userStateStore.reset();
    resetProfileCompletionAwardCache();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_V3_SHELL = prevV3;
  });

  it('attribue XP book_health via dispatchUserAction', () => {
    const result = dispatchUserAction(completePlayer, 'book_health', {
      upcomingEventsCount: 0,
      pendingConvocations: 0,
      recentMatchCount: 0,
      streakDays: 1,
      globalScore: 80,
    });
    expect(result.progressionDelta.xp).toBe(12);
    expect(result.progressionDelta.reason).toBe('book_health');
  });

  it('attribue XP complete_profile une seule fois à 80 %+', () => {
    expect(getProfileCompletion(completePlayer).percent).toBeGreaterThanOrEqual(
      PROFILE_COMPLETION_XP_THRESHOLD
    );

    maybeRecordProfileCompletion(completePlayer);
    const first = userStateStore.get();
    expect(first?.lastAction).toBe('complete_profile');
    expect(first?.progression.xp).toBe(15);

    maybeRecordProfileCompletion(completePlayer);
    expect(userStateStore.get()?.progression.xp).toBe(15);
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('ne récompense pas un profil incomplet', () => {
    const incomplete: User = {
      ...completePlayer,
      uid: 'p-incomplete',
      avatar_url: undefined,
      city: '',
      profile: { level: 'Régional' },
    };
    maybeRecordProfileCompletion(incomplete);
    expect(userStateStore.get()).toBeNull();
  });

  it('peekNotifications priorise push puis inbox', () => {
    const candidates = buildNotificationCandidates({
      pendingConvocations: 2,
      unreadMessages: 5,
      healthAlert: true,
      mercatoOpportunities: 3,
    });
    const ranked = rankNotifications(candidates);
    const peek = peekNotifications(ranked);

    expect(peek.push.length).toBeLessThanOrEqual(3);
    expect(peek.total).toBe(candidates.length);
    expect(peek.push[0]?.kind).toBe('health');
    expect([...peek.push, ...peek.inboxPreview].length).toBeGreaterThan(0);
  });
});
