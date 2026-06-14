import { buildCarpoolRideRecommendations } from '../core/geo/carpoolGeo.engine';
import { buildShopProductRecommendations } from '../core/recommendation/shopRecommendation.engine';
import { rankReelSeeds } from '../core/recommendation/reelsRanking.engine';
import type { TeamEvent, CarpoolSlot } from '../models/TeamEvent';
import type { ShopProduct } from '../content/prodayShop';
import type { ReelSeed } from '../content/reelSeedCatalog';

const event = {
  id: 'e1',
  title: 'Match',
  starts_at: new Date(Date.now() + 3600000),
  city: 'Paris',
} as TeamEvent;

const slot = {
  driver_uid: 'd1',
  driver_name: 'Driver',
  seats: 3,
  meeting_location: { latitude: 48.86, longitude: 2.35 },
} as CarpoolSlot;

describe('Phase 3 — Covoit. Réels Shop', () => {
  it('priorise les trajets proches', () => {
    const recs = buildCarpoolRideRecommendations({
      userLocation: { latitude: 48.87, longitude: 2.34 },
      rides: [{ event, slot }],
    });
    expect(recs[0].iaScore).toBeGreaterThan(50);
    expect(recs[0].distanceKm).not.toBeNull();
  });

  it('score les produits shop par poste et santé', () => {
    const products: ShopProduct[] = [
      {
        id: 'gloves',
        category: 'equipment',
        name: 'Gants gardien pro',
        description: 'Protection gants',
        longDescription: '',
        highlights: ['protection'],
        specs: [],
        priceEur: 49,
        icon: 'football',
      },
    ];
    const recs = buildShopProductRecommendations({
      profile: {
        uid: 'p1',
        display_name: 'G',
        email: 'g@test.com',
        role: 'player',
        is_verified: true,
        verification_status: 'NOT_REQUIRED',
        profile: { position: 'Gardien' },
        documents: [],
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
      },
      products,
      healthState: 'INJURY_RISK',
      productLine: 'homme',
    });
    expect(recs[0].iaScore).toBeGreaterThan(50);
    expect(recs[0].reason).toBeTruthy();
  });

  it('filtre les réels par utilité santé', () => {
    const seeds: ReelSeed[] = [
      {
        source: 'instagram',
        externalId: 'a',
        authorHandle: '433',
        authorName: '433',
        tags: ['#récup', '#prévention'],
      },
      {
        source: 'instagram',
        externalId: 'b',
        authorHandle: '433',
        authorName: '433',
        tags: ['#skills'],
      },
    ];
    const ranked = rankReelSeeds({
      seeds,
      pole: 'sante',
      healthState: 'OVERLOADED',
      usefulnessMin: 0.45,
    });
    expect(ranked[0].tags).toContain('#récup');
  });
});
