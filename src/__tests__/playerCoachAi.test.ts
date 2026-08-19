import { PLAYER_COACH_STARTERS } from '../content/playerCoachAiCopy';
import { isHomeTrainingIntent } from '../utils/playerCoachTrainingIntent';
import {
  isWeeklySummaryIntent,
  parseLateRsvpIntent,
  parseTrainingParams,
  parseWeeklyGoalIntent,
  resolveNavigationIntent,
} from '../utils/playerCoachIntent';

describe('playerCoachAi client', () => {
  it('expose des suggestions rapides non vides', () => {
    expect(PLAYER_COACH_STARTERS.length).toBeGreaterThanOrEqual(3);
    for (const s of PLAYER_COACH_STARTERS) {
      expect(s.length).toBeGreaterThan(2);
    }
  });

  it('détecte l’intention entraînement maison', () => {
    expect(isHomeTrainingIntent('Créer mon entraînement à la maison')).toBe(true);
    expect(isHomeTrainingIntent('programme ia perso')).toBe(true);
    expect(isHomeTrainingIntent('Créer séance 30 min pied faible')).toBe(true);
    expect(isHomeTrainingIntent('Prochain match')).toBe(false);
  });

  it('routage navigation instantanée', () => {
    expect(resolveNavigationIntent('Ouvre mes matchs')).toBe('matchs');
    expect(resolveNavigationIntent('Va à ma progression')).toBe('feed');
    expect(resolveNavigationIntent('Mon profil')).toBe('profil');
  });

  it('détecte retard convocation', () => {
    expect(parseLateRsvpIntent('Je serai en retard 10 min au prochain match')).toBe('under_10');
    expect(parseLateRsvpIntent('Retard de plus de 10 min')).toBe('over_10');
  });

  it('détecte résumé semaine et objectif', () => {
    expect(isWeeklySummaryIntent('Où en est ma progression cette semaine ?')).toBe(true);
    expect(parseWeeklyGoalIntent('Mon objectif cette semaine: améliorer mes passes')).toBe(
      'améliorer mes passes',
    );
  });

  it('parse paramètres entraînement', () => {
    const params = parseTrainingParams('Créer séance 30 min pied faible');
    expect(params?.duration_min).toBe(30);
    expect(params?.objective).toBe('pied_faible');
  });

  it('inclut des starters command center', () => {
    expect(PLAYER_COACH_STARTERS).toContain('Mon tir');
    expect(PLAYER_COACH_STARTERS).toContain('Créer séance');
    expect(PLAYER_COACH_STARTERS).toContain('Mes couleurs');
  });
});
