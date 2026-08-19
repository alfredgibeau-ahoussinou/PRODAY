import { PLAYER_COACH_STARTERS } from '../content/playerCoachAiCopy';

describe('playerCoachAi client', () => {
  it('expose des suggestions rapides non vides', () => {
    expect(PLAYER_COACH_STARTERS.length).toBeGreaterThanOrEqual(3);
    for (const s of PLAYER_COACH_STARTERS) {
      expect(s.length).toBeGreaterThan(5);
    }
  });
});
