import {
  brandWelcomeTotalMs,
  BRAND_WELCOME_REVEAL,
  resolveIntroExitAction,
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

  it('orchestre Bienvenue en phases fluides sans cut noir', () => {
    expect(BRAND_WELCOME_REVEAL.logoInMs).toBeGreaterThanOrEqual(400);
    expect(BRAND_WELCOME_REVEAL.logoInMs).toBeLessThanOrEqual(700);
    expect(BRAND_WELCOME_REVEAL.welcomeDelayMs).toBeLessThan(BRAND_WELCOME_REVEAL.logoInMs);
    expect(BRAND_WELCOME_REVEAL.welcomeInMs).toBeGreaterThanOrEqual(300);
    expect(BRAND_WELCOME_REVEAL.holdMs).toBeGreaterThanOrEqual(500);
    expect(BRAND_WELCOME_REVEAL.exitMs).toBeGreaterThanOrEqual(300);
    expect(BRAND_WELCOME_REVEAL.exitMs).toBeLessThanOrEqual(520);
    expect(BRAND_WELCOME_REVEAL.exitFloor).toBeGreaterThan(0);
    expect(BRAND_WELCOME_REVEAL.exitFloor).toBeLessThan(0.2);
    expect(BRAND_WELCOME_REVEAL.logoScaleFrom).toBeLessThan(1);
    expect(BRAND_WELCOME_REVEAL.welcomeRisePx).toBeGreaterThan(0);

    const full = brandWelcomeTotalMs(false);
    const reduced = brandWelcomeTotalMs(true);
    expect(full).toBe(
      BRAND_WELCOME_REVEAL.welcomeDelayMs +
        BRAND_WELCOME_REVEAL.welcomeInMs +
        BRAND_WELCOME_REVEAL.holdMs +
        BRAND_WELCOME_REVEAL.exitMs,
    );
    expect(reduced).toBeLessThan(full);
    expect(reduced).toBe(
      BRAND_WELCOME_REVEAL.holdReducedMs + BRAND_WELCOME_REVEAL.exitReducedMs,
    );
    expect(full).toBeLessThan(3200);
  });
});
