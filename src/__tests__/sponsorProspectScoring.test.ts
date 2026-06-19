import { scoreSponsorProspect } from '../utils/sponsorProspectScoring';

const baseClub = {
  city: 'Lyon',
  categories: ['Seniors', 'U19'],
  verified: false,
  created_at: new Date('2024-01-01'),
};

describe('sponsorProspectScoring', () => {
  it('exclut les clubs hors zone des offres', () => {
    const result = scoreSponsorProspect({
      club: { ...baseClub, city: 'Marseille' },
      sponsorOffers: [{ city: 'Lyon', target_categories: ['Seniors'] }],
    });
    expect(result).toBeNull();
  });

  it('score élevé pour zone exacte, catégories et club vérifié', () => {
    const result = scoreSponsorProspect({
      club: {
        ...baseClub,
        verified: true,
        created_at: new Date(),
      },
      sponsorOffers: [
        { city: 'Lyon', target_categories: ['Seniors', 'U19'] },
        { city: 'Lyon 3e', target_categories: ['Seniors'] },
      ],
      hasActiveFundingGoal: true,
    });
    expect(result).not.toBeNull();
    expect(result!.match_score).toBeGreaterThanOrEqual(75);
    expect(result!.match_score).toBeLessThanOrEqual(100);
    expect(result!.reason).toContain('vérifié');
    expect(result!.reason).toContain('financement');
    expect(result!.category).toBe('Seniors');
  });

  it('score modéré pour correspondance partielle de ville', () => {
    const exact = scoreSponsorProspect({
      club: baseClub,
      sponsorOffers: [{ city: 'Lyon', target_categories: [] }],
    });
    const partial = scoreSponsorProspect({
      club: { ...baseClub, city: 'Lyon 3e' },
      sponsorOffers: [{ city: 'Lyon', target_categories: [] }],
    });
    expect(exact!.match_score).toBeGreaterThan(partial!.match_score);
  });

  it('reste entre 0 et 100', () => {
    const result = scoreSponsorProspect({
      club: {
        city: 'Paris',
        categories: ['Seniors'],
        verified: true,
        created_at: new Date(),
      },
      sponsorOffers: [{ city: 'Paris', target_categories: ['Seniors'] }],
      hasActiveFundingGoal: true,
    });
    expect(result!.match_score).toBeLessThanOrEqual(100);
    expect(result!.match_score).toBeGreaterThan(0);
    expect(result!.reason.length).toBeGreaterThan(10);
  });
});
