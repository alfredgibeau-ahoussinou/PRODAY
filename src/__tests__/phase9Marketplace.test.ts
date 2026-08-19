import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  filterEquipmentListings,
  resolveMarketplaceContactPolicy,
  type ClubEquipmentListing,
  type EquipmentListingFilter,
} from '../models/ClubEquipmentListing';
import {
  SPONSOR_TARGET_SCOPES,
  type SponsorOffer,
  type SponsorTargetScope,
} from '../models/SponsorOffer';
import type { ClubSponsorPackage, ClubSponsorPackageScope } from '../models/ClubSponsorPackage';
import type { PlatformConfig } from '../models/PlatformConfig';

function makeListing(overrides: Partial<ClubEquipmentListing> = {}): ClubEquipmentListing {
  return {
    id: 'l1',
    club_id: 'c1',
    kind: 'sell',
    title: 'Test',
    description: 'desc',
    category: 'crampons',
    condition: 'good',
    price_cents: 1500,
    photo_urls: [],
    author_uid: 'u1',
    author_is_minor: false,
    visibility: 'club_members',
    created_at: new Date(),
    updated_at: new Date(),
    status: 'published',
    ...overrides,
  };
}

describe('Phase 9 — Marketplace équipements', () => {
  test('EQUIPMENT_CATEGORIES contient les types requis', () => {
    const ids = EQUIPMENT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain('crampons');
    expect(ids).toContain('survetement');
    expect(ids).toContain('maillot');
    expect(ids).toContain('gants');
    expect(ids).toContain('protege_tibias');
    expect(ids).toContain('ballon');
    expect(ids).toContain('autre');
  });

  test('EQUIPMENT_CONDITIONS couvre neuf/bon/usé', () => {
    const ids = EQUIPMENT_CONDITIONS.map((c) => c.id);
    expect(ids).toEqual(['new', 'very_good', 'good', 'used']);
  });

  test('filterEquipmentListings — filtre par catégorie', () => {
    const listings = [
      makeListing({ id: '1', category: 'crampons' }),
      makeListing({ id: '2', category: 'maillot' }),
      makeListing({ id: '3', category: 'crampons' }),
    ];
    const result = filterEquipmentListings(listings, { category: 'crampons' });
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.category === 'crampons')).toBe(true);
  });

  test('filterEquipmentListings — filtre par état', () => {
    const listings = [
      makeListing({ id: '1', condition: 'new' }),
      makeListing({ id: '2', condition: 'used' }),
    ];
    expect(filterEquipmentListings(listings, { condition: 'new' })).toHaveLength(1);
  });

  test('filterEquipmentListings — filtre par prix max', () => {
    const listings = [
      makeListing({ id: '1', price_cents: 500 }),
      makeListing({ id: '2', price_cents: 2000 }),
      makeListing({ id: '3', price_cents: null }),
    ];
    const result = filterEquipmentListings(listings, { maxPriceCents: 1000 });
    expect(result).toHaveLength(2);
  });

  test('filterEquipmentListings — filtre combiné', () => {
    const listings = [
      makeListing({ id: '1', category: 'crampons', condition: 'new', price_cents: 3000 }),
      makeListing({ id: '2', category: 'crampons', condition: 'new', price_cents: 500 }),
      makeListing({ id: '3', category: 'maillot', condition: 'new', price_cents: 500 }),
    ];
    const result = filterEquipmentListings(listings, {
      category: 'crampons',
      condition: 'new',
      maxPriceCents: 1000,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('ClubEquipmentListing supporte status sold/given', () => {
    const sold = makeListing({ status: 'sold', buyer_uid: 'u2', sold_at: new Date() });
    expect(sold.status).toBe('sold');
    expect(sold.buyer_uid).toBe('u2');

    const given = makeListing({ status: 'given' });
    expect(given.status).toBe('given');
  });

  test('resolveMarketplaceContactPolicy — mineur bloqué', () => {
    const policy = resolveMarketplaceContactPolicy({
      listingAuthorUid: 'minor1',
      listingAuthorIsMinor: true,
      guardianUid: 'parent1',
      viewerUid: 'adult1',
      viewerIsMinor: false,
      viewerIsClubStaff: false,
    });
    expect(policy.allowDirectContact).toBe(false);
  });
});

describe('Phase 9 — Sponsoring local amélioré', () => {
  test('SponsorOffer supporte sponsor_target', () => {
    const offer: SponsorOffer = {
      id: 'o1',
      company_name: 'Test SA',
      logo_url: '',
      offer_type: 'money',
      description: 'Sponsoring match',
      value: '500€',
      target_categories: [],
      city: 'Lyon',
      active: true,
      created_at: new Date(),
      sponsor_target: 'match',
      duration_days: 90,
      amount_cents: 50000,
      desired_visibility: 'Logo sur maillot',
    };
    expect(offer.sponsor_target).toBe('match');
    expect(offer.duration_days).toBe(90);
    expect(offer.amount_cents).toBe(50000);
  });

  test('SPONSOR_TARGET_SCOPES couvre les 5 cibles', () => {
    const ids = SPONSOR_TARGET_SCOPES.map((s) => s.id);
    expect(ids).toEqual(['club', 'team', 'match', 'tournament', 'event']);
  });

  test('ClubSponsorPackage accepte scope club', () => {
    const pkg: ClubSponsorPackage = {
      id: 'pkg1',
      club_id: 'c1',
      label: 'Sponsor Club',
      scope: 'club' as ClubSponsorPackageScope,
      price_cents: 10000,
      visibility_slots: ['match_page_logo'],
      active: true,
      created_at: new Date(),
    };
    expect(pkg.scope).toBe('club');
  });

  test('PlatformConfig supporte sponsor_commission configurable', () => {
    const config: PlatformConfig = {
      maintenance_mode: false,
      maintenance_message: '',
      feature_flags: {
        community_reels: true,
        mercato: true,
        supporter: true,
        shop: true,
        stages: true,
        registration_open: true,
        sante_visio: false,
        club_video: false,
        coach_video: false,
      },
      sponsor_commission: {
        proday_percent: 10,
        min_amount_eur: 50,
      },
    };
    expect(config.sponsor_commission?.proday_percent).toBe(10);
    expect(config.sponsor_commission?.min_amount_eur).toBe(50);
  });
});
