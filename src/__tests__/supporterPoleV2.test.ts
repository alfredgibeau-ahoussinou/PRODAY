import { resolveMatchCenterTabs } from '../services/footballData/FootballDataFacade';
import type { FootballMatchDetail } from '../services/footballData/types';
import { canPlaySupporterVideo } from '../models/SupporterVideo';

jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { getById: jest.fn() },
}));
jest.mock('../services/supporterMatchHub.service', () => ({
  fetchSupporterMatchHub: jest.fn(),
}));
jest.mock('../services/communityReels.service', () => ({
  communityReelsService: { listApproved: jest.fn(async () => []) },
}));
jest.mock('../services/supporterVideoRights.service', () => ({
  supporterVideoRightsService: { getOverride: jest.fn(async () => null) },
}));

import { supporterVideoService } from '../services/supporterVideo.service';

describe('resolveMatchCenterTabs', () => {
  const baseDetail: FootballMatchDetail = {
    item: {
      id: 'world-fixture-api_1',
      source: 'world',
      status: 'upcoming',
      genderScope: 'unspecified',
      homeLabel: 'A',
      awayLabel: 'B',
      startsAt: new Date(),
    },
    source: 'world',
    lineups: [],
    events: [],
    statistics: null,
    prodayEvent: null,
  };

  it('propose résumé + stats + compositions + événements monde (message honnête si XI vide)', () => {
    const tabs = resolveMatchCenterTabs(baseDetail, false);
    expect(tabs).toContain('resume');
    expect(tabs).toContain('stats');
    expect(tabs).toContain('compositions');
    expect(tabs).toContain('events');
    expect(tabs).not.toContain('video');
    expect(tabs).not.toContain('analyse');
  });

  it('affiche stats quand disponibles', () => {
    const tabs = resolveMatchCenterTabs(
      {
        ...baseDetail,
        statistics: { home: { Possession: '55%' }, away: { Possession: '45%' } },
      },
      false,
    );
    expect(tabs).toContain('stats');
  });

  it('affiche événements quand présents et compositions toujours', () => {
    const tabs = resolveMatchCenterTabs(
      {
        ...baseDetail,
        events: [
          {
            id: '1',
            type: 'goal',
            minute: 12,
            player_name: 'Test',
            player_uid: 'u1',
            created_at: new Date(),
          },
        ],
        lineups: [],
      },
      false,
    );
    expect(tabs).toContain('events');
    expect(tabs).toContain('compositions');
  });

  it('ajoute analyse pour matchs ProDay', () => {
    const tabs = resolveMatchCenterTabs(
      { ...baseDetail, source: 'proday', item: { ...baseDetail.item, source: 'proday' } },
      false,
    );
    expect(tabs).toContain('analyse');
  });
});

describe('supporterVideo rights gate', () => {
  it('refuse lecture sans droits AVAILABLE', () => {
    expect(
      canPlaySupporterVideo({
        id: 'v1',
        kind: 'proday_full',
        rights: 'RESTRICTED',
        title: 'Test',
        watchUrl: 'https://example.com',
      }),
    ).toBe(false);
  });

  it('accepte AVAILABLE avec URL', () => {
    expect(
      canPlaySupporterVideo({
        id: 'v1',
        kind: 'proday_full',
        rights: 'AVAILABLE',
        title: 'Test',
        watchUrl: 'https://example.com',
      }),
    ).toBe(true);
  });

  it('listAvailable filtre les vidéos non jouables', async () => {
    const list = await supporterVideoService.listAvailable({ prodayEvents: [], max: 5 });
    expect(list.every((v) => canPlaySupporterVideo(v))).toBe(true);
  });
});
