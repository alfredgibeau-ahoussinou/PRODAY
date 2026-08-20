import { getSupporterHomeLayout } from '../utils/supporterHomeLayout';

describe('supporterHomeLayout', () => {
  it('n’affiche plus la grille de zones tribune', () => {
    const layout = getSupporterHomeLayout();
    expect(layout.hasZoneGrid).toBe(false);
    expect(layout.hasTribuneHero).toBe(false);
    expect(layout.hasWeeklyQuestion).toBe(false);
    expect(layout.hasReels).toBe(false);
    expect(layout.hasTournaments).toBe(false);
    expect(layout.blocks).toEqual(['clubSearch', 'liveScores', 'followedUpcoming']);
  });
});
