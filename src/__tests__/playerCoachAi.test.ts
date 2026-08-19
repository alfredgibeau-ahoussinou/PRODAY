import { PLAYER_COACH_STARTERS } from '../content/playerCoachAiCopy';
import { isHomeTrainingIntent } from '../utils/playerCoachTrainingIntent';

describe('playerCoachAi client', () => {
  it('expose des suggestions rapides non vides', () => {
    expect(PLAYER_COACH_STARTERS.length).toBeGreaterThanOrEqual(3);
    for (const s of PLAYER_COACH_STARTERS) {
      expect(s.length).toBeGreaterThan(5);
    }
  });

  it('détecte l’intention entraînement maison', () => {
    expect(isHomeTrainingIntent('Créer mon entraînement à la maison')).toBe(true);
    expect(isHomeTrainingIntent('programme ia perso')).toBe(true);
    expect(isHomeTrainingIntent('Comment préparer mon prochain match ?')).toBe(false);
  });

  it('inclut une suggestion entraînement dans les starters', () => {
    expect(PLAYER_COACH_STARTERS.some((s) => isHomeTrainingIntent(s))).toBe(true);
  });
});
