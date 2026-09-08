import {
  buildSignupSteps,
  getFlowKind,
  needsParentalStep,
  validateAgeForAppSpace,
  getCurrentPhase,
  resolveSignupBackKind,
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

  it('parcours joueur : sélection club/équipe FFF d’abord, identité & sécurité ensuite', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: false,
    });
    expect(steps).toEqual([
      'sport',
      'account',
      'security',
      'launch',
    ]);
    expect(steps.indexOf('sport')).toBe(0);
    expect(steps.indexOf('account')).toBe(1);
    expect(steps.indexOf('security')).toBe(2);
  });

  it('parcours joueur mineur : étape family avant launch', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: true,
    });
    expect(steps).toContain('family');
    expect(steps.indexOf('family')).toBeGreaterThan(steps.indexOf('security'));
    expect(steps.indexOf('family')).toBeLessThan(steps.indexOf('launch'));
  });

  it('parcours coach : compte puis profil pro', () => {
    expect(
      buildSignupSteps('staff', { role: 'coach', parentalRequired: false })
    ).toEqual(['account', 'security', 'coach_pro', 'launch']);
  });

  it('parcours médical : compte puis spécialité / cabinet', () => {
    expect(
      buildSignupSteps('staff', { role: 'physio', parentalRequired: false })
    ).toEqual([
      'account',
      'security',
      'medical_specialty',
      'medical_practice',
      'launch',
    ]);
  });

  it('parcours partenaire : compte puis étapes métier', () => {
    expect(
      buildSignupSteps('sponsor', { role: 'sponsor', parentalRequired: false })
    ).toEqual([
      'account',
      'security',
      'sponsor_company',
      'sponsor_campaign',
      'sponsor_targeting',
      'launch',
    ]);
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

  it('retour signup : étape 0 → login, suivantes → previous', () => {
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 0 })).toBe('close');
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 1 })).toBe('previous');
    expect(resolveSignupBackKind({ accountCreated: true, pageIndex: 0 })).toBe('none');
  });
});
