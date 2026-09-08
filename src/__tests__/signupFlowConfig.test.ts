import {
  buildSignupSteps,
  getFlowKind,
  needsParentalStep,
  validateAgeForAppSpace,
  getCurrentPhase,
  resolveSignupBackKind,
  isFffFirstSignupRole,
  resolveSignupStartPage,
} from '../screens/signup/signupFlowConfig';

describe('signupFlowConfig', () => {
  it('déduit le parcours staff pour coach', () => {
    expect(getFlowKind('coach')).toBe('staff');
  });

  it('déduit le parcours staff pour club', () => {
    expect(getFlowKind('club')).toBe('staff');
  });

  it('marque joueur / coach / club / parent comme FFF-first', () => {
    expect(isFffFirstSignupRole('player')).toBe(true);
    expect(isFffFirstSignupRole('coach')).toBe(true);
    expect(isFffFirstSignupRole('club')).toBe(true);
    expect(isFffFirstSignupRole('parent')).toBe(true);
    expect(isFffFirstSignupRole('sponsor')).toBe(false);
    expect(isFffFirstSignupRole('agent')).toBe(false);
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
    expect(steps).toEqual(['sport', 'account', 'security', 'launch']);
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

  it('parcours coach : affiliation FFF d’abord, puis compte', () => {
    expect(
      buildSignupSteps('staff', { role: 'coach', parentalRequired: false })
    ).toEqual(['coach_pro', 'account', 'security', 'launch']);
  });

  it('parcours club : affiliation FFF d’abord, puis compte', () => {
    expect(
      buildSignupSteps('staff', { role: 'club', parentalRequired: false })
    ).toEqual(['club_pro', 'account', 'security', 'launch']);
  });

  it('start page = première étape du parcours (coach/club ≠ account)', () => {
    expect(resolveSignupStartPage({ role: 'coach', parentalRequired: false })).toBe('coach_pro');
    expect(resolveSignupStartPage({ role: 'club', parentalRequired: false })).toBe('club_pro');
    expect(resolveSignupStartPage({ role: 'player', parentalRequired: false })).toBe('sport');
    expect(resolveSignupStartPage({ role: 'parent', parentalRequired: false })).toBe('sport');
  });

  it('parcours parent : affiliation FFF d’abord (club enfant)', () => {
    expect(
      buildSignupSteps('staff', { role: 'parent', parentalRequired: false })
    ).toEqual(['sport', 'account', 'security', 'launch']);
  });

  it('parcours agent : compte puis profil pro', () => {
    expect(
      buildSignupSteps('staff', { role: 'agent', parentalRequired: false })
    ).toEqual(['account', 'security', 'agent_pro', 'launch']);
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

  it('parcours supporter : identité + sécurité + go', () => {
    expect(
      buildSignupSteps('supporter', { role: 'supporter', parentalRequired: false })
    ).toEqual(['account', 'security', 'launch']);
  });

  it('phases unifiées Vous / Accès / Go', () => {
    expect(getCurrentPhase('welcome')).toBe('vous');
    expect(getCurrentPhase('space')).toBe('vous');
    expect(getCurrentPhase('sport')).toBe('vous');
    expect(getCurrentPhase('coach_pro')).toBe('vous');
    expect(getCurrentPhase('club_pro')).toBe('vous');
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
