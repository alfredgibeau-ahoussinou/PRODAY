/**
 * Historique auth cohérent — une seule surface visible, pas de pages fantômes.
 * gate = Créer un compte / Se connecter
 */
export type AuthSurface = 'gate' | 'login' | 'signup' | 'forgot' | 'legal';

export type AuthBackAction =
  | 'close-legal'
  | 'close-forgot'
  | 'close-signup-to-gate'
  | 'close-signup-to-login'
  | 'to-gate'
  | 'dismiss';

/**
 * Retour depuis l’écran courant.
 * Login (venu du gate) → gate ; gate → dismiss (univers / home).
 */
export function resolveAuthBackAction(opts: {
  surface: AuthSurface;
  /** Entrée via intent signup (choix créer/connecter). */
  enteredViaGate: boolean;
}): AuthBackAction {
  switch (opts.surface) {
    case 'legal':
      return 'close-legal';
    case 'forgot':
      return 'close-forgot';
    case 'signup':
      return opts.enteredViaGate ? 'close-signup-to-gate' : 'close-signup-to-login';
    case 'login':
      return opts.enteredViaGate ? 'to-gate' : 'dismiss';
    case 'gate':
    default:
      return 'dismiss';
  }
}

export function resolveAuthSurface(opts: {
  signupOpen: boolean;
  showForgotPassword: boolean;
  legalDocument: boolean;
  mode: 'login' | 'signupTeaser';
}): AuthSurface {
  if (opts.legalDocument) return 'legal';
  if (opts.showForgotPassword) return 'forgot';
  if (opts.signupOpen) return 'signup';
  if (opts.mode === 'signupTeaser') return 'gate';
  return 'login';
}
