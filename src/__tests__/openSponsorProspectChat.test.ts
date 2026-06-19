import { sponsorProspectDraftMessage } from '../utils/sponsorProspectMessage';

describe('openSponsorProspectChat', () => {
  it('préremplit le message avec le nom du club prospect', () => {
    expect(sponsorProspectDraftMessage('FC Lyon')).toContain('FC Lyon');
    expect(sponsorProspectDraftMessage('FC Lyon')).toMatch(/Bonjour/);
  });
});
