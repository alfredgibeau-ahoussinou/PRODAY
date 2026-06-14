import {
  fromFirestoreDoc,
  mergeProgression,
  toFirestoreDoc,
  type BrainPersistedState,
} from '../core/state/brainState.mapper';
import { buildMatchRecommendations } from '../core/recommendation/recommendation.engine';
import { buildMercatoPostRecommendations } from '../core/recommendation/mercatoRecommendation.engine';
import { buildCarpoolRideRecommendations } from '../core/geo/carpoolGeo.engine';
import { buildShopProductRecommendations } from '../core/recommendation/shopRecommendation.engine';
import { rankReelSeeds } from '../core/recommendation/reelsRanking.engine';
import { computeHealthSnapshot } from '../core/health/healthState.engine';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import type { TeamEvent, CarpoolSlot } from '../models/TeamEvent';
import type { ShopProduct } from '../content/prodayShop';
import type { ReelSeed } from '../content/reelSeedCatalog';
import type { GamificationState } from '../features/v3/models/gamification';

const baseHealth = computeHealthSnapshot({
  globalScore: 72,
  upcomingEventsCount: 2,
  pendingConvocations: 1,
  recentMatchCount: 3,
  streakDays: 5,
  profileCompletion: 80,
});

const baseProgression: GamificationState = {
  xp: 420,
  level: 3,
  xpToNext: 80,
  xpProgress: 0.6,
  streakDays: 5,
  rankLabel: 'Confirmé',
  badges: [
    {
      id: 'first_steps',
      label: 'Premiers pas',
      description: 'Première connexion',
      icon: 'football',
      unlocked: true,
    },
  ],
};

describe('Phase 4 — Brain persistence + charge moteurs', () => {
  it('sérialise et restaure le snapshot Brain', () => {
    const state: BrainPersistedState = {
      version: 1,
      health: baseHealth,
      progression: baseProgression,
      lastAction: 'join_match',
    };

    const doc = toFirestoreDoc(state);
    const restored = fromFirestoreDoc(doc);

    expect(restored?.progression.xp).toBe(420);
    expect(restored?.health.state).toBe(baseHealth.state);
    expect(restored?.lastAction).toBe('join_match');
  });

  it('fusionne la progression persistée si XP supérieur', () => {
    const computed: GamificationState = {
      ...baseProgression,
      xp: 300,
      level: 2,
    };
    const merged = mergeProgression(computed, baseProgression);
    expect(merged.xp).toBe(420);
    expect(merged.streakDays).toBe(5);
  });

  it('gère 200 matchs en moins de 500 ms', () => {
    const profile: User = {
      uid: 'p1',
      display_name: 'Load Test',
      email: 'load@test.com',
      role: 'player',
      is_verified: true,
      verification_status: 'NOT_REQUIRED',
      profile: { level: 'Régional', position: 'Milieu' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      location: { latitude: 48.86, longitude: 2.35 },
    };

    const matches: FriendlyMatch[] = Array.from({ length: 200 }, (_, i) => ({
      id: `m-${i}`,
      requester_club_id: `club-${i}`,
      requester_club_name: `Club ${i}`,
      opponent_club_name: 'Adversaire',
      city: 'Paris',
      date: new Date(Date.now() + i * 3600000),
      category: 'Senior',
      level: 'Régional',
      level_type: 'competition' as const,
      has_pitch: true,
      status: 'OPEN' as const,
      location: {
        latitude: 48.86 + (i % 10) * 0.01,
        longitude: 2.35 + (i % 10) * 0.01,
      },
      created_at: new Date(),
    }));

    const start = Date.now();
    const recs = buildMatchRecommendations({
      openMatches: matches,
      calendarItems: [],
      userLocation: profile.location,
      userLevel: profile.profile.level,
      health: baseHealth,
      radiusKm: 25,
    });
    const elapsed = Date.now() - start;

    expect(recs.length).toBe(8);
    expect(elapsed).toBeLessThan(500);
  });

  it('gère 150 annonces Mercato en moins de 300 ms', () => {
    const posts: RecruitmentPost[] = Array.from({ length: 150 }, (_, i) => ({
      id: `post-${i}`,
      club_id: `c-${i}`,
      club_name: `Club ${i}`,
      title: `Poste ${i % 4}`,
      position: i % 2 === 0 ? 'Milieu' : 'Défenseur',
      category: 'Senior',
      level: 'Régional',
      city: i % 3 === 0 ? 'Paris' : 'Lyon',
      description: 'Test',
      created_at: new Date(),
      status: 'OPEN',
    }));

    const profile: User = {
      uid: 'p1',
      display_name: 'Mercato Load',
      email: 'm@test.com',
      role: 'player',
      is_verified: true,
      verification_status: 'NOT_REQUIRED',
      profile: { position: 'Milieu', level: 'Régional' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      city: 'Paris',
    };

    const start = Date.now();
    const recs = buildMercatoPostRecommendations({
      profile,
      posts,
      pulseScore: 65,
      profileCompletion: 70,
    });
    const elapsed = Date.now() - start;

    expect(recs.length).toBe(150);
    expect(elapsed).toBeLessThan(300);
  });

  it('gère 100 trajets covoit + 80 produits + 60 réels en moins de 400 ms', () => {
    const event = {
      id: 'e1',
      title: 'Match',
      starts_at: new Date(Date.now() + 3600000),
      city: 'Paris',
    } as TeamEvent;

    const rides = Array.from({ length: 100 }, (_, i) => ({
      event,
      slot: {
        driver_uid: `d-${i}`,
        driver_name: `Driver ${i}`,
        seats: 3,
        meeting_location: {
          latitude: 48.86 + i * 0.002,
          longitude: 2.35 + i * 0.002,
        },
      } as CarpoolSlot,
    }));

    const products: ShopProduct[] = Array.from({ length: 80 }, (_, i) => ({
      id: `prod-${i}`,
      category: i % 2 === 0 ? 'equipment' : 'apparel',
      name: `Produit ${i}`,
      description: 'Desc',
      longDescription: '',
      highlights: ['test'],
      specs: [],
      priceEur: 20 + i,
      icon: 'football',
    }));

    const seeds: ReelSeed[] = Array.from({ length: 60 }, (_, i) => ({
      source: 'instagram' as const,
      externalId: `seed-${i}`,
      authorHandle: '433',
      authorName: '433',
      tags: i % 2 === 0 ? ['#récup'] : ['#skills'],
    }));

    const start = Date.now();
    const carpool = buildCarpoolRideRecommendations({
      userLocation: { latitude: 48.87, longitude: 2.34 },
      rides,
    });
    const shop = buildShopProductRecommendations({
      profile: {
        uid: 'p1',
        display_name: 'S',
        email: 's@test.com',
        role: 'player',
        is_verified: true,
        verification_status: 'NOT_REQUIRED',
        profile: { position: 'Milieu' },
        documents: [],
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      },
      products,
      healthState: 'ACTIVE',
      productLine: 'homme',
    });
    const reels = rankReelSeeds({
      seeds,
      pole: 'foot',
      healthState: 'FATIGUED',
      usefulnessMin: 0.4,
    });
    const elapsed = Date.now() - start;

    expect(carpool.length).toBe(100);
    expect(shop.length).toBe(80);
    expect(reels.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(400);
  });
});
