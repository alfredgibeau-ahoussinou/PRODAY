import { getIsoWeekKey } from '../utils/weekKey';
import { validateWeeklyResponseBody } from '../utils/weeklyQuestionValidation';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';

describe('getIsoWeekKey', () => {
  it('retourne une clé semaine ISO', () => {
    const key = getIsoWeekKey(new Date('2026-06-08T12:00:00'));
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('validateWeeklyResponseBody', () => {
  it('refuse une réponse vide', () => {
    expect(validateWeeklyResponseBody('   ')).toBeTruthy();
  });

  it('accepte une réponse valide', () => {
    expect(validateWeeklyResponseBody('Prêt pour le match samedi')).toBeNull();
  });
});

describe('canParticipateWeeklyQuestion', () => {
  it('autorise les profils communauté', () => {
    expect(canParticipateWeeklyQuestion('player')).toBe(true);
    expect(canParticipateWeeklyQuestion('coach')).toBe(true);
    expect(canParticipateWeeklyQuestion('agent')).toBe(true);
  });

  it('refuse le profil sponsor', () => {
    expect(canParticipateWeeklyQuestion('sponsor')).toBe(false);
  });
});
