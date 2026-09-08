import {
  resolveAuthBackAction,
  resolveAuthSurface,
} from '../utils/authBackStack';

describe('authBackStack', () => {
  it('résout la surface visible (priorité legal > forgot > signup > gate > login)', () => {
    expect(
      resolveAuthSurface({
        signupOpen: true,
        showForgotPassword: true,
        legalDocument: true,
        mode: 'signupTeaser',
      }),
    ).toBe('legal');
    expect(
      resolveAuthSurface({
        signupOpen: true,
        showForgotPassword: true,
        legalDocument: false,
        mode: 'signupTeaser',
      }),
    ).toBe('forgot');
    expect(
      resolveAuthSurface({
        signupOpen: true,
        showForgotPassword: false,
        legalDocument: false,
        mode: 'login',
      }),
    ).toBe('signup');
    expect(
      resolveAuthSurface({
        signupOpen: false,
        showForgotPassword: false,
        legalDocument: false,
        mode: 'signupTeaser',
      }),
    ).toBe('gate');
    expect(
      resolveAuthSurface({
        signupOpen: false,
        showForgotPassword: false,
        legalDocument: false,
        mode: 'login',
      }),
    ).toBe('login');
  });

  it('depuis login via gate → retour au choix Créer/Se connecter', () => {
    expect(
      resolveAuthBackAction({ surface: 'login', enteredViaGate: true }),
    ).toBe('to-gate');
  });

  it('depuis login sans gate → dismiss (pas de page fantôme)', () => {
    expect(
      resolveAuthBackAction({ surface: 'login', enteredViaGate: false }),
    ).toBe('dismiss');
  });

  it('depuis le gate → dismiss vers univers/home', () => {
    expect(
      resolveAuthBackAction({ surface: 'gate', enteredViaGate: true }),
    ).toBe('dismiss');
  });

  it('fermeture signup revient au gate si entrée univers', () => {
    expect(
      resolveAuthBackAction({ surface: 'signup', enteredViaGate: true }),
    ).toBe('close-signup-to-gate');
    expect(
      resolveAuthBackAction({ surface: 'signup', enteredViaGate: false }),
    ).toBe('close-signup-to-login');
  });
});
