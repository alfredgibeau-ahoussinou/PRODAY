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
 * Ne pas `setActiveTab('home')` pour ces deep links : le shell / overlay
 * consomme `pendingDashboardView` sur l’onglet courant.
 * Sinon Accueil keep-alive (joueur) ou sync tab Club (Pack Club) avale la nav.
 */
export function shouldStayOnTabForDashboard(
  view: DashboardDeepLink,
  role?: UserRole | null,
): boolean {
  if (role === 'player') return isJoueurDashboardOverlayView(view);
  if (role === 'coach') return view === 'gestion' || view === 'smart_tactics';
  if (role === 'club') {
    return view === 'gestion' || view === 'sponsors' || view === 'smart_tactics';
  }
  return false;
}

export function trainHubViewForDashboard(
  view: JoueurDashboardOverlayView,
): 'hub' | 'ai' | 'coach' {
  if (view === 'train_ai') return 'ai';
  if (view === 'train_coach') return 'coach';
  return 'hub';
}
