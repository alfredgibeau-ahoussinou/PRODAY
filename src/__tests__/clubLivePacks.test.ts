import {
  clubLivePackFromOfferHint,
  CLUB_LIVE_PACK_ORDER,
  CLUB_LIVE_PACKS,
  formatClubInvoiceStatus,
  isClubLivePackId,
  normalizeClubCommercialAmountEur,
} from '../content/clubLivePacks';

describe('clubLivePacks', () => {
  it('expose Tout inclus, Pro + Veo et forfait 2 lives', () => {
    expect(CLUB_LIVE_PACK_ORDER).toEqual([
      'club_premium',
      'club_video_pro',
      'veo_lives_2',
      'video_veo_pack',
    ]);
    expect(CLUB_LIVE_PACKS.veo_lives_2.shortLabel).toBe('2 lives');
    expect(CLUB_LIVE_PACKS.veo_lives_2.livesCount).toBe(2);
  });

  it('mappe offer_hint devis → pack', () => {
    expect(clubLivePackFromOfferHint('club_video_pro')).toBe('club_video_pro');
    expect(clubLivePackFromOfferHint('club_premium')).toBe('club_premium');
    expect(clubLivePackFromOfferHint(undefined)).toBe('club_premium');
  });

  it('valide les montants commerciaux', () => {
    expect(normalizeClubCommercialAmountEur(149)).toBe(149);
    expect(normalizeClubCommercialAmountEur('12,34')).toBe(12.34);
    expect(normalizeClubCommercialAmountEur('1299.5')).toBe(1299.5);
    expect(normalizeClubCommercialAmountEur(0)).toBeNull();
    expect(normalizeClubCommercialAmountEur(-5)).toBeNull();
    expect(normalizeClubCommercialAmountEur(600_000)).toBeNull();
    expect(normalizeClubCommercialAmountEur('abc')).toBeNull();
  });

  it('formate les statuts invoice Stripe', () => {
    expect(formatClubInvoiceStatus('open')).toBe('Ouverte');
    expect(formatClubInvoiceStatus('paid')).toBe('Payée');
    expect(formatClubInvoiceStatus(undefined)).toBe('Aucune');
    expect(isClubLivePackId('veo_lives_2')).toBe(true);
    expect(isClubLivePackId('club_amateur')).toBe(false);
  });
});
