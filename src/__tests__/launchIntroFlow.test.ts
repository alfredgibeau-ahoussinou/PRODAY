import {
  brandSessionTotalMs,
  brandWelcomeTotalMs,
  BRAND_SESSION_COPY,
  BRAND_SESSION_REVEAL,
  BRAND_WELCOME_REVEAL,
  resolveIntroExitAction,
  shouldDismissUniverseWithoutAuth,
  shouldSkipPoleTransition,
  UNIVERSE_CONFIRM_LEAVE,
} from '../components/branding/intro/launchIntroFlow';

describe('launchIntroFlow', () => {
  it('ferme le picker manuel sans marquer l’intro', () => {
    expect(resolveIntroExitAction(true)).toBe('close-manual');
    expect(resolveIntroExitAction(false)).toBe('mark-complete');
  });

  it('ignore la transition si le même pôle carousel est confirmé en mode manuel', () => {
    expect(shouldSkipPoleTransition('joueur', 'amateur', 'player', true)).toBe(true);
    expect(shouldSkipPoleTransition('amateur', 'amateur', 'player', true)).toBe(true);
    expect(shouldSkipPoleTransition('pro_player', 'pro_player', 'player', true)).toBe(true);
    expect(shouldSkipPoleTransition('pro_club', 'pro_club', 'club', true)).toBe(true);
    expect(shouldSkipPoleTransition('president', 'pro_club', 'club', true, 'president')).toBe(
      true,
    );
    expect(shouldSkipPoleTransition('pro_club', 'pro_club', 'club', true, 'president')).toBe(
      false,
    );
    expect(shouldSkipPoleTransition('president', 'pro_club', 'club', true, 'club')).toBe(false);
    expect(shouldSkipPoleTransition('pro_player', 'pro', 'player', true)).toBe(true);
    expect(shouldSkipPoleTransition('supporter', 'amateur', 'player', true)).toBe(false);
    expect(shouldSkipPoleTransition('joueur', 'amateur', 'player', false)).toBe(false);
    expect(shouldSkipPoleTransition('joueur', undefined, undefined, true)).toBe(false);
  });

  it('invité : Entrer dans Joueur/Coach ouvre toujours l’auth (jamais dismiss-only)', () => {
    expect(
      shouldDismissUniverseWithoutAuth({
        hasProfile: false,
        chosenPole: 'joueur',
        currentLine: 'amateur',
        currentRole: null,
        isManualReopen: true,
      }),
    ).toBe(false);
    expect(
      shouldDismissUniverseWithoutAuth({
        hasProfile: false,
        chosenPole: 'coach',
        currentLine: 'amateur',
        currentRole: null,
        isManualReopen: true,
      }),
    ).toBe(false);
    expect(
      shouldDismissUniverseWithoutAuth({
        hasProfile: true,
        chosenPole: 'joueur',
        currentLine: 'amateur',
        currentRole: 'player',
        isManualReopen: true,
      }),
    ).toBe(true);
  });

  it('garde une leave confirmation courte et directe', () => {
    expect(UNIVERSE_CONFIRM_LEAVE.exitMs).toBeGreaterThanOrEqual(200);
    expect(UNIVERSE_CONFIRM_LEAVE.exitMs).toBeLessThanOrEqual(350);
    expect(UNIVERSE_CONFIRM_LEAVE.exitReducedMs).toBeLessThan(UNIVERSE_CONFIRM_LEAVE.exitMs);
    expect(UNIVERSE_CONFIRM_LEAVE.veilMs).toBeLessThanOrEqual(UNIVERSE_CONFIRM_LEAVE.exitMs);
    expect(UNIVERSE_CONFIRM_LEAVE.pushExitMs).toBeLessThanOrEqual(280);
  });

  it('borne pushExit pour un démontage rapide (pas de voile noir collé)', () => {
    expect(UNIVERSE_CONFIRM_LEAVE.pushExitMs).toBeGreaterThanOrEqual(120);
    expect(UNIVERSE_CONFIRM_LEAVE.pushExitMs + 120).toBeLessThan(500);
  });

  it('orchestre Bienvenue / Au revoir en phases fluides sans cut noir', () => {
    expect(BRAND_SESSION_COPY.welcome).toBe('Bienvenue dans cette nouvelle expérience');
    expect(BRAND_SESSION_COPY.goodbye).toBe('Au revoir');
    expect(BRAND_SESSION_REVEAL.logoInMs).toBeGreaterThanOrEqual(400);
    expect(BRAND_SESSION_REVEAL.logoInMs).toBeLessThanOrEqual(700);
    expect(BRAND_SESSION_REVEAL.messageDelayMs).toBeLessThan(BRAND_SESSION_REVEAL.logoInMs);
    expect(BRAND_SESSION_REVEAL.messageInMs).toBeGreaterThanOrEqual(300);
    expect(BRAND_SESSION_REVEAL.holdMs).toBeGreaterThanOrEqual(500);
    expect(BRAND_SESSION_REVEAL.exitMs).toBeGreaterThanOrEqual(300);
    expect(BRAND_SESSION_REVEAL.exitMs).toBeLessThanOrEqual(520);
    expect(BRAND_SESSION_REVEAL.exitFloor).toBeGreaterThan(0);
    expect(BRAND_SESSION_REVEAL.exitFloor).toBeLessThan(0.2);
    expect(BRAND_SESSION_REVEAL.logoScaleFrom).toBeLessThan(1);
    expect(BRAND_SESSION_REVEAL.messageRisePx).toBeGreaterThan(0);

    const full = brandSessionTotalMs(false);
    const reduced = brandSessionTotalMs(true);
    expect(full).toBe(
      BRAND_SESSION_REVEAL.messageDelayMs +
        BRAND_SESSION_REVEAL.messageInMs +
        BRAND_SESSION_REVEAL.holdMs +
        BRAND_SESSION_REVEAL.exitMs,
    );
    expect(reduced).toBeLessThan(full);
    expect(reduced).toBe(
      BRAND_SESSION_REVEAL.holdReducedMs + BRAND_SESSION_REVEAL.exitReducedMs,
    );
    expect(full).toBeGreaterThanOrEqual(1500);
    expect(full).toBeLessThanOrEqual(2500);
    expect(brandWelcomeTotalMs(false)).toBe(full);
    expect(BRAND_WELCOME_REVEAL.welcomeDelayMs).toBe(BRAND_SESSION_REVEAL.messageDelayMs);
  });
});
