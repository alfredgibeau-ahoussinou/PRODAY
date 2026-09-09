jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getFirebaseApp: () => null }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: () => false }));

import {
  getCallableErrorMessage,
  isFunctionsUnavailable,
} from '../lib/firebaseFunctions';

describe('firebaseFunctions AI error honesty', () => {
  it('ne traite pas failed-precondition (clé Mistral) comme simple indispo', () => {
    const err = Object.assign(new Error('x'), {
      code: 'functions/failed-precondition',
      message: 'Coach IA non configuré.',
    });
    expect(isFunctionsUnavailable(err)).toBe(false);
    expect(getCallableErrorMessage(err)).toBe('Coach IA non configuré.');
  });

  it('garde not-found / unavailable comme infra', () => {
    expect(
      isFunctionsUnavailable(
        Object.assign(new Error('nf'), { code: 'functions/not-found' }),
      ),
    ).toBe(true);
    expect(
      isFunctionsUnavailable(
        Object.assign(new Error('un'), { code: 'functions/unavailable' }),
      ),
    ).toBe(true);
  });

  it('ne remplace pas un message IA failed-precondition par le texte Auth e-mail', () => {
    const err = Object.assign(new Error('Assistant IA non configuré (clé Mistral manquante).'), {
      code: 'functions/failed-precondition',
    });
    const msg = getCallableErrorMessage(err);
    expect(msg).toMatch(/Mistral|Assistant IA/i);
    expect(msg).not.toMatch(/proday\.admin@gmail\.com/i);
  });

  it('ne mappe plus unavailable/internal vers le faux message Blaze', () => {
    expect(
      getCallableErrorMessage(
        Object.assign(new Error('unavailable'), { code: 'functions/unavailable' }),
      ),
    ).toMatch(/temporairement indisponible/i);
    expect(
      getCallableErrorMessage(
        Object.assign(new Error('internal'), { code: 'functions/internal' }),
      ),
    ).toMatch(/Erreur serveur/i);
    expect(
      getCallableErrorMessage(
        Object.assign(new Error('deadline-exceeded'), {
          code: 'functions/deadline-exceeded',
        }),
      ),
    ).toMatch(/Délai dépassé/i);

    const legacy = Object.assign(
      new Error('Cloud Functions indisponibles (plan Blaze + firebase deploy --only functions).'),
      { code: 'functions/unavailable' },
    );
    expect(getCallableErrorMessage(legacy)).not.toMatch(/Blaze/i);
    expect(getCallableErrorMessage(legacy)).toMatch(/temporairement indisponible/i);
  });

  it('garde not-found nu comme hint deploy (sans Blaze)', () => {
    const msg = getCallableErrorMessage(
      Object.assign(new Error('not-found'), { code: 'functions/not-found' }),
    );
    expect(msg).toMatch(/introuvable|déploy/i);
    expect(msg).not.toMatch(/Blaze/i);
  });
});
