import { resolveNavigationIntent } from '../utils/playerCoachIntent';

describe('playerCoachIntent', () => {
  it('route Coach humain vers train_coach', () => {
    expect(resolveNavigationIntent('Coach humain')).toBe('train_coach');
    expect(resolveNavigationIntent('réserver un coach')).toBe('train_coach');
  });
});
