import {
  SANTE_PHYSIO_PREVIEW,
  SANTE_SIGNUP_PHASES,
  getSanteLaunchCopy,
  getSanteStepMeta,
  getSanteWelcomeCopy,
} from '../screens/signup/signupSanteConfig';

describe('signupSanteConfig', () => {
  it('expose un parcours cabinet en trois phases', () => {
    expect(SANTE_SIGNUP_PHASES.map((p) => p.id)).toEqual(['vous', 'acces', 'launch']);
    expect(SANTE_SIGNUP_PHASES.map((p) => p.label)).toEqual(['Cabinet', 'Compte', 'Go']);
  });

  it('personnalise l’accueil et les étapes médicales', () => {
    expect(getSanteWelcomeCopy().title).toMatch(/Santé/i);
    expect(getSanteWelcomeCopy().subtitle).toMatch(/Kiné|praticien/i);
    expect(SANTE_PHYSIO_PREVIEW).toHaveLength(3);
    expect(getSanteStepMeta('medical_specialty').heroIcon).toBe('heart');
    expect(getSanteStepMeta('account').title).toMatch(/praticien/i);
    expect(getSanteStepMeta('security').subtitle).toMatch(/diplômes/i);
  });

  it('adapte le message de fin selon la vérification', () => {
    expect(getSanteLaunchCopy({}).title).toMatch(/créé/i);
    expect(getSanteLaunchCopy({ emailVerificationPending: true }).body).toMatch(/email/i);
    expect(getSanteLaunchCopy({ verificationPending: true }).body).toMatch(/48 h/i);
  });
});
