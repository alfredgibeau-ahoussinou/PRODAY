import { getDiscoverGuestJourneySteps } from '../content/discoverGuestJourney';

describe('discoverGuestJourney', () => {
  it('adapte le parcours invité par univers', () => {
    expect(getDiscoverGuestJourneySteps('homme')[0].title).toBe('Profil');
    expect(getDiscoverGuestJourneySteps('woman')[1].title).toMatch(/Mercato/);
    expect(getDiscoverGuestJourneySteps('pro')[0].title).toMatch(/staff/i);
    expect(getDiscoverGuestJourneySteps('sante')[0].title).toBe('Profil joueur');
  });
});
