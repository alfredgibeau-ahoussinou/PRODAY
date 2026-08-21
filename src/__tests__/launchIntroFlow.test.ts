import {
  resolveIntroExitAction,
  shouldSkipPoleTransition,
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
});
