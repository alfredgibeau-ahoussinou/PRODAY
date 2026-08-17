import {
  navigateClubCommunityChannel,
  type ClubCommunityChannelHandlers,
} from '../utils/clubCommunityNav';
import type { ClubChannelId } from '../content/clubCommunityChannels';

describe('clubCommunityNav', () => {
  it('route chaque salon vers le handler attendu', () => {
    const calls: ClubChannelId[] = [];
    const handlers: ClubCommunityChannelHandlers = {
      onGeneral: () => calls.push('general'),
      onMercato: () => calls.push('mercato'),
      onCovoit: () => calls.push('covoit'),
      onConvocations: () => calls.push('convocations'),
    };

    (['general', 'mercato', 'covoit', 'convocations'] as ClubChannelId[]).forEach((id) => {
      navigateClubCommunityChannel(id, handlers);
    });

    expect(calls).toEqual(['general', 'mercato', 'covoit', 'convocations']);
  });
});
