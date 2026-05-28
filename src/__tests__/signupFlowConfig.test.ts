import {
  buildSignupSteps,
  getFlowKind,
  needsParentalStep,
  validateAgeForAppSpace,
} from '../screens/signup/signupFlowConfig';

describe('signupFlowConfig', () => {
  it('déduit le parcours staff pour coach', () => {
    expect(getFlowKind('coach')).toBe('staff');
  });

  it('inclut parental pour mineur ou espace -13', () => {
    expect(needsParentalStep(true, 'men')).toBe(true);
    expect(needsParentalStep(false, 'under_u13')).toBe(true);
    expect(needsParentalStep(false, 'men')).toBe(false);
  });

  it('parcours joueur : documents après compte', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: false,
    });
    expect(steps).toEqual([
      'role',
      'program',
      'player',
      'account',
      'player_verify',
      'success',
    ]);
  });

  it('parcours joueur mineur : étape parental', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: true,
    });
    expect(steps).toContain('parental');
    expect(steps.indexOf('parental')).toBeLessThan(steps.indexOf('account'));
  });

  it('parcours sponsor court', () => {
    expect(
      buildSignupSteps('sponsor', { role: 'sponsor', parentalRequired: false })
    ).toEqual(['role', 'account', 'success']);
  });

  it('valide l’âge selon l’espace', () => {
    expect(validateAgeForAppSpace(12, 'under_u13')).toBeUndefined();
    expect(validateAgeForAppSpace(14, 'under_u13')).toMatch(/incompatible/i);
    expect(validateAgeForAppSpace(15, 'boys')).toBeUndefined();
    expect(validateAgeForAppSpace(12, 'boys')).toMatch(/13 et 19/i);
  });
});
