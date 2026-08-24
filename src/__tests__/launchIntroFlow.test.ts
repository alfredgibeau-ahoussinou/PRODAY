import {
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
});
