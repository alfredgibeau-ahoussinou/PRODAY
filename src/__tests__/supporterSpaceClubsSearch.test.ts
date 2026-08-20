import { createSupporterFootballFacade } from '../services/supporterFootball';
import { clearClubSearchHits } from '../utils/clearClubSearchHits';
import type { UnifiedTeamRef } from '../services/supporterFootball';

describe('SupporterSpace Clubs search loop guards', () => {
  it('createSupporterFootballFacade renvoie une nouvelle instance à chaque appel (à mémoïser)', () => {
    const a = createSupporterFootballFacade([], []);
    const b = createSupporterFootballFacade([], []);
    expect(a).not.toBe(b);
  });

  it('clearClubSearchHits ne change pas la référence si déjà vide (évite max update depth)', () => {
    const empty: UnifiedTeamRef[] = [];
    expect(clearClubSearchHits(empty)).toBe(empty);
  });

  it('clearClubSearchHits vide une liste non vide', () => {
    const prev: UnifiedTeamRef[] = [{ id: '1', name: 'PSG' }];
    expect(clearClubSearchHits(prev)).toEqual([]);
  });
});
