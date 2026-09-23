import { isPlatformAdminEmail } from '../config/admin';
import type { UserRole } from '../models/User';

/**
 * Périmètre autorisé de la **recherche de personnes** (CA-12 / SEARCH-01).
 *
 * Règle par défaut : on ne cherche que dans **son club**. Deux exceptions
 * documentées existent, toutes deux produits du métier :
 *
 * - l'administration plateforme (claim `admin` ou email opérateur) ;
 * - les rôles de découverte professionnelle (`agent`, `recruiter`), dont la
 *   mission est de repérer des joueurs hors de leur club — les coordonnées
 *   restent gouvernées par `contactPrivacyVisibility`, pas par la recherche.
 *
 * Aucun périmètre résolvable ⇒ `mode: 'none'` : la recherche ne renvoie
 * **rien** plutôt que de retomber sur l'annuaire global. C'est le point
 * essentiel : une erreur de câblage produit une absence de résultat, jamais une
 * fuite inter-clubs.
 */
export type PlayerSearchScopeMode = 'global' | 'club' | 'none';

export type PlayerSearchScope = {
  mode: PlayerSearchScopeMode;
  /** UID du lecteur — jamais une autre personne. */
  viewerUid: string | null;
  /** Club autorisé pour le mode `club`. */
  clubId: string | null;
  /** Raison courte et lisible, utile au diagnostic et aux tests. */
  reason:
    | 'no-viewer'
    | 'platform-admin'
    | 'cross-club-role'
    | 'same-club'
    | 'no-club';
};

/** Rôles dont la mission est la découverte inter-clubs. */
export const CROSS_CLUB_SEARCH_ROLES: readonly UserRole[] = ['agent', 'recruiter'];

export type PlayerSearchScopeInput = {
  viewerUid?: string | null;
  role?: UserRole | null;
  email?: string | null;
  isPlatformAdmin?: boolean;
  /** Club du lecteur : espace club courant ou `profile.club_id`. */
  clubId?: string | null;
};

export function resolvePlayerSearchScope(input: PlayerSearchScopeInput): PlayerSearchScope {
  const viewerUid = input.viewerUid ?? null;
  if (!viewerUid) {
    return { mode: 'none', viewerUid: null, clubId: null, reason: 'no-viewer' };
  }

  const isAdmin =
    input.isPlatformAdmin === true || isPlatformAdminEmail(input.email ?? null);
  if (isAdmin) {
    return { mode: 'global', viewerUid, clubId: null, reason: 'platform-admin' };
  }

  if (input.role && CROSS_CLUB_SEARCH_ROLES.includes(input.role)) {
    return { mode: 'global', viewerUid, clubId: null, reason: 'cross-club-role' };
  }

  const clubId = input.clubId ?? null;
  if (clubId) {
    return { mode: 'club', viewerUid, clubId, reason: 'same-club' };
  }

  return { mode: 'none', viewerUid, clubId: null, reason: 'no-club' };
}

/** Indique si le périmètre autorise une lecture au-delà du club du lecteur. */
export function scopeAllowsCrossClub(scope: PlayerSearchScope): boolean {
  return scope.mode === 'global';
}
