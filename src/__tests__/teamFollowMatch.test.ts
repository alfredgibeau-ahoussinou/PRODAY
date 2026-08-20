import type { Follow } from '../models/Follow';
import type { UnifiedMatch } from '../services/supporterFootball';
import { mapFdMatchToUnified } from '../services/supporterFootball/footballDataMappers';
import {
  filterMatchesForFollows,
  matchTouchesFollow,
  resolveFootballDataTeamId,
} from '../services/supporterFootball/teamFollowMatch';

function follow(partial: Partial<Follow> & Pick<Follow, 'target_id'>): Follow {
  return {
    id: 'f1',
    follower_uid: 'u1',
    target_type: 'club',
    created_at: new Date(),
    ...partial,
  };
}

const omPsg = mapFdMatchToUnified({
  id: 424242,
  utcDate: '2026-08-20T19:00:00Z',
  status: 'TIMED',
  homeTeam: { id: 516, name: 'Olympique de Marseille', shortName: 'Marseille', tla: 'OM' },
  awayTeam: { id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', tla: 'PSG' },
  competition: { id: 2015, name: 'Ligue 1', code: 'FL1' },
  score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
});

describe('teamFollowMatch — PSG cross-provider', () => {
  it('résout PSG suivi par label vers fd team 524', () => {
    expect(
      resolveFootballDataTeamId(
        follow({ target_id: 'sm-team-999', target_label: 'Paris Saint-Germain' }),
      ),
    ).toBe(524);
    expect(resolveFootballDataTeamId(follow({ target_id: 'fd-team-524', target_label: 'PSG' }))).toBe(
      524,
    );
    expect(resolveFootballDataTeamId(follow({ target_id: 'wt:id:85', target_label: 'PSG' }))).toBe(
      524,
    );
  });

  it('matche fixture FD fd-team-524 avec suivi sm + label Paris Saint-Germain', () => {
    const f = follow({ target_id: 'sm-team-591', target_label: 'Paris Saint-Germain' });
    expect(matchTouchesFollow(omPsg, f)).toBe(true);
  });

  it('matche alias PSG / Paris SG sur shortName fixture', () => {
    const f = follow({ target_id: 'club-x', target_label: 'PSG' });
    expect(matchTouchesFollow(omPsg, f)).toBe(true);
  });

  it('filterMatchesForFollows retourne OM–PSG pour un suivi PSG', () => {
    const list: UnifiedMatch[] = [omPsg];
    const out = filterMatchesForFollows(list, [
      follow({ target_id: 'sm-team-1', target_label: 'Paris Saint-Germain' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].awayTeam.id).toBe('fd-team-524');
  });

  it('ne matche pas un autre club', () => {
    const f = follow({ target_id: 'fd-team-65', target_label: 'Manchester City' });
    expect(matchTouchesFollow(omPsg, f)).toBe(false);
  });
});
