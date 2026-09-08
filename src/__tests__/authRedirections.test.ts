import { shouldReopenUniverseAfterAuth } from '../utils/postAuthNavigation';
import {
  resolveAuthBackAction,
  resolveAuthSurface,
} from '../utils/authBackStack';
import { resolveGuestAuthIntentAfterUniverse } from '../components/branding/intro/universeEntryAuth';
import { shouldDismissUniverseWithoutAuth } from '../components/branding/intro/launchIntroFlow';
import {
  buildSignupSteps,
  resolveSignupStartPage,
  resolveSignupBackKind,
} from '../screens/signup/signupFlowConfig';

describe('Auth redirections — univers → gate → login/signup → home', () => {
  it('n’ouvre pas l’univers après auth si le pôle a déjà été choisi', () => {
    expect(shouldReopenUniverseAfterAuth({ hasChosenPole: true })).toBe(false);
    expect(shouldReopenUniverseAfterAuth({ hasChosenPole: false })).toBe(true);
  });

  it('Entrer dans un pôle invité ouvre le gate (signup), jamais dismiss-only', () => {
    expect(
      resolveGuestAuthIntentAfterUniverse({
        pole: 'joueur',
        hasProfile: false,
        isPlatformAdmin: false,
      }),
    ).toBe('signup');
    expect(
      shouldDismissUniverseWithoutAuth({
        hasProfile: false,
        chosenPole: 'joueur',
        currentLine: 'amateur',
        currentRole: null,
        isManualReopen: true,
      }),
    ).toBe(false);
  });

  it('back login (via gate) → gate ; gate → dismiss ; signup → gate', () => {
    expect(
      resolveAuthBackAction({
        surface: 'login',
        enteredViaGate: true,
      }),
    ).toBe('to-gate');
    expect(
      resolveAuthBackAction({
        surface: 'gate',
        enteredViaGate: true,
      }),
    ).toBe('dismiss');
    expect(
      resolveAuthBackAction({
        surface: 'signup',
        enteredViaGate: true,
      }),
    ).toBe('close-signup-to-gate');
    expect(
      resolveAuthSurface({
        signupOpen: false,
        showForgotPassword: false,
        legalDocument: false,
        mode: 'signupTeaser',
      }),
    ).toBe('gate');
  });

  it('parcours inscription foot : FFF d’abord, peu d’étapes', () => {
    expect(
      buildSignupSteps('player', { role: 'player', parentalRequired: false }),
    ).toEqual(['sport', 'account', 'security', 'launch']);
    expect(
      buildSignupSteps('staff', { role: 'coach', parentalRequired: false }),
    ).toEqual(['coach_pro', 'account', 'security', 'launch']);
    expect(
      buildSignupSteps('staff', { role: 'club', parentalRequired: false }),
    ).toEqual(['club_pro', 'account', 'security', 'launch']);
    expect(
      buildSignupSteps('player', { role: 'parent', parentalRequired: false }),
    ).toEqual(['sport', 'account', 'security', 'launch']);
  });

  it('Créer un compte ouvre toujours l’étape 1 réelle du pôle (pas account en 2e)', () => {
    expect(resolveSignupStartPage({ role: 'player', parentalRequired: false })).toBe('sport');
    expect(resolveSignupStartPage({ role: 'coach', parentalRequired: false })).toBe('coach_pro');
    expect(resolveSignupStartPage({ role: 'club', parentalRequired: false })).toBe('club_pro');
    expect(resolveSignupStartPage({ role: 'parent', parentalRequired: false })).toBe('sport');
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 0 })).toBe('close');
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 2 })).toBe('previous');
  });
});
