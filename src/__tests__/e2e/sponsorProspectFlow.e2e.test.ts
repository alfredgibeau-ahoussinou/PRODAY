import { sponsorProspectDraftMessage } from '../../utils/sponsorProspectMessage';
import { scoreSponsorProspect } from '../../utils/sponsorProspectScoring';

describe('e2e. Parcours prospect sponsor', () => {
  it('score un club compatible puis prépare le message', () => {
    const clubName = 'FC Lyon';
    const prospect = scoreSponsorProspect({
      club: {
        city: 'Lyon',
        categories: ['Seniors'],
        verified: true,
        created_at: new Date(),
      },
      sponsorOffers: [{ city: 'Lyon', target_categories: ['Seniors'] }],
      hasActiveFundingGoal: true,
    });

    expect(prospect).not.toBeNull();
    expect(prospect!.match_score).toBeGreaterThanOrEqual(50);

    const draft = sponsorProspectDraftMessage(clubName);
    expect(draft).toContain(clubName);
    expect(draft).toMatch(/Bonjour/);
  });

  it('rejette un prospect hors zone. Pas de message à envoyer', () => {
    const prospect = scoreSponsorProspect({
      club: {
        city: 'Marseille',
        categories: ['Seniors'],
        verified: false,
        created_at: new Date(),
      },
      sponsorOffers: [{ city: 'Lyon', target_categories: ['Seniors'] }],
    });
    expect(prospect).toBeNull();
  });
});
