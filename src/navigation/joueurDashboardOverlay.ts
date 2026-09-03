import type { UserRole } from '../models/User';
import type { DashboardDeepLink } from '../utils/navigationDeepLink';

/** Deep links joueur affichés en overlay (chat IA, train, coach humain). */
export const JOUEUR_DASHBOARD_OVERLAY_VIEWS = [
  'train',
  'train_ai',
  'train_coach',
  'tactics_coach',
] as const;

export type JoueurDashboardOverlayView = (typeof JOUEUR_DASHBOARD_OVERLAY_VIEWS)[number];

export function isJoueurDashboardOverlayView(
  view: DashboardDeepLink | null | undefined,
): view is JoueurDashboardOverlayView {
  return (
    view === 'train' ||
    view === 'train_ai' ||
    view === 'train_coach' ||
    view === 'tactics_coach'
  );
}

/**
 * Pôle joueur : ces vues s’ouvrent en overlay global.
 * Ne pas `setActiveTab('home')` — sinon Accueil keep-alive avale le pending
 * et l’utilisateur retombe sur le hub sans écran.
 */
export function shouldStayOnTabForDashboard(
  view: DashboardDeepLink,
  role?: UserRole | null,
): boolean {
  return role === 'player' && isJoueurDashboardOverlayView(view);
}

export function trainHubViewForDashboard(
  view: JoueurDashboardOverlayView,
): 'hub' | 'ai' | 'coach' {
  if (view === 'train_ai') return 'ai';
  if (view === 'train_coach') return 'coach';
  return 'hub';
}
