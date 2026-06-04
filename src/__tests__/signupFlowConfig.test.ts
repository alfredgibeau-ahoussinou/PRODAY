import {
  buildSignupSteps,
  getFlowKind,
  needsParentalStep,
  validateAgeForAppSpace,
  getCurrentPhase,
} from '../screens/signup/signupFlowConfig';

describe('signupFlowConfig', () => {
  it('déduit le parcours staff pour coach', () => {
    expect(getFlowKind('coach')).toBe('staff');
  });

  it('déduit le parcours staff pour club', () => {
    expect(getFlowKind('club')).toBe('staff');
  });

  it('inclut family pour mineur ou espace -13', () => {
    expect(needsParentalStep(true, 'men')).toBe(true);
    expect(needsParentalStep(false, 'under_u13')).toBe(true);
    expect(needsParentalStep(false, 'men')).toBe(false);
  });

  it('parcours joueur : micro-étapes puis accès', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: false,
    });
    expect(steps).toEqual([
      'welcome',
      'space',
      'sport',
      'location',
      'stats',
      'account',
      'security',
      'launch',
    ]);
  });

  it('parcours joueur mineur : étape family', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: true,
    });
    expect(steps).toContain('family');
    expect(steps.indexOf('family')).toBeLessThan(steps.indexOf('account'));
  });

  it('parcours coach : étape coach_pro dédiée', () => {
    expect(
      buildSignupSteps('staff', { role: 'coach', parentalRequired: false })
    ).toEqual(['welcome', 'coach_pro', 'account', 'security', 'launch']);
  });

  it('parcours médical : spécialité puis cabinet', () => {
    expect(
      buildSignupSteps('staff', { role: 'physio', parentalRequired: false })
    ).toEqual([
      'welcome',
      'medical_specialty',
      'medical_practice',
      'account',
      'security',
      'launch',
    ]);
  });

  it('parcours partenaire : territoire puis identité', () => {
    expect(
      buildSignupSteps('sponsor', { role: 'sponsor', parentalRequired: false })
    ).toEqual(['welcome', 'sponsor_pro', 'account', 'security', 'launch']);
  });

  it('phases unifiées Vous / Accès / Go', () => {
    expect(getCurrentPhase('welcome')).toBe('vous');
    expect(getCurrentPhase('space')).toBe('vous');
    expect(getCurrentPhase('sport')).toBe('vous');
    expect(getCurrentPhase('family')).toBe('vous');
    expect(getCurrentPhase('account')).toBe('acces');
    expect(getCurrentPhase('security')).toBe('acces');
    expect(getCurrentPhase('launch')).toBe('launch');
  });

  it('valide l’âge selon l’espace', () => {
    expect(validateAgeForAppSpace(12, 'under_u13')).toBeUndefined();
    expect(validateAgeForAppSpace(14, 'under_u13')).toMatch(/incompatible/i);
    expect(validateAgeForAppSpace(15, 'boys')).toBeUndefined();
    expect(validateAgeForAppSpace(12, 'boys')).toMatch(/13 et 19/i);
  });
});
