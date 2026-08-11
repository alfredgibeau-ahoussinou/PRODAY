/**
 * Tests catalogue offres Club / Vidéo / Pass Joueur.
 */
import {
  CLUB_OFFER_ORDER,
  CLUB_OFFERS,
  PLAYER_PASS_PREMIUM_EUR,
  clubOfferFromStorePlanId,
  clubOfferHasFeature,
  formatClubOfferPrice,
} from '../content/clubOffers';
import {
  VIDEO_ANALYSIS_CAPABILITIES,
  VIDEO_HARDWARE_ACQUISITION_LABELS,
  VIDEO_MODULE_PRINCIPLE,
  VIDEO_OFFERS,
  VIDEO_OFFER_ORDER,
  VIDEO_VENDORS,
  resolveVideoOfferAnnualPrice,
} from '../content/videoOffers';
import { SUBSCRIPTION_PLANS } from '../content/subscriptionPlans';
import {
  canAccessSmartTactics,
  canManageConvocations,
} from '../utils/clubFeatureAccess';

describe('clubOffers', () => {
  it('expose Amateur · Essentiel · Tout inclus · Pro+Veo', () => {
    expect(CLUB_OFFER_ORDER).toEqual([
      'club_amateur',
      'club_essentiel',
      'club_premium',
      'club_video_pro',
    ]);
    expect(CLUB_OFFERS.club_premium.coachesIncluded).toBe(true);
    expect(CLUB_OFFERS.club_essentiel.coachesIncluded).toBe(false);
    expect(CLUB_OFFERS.club_video_pro.hardwareIncluded).toBe(true);
    expect(CLUB_OFFERS.club_video_pro.cameraRequired).toBe(false);
    expect(PLAYER_PASS_PREMIUM_EUR).toBe(3.99);
  });

  it('mappe club_pro store → Essentiel', () => {
    expect(clubOfferFromStorePlanId('club_pro')).toBe('club_essentiel');
    expect(clubOfferHasFeature('club_amateur', 'smart_tactics')).toBe(false);
    expect(clubOfferHasFeature('club_premium', 'smart_tactics')).toBe(true);
    expect(clubOfferHasFeature('club_video_pro', 'hardware_kit')).toBe(true);
  });
});

describe('videoOffers', () => {
  it('n’exige jamais une caméra', () => {
    for (const id of VIDEO_OFFER_ORDER) {
      expect(VIDEO_OFFERS[id].cameraRequired).toBe(false);
      expect(VIDEO_OFFERS[id].pricing.adminConfigurable).toBe(true);
    }
    expect(VIDEO_OFFERS.proday_pro_camera.hardwareIncluded).toBe(true);
  });

  it('Pro+Veo sans prix fixe catalogue', () => {
    expect(VIDEO_OFFERS.proday_pro_camera.pricing.annualEur).toBeNull();
    expect(resolveVideoOfferAnnualPrice('proday_pro_camera').annualEur).toBeNull();
    expect(
      resolveVideoOfferAnnualPrice('proday_pro_camera', {
        'video.pro_camera.display_price': 2400,
      }).annualEur,
    ).toBe(2400);
  });

  it('supporte multi-fabricants et modes d’acquisition', () => {
    expect(VIDEO_VENDORS.map((v) => v.id)).toEqual(
      expect.arrayContaining([
        'smartphone',
        'tablet',
        'veo',
        'xbotgo',
        'trace',
        'pixellot',
        'spiideo',
      ]),
    );
    expect(VIDEO_OFFERS.proday_pro_camera.hardwareAcquisition).toEqual([
      'own_camera',
      'lease',
      'purchase',
    ]);
    expect(Object.keys(VIDEO_HARDWARE_ACQUISITION_LABELS)).toHaveLength(3);
    expect(VIDEO_ANALYSIS_CAPABILITIES.length).toBeGreaterThanOrEqual(9);
    expect(VIDEO_MODULE_PRINCIPLE.toLowerCase()).toContain('jamais');
  });
});

describe('subscriptionPlans — modèle cible', () => {
  it('Pass Joueur à 3,99 € et trois offres club', () => {
    expect(SUBSCRIPTION_PLANS.player_plus.pricing.monthlyEur).toBe(3.99);
    expect(SUBSCRIPTION_PLANS.club_amateur.label).toBe('Club Amateur');
    expect(SUBSCRIPTION_PLANS.club_pro.label).toBe('Club Essentiel');
    expect(SUBSCRIPTION_PLANS.club_premium.label).toBe('Tout inclus');
    expect(SUBSCRIPTION_PLANS.club_premium.pricing.quoteOnly).toBe(true);
    expect(formatClubOfferPrice(CLUB_OFFERS.club_premium)).toBe(
      'Sur devis · À partir de 3 € / adhérent',
    );
  });
});

describe('clubFeatureAccess — Smart Tactics', () => {
  it('autorise coach pro ou coach couvert Premium', () => {
    expect(canAccessSmartTactics({ role: 'coach', tier: 'pro' })).toBe(true);
    expect(canAccessSmartTactics({ role: 'coach', tier: 'free' })).toBe(false);
    expect(
      canAccessSmartTactics({ role: 'coach', tier: 'free', clubCoversCoach: true }),
    ).toBe(true);
    expect(
      canManageConvocations({
        role: 'club',
        tier: 'pro',
        clubOfferId: 'club_amateur',
      }),
    ).toBe(true);
  });
});
