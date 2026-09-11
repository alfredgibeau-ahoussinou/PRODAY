import type { CarouselPoleId } from '../models/CarouselPole';
import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';

/** Textes du bloc auth (écran login + gate créer/se connecter) pour le pôle actif. */
export type UniverseAuthCopy = {
  kicker: string;
  title: string;
  sub: string;
  cta: string;
  gateTitle: string;
  gateSub: string;
};

export type UniverseAuthCopyOpts = {
  /**
   * Entrée admin EXPLICITE (tuile VIP de l'univers) — verrouille la connexion seule.
   * Ne JAMAIS la déduire d'un email mémorisé, d'un claim ou d'un rôle : sinon
   * « Espace Administrateur » fuit sur tous les pôles et « Créer un compte »
   * devient silencieusement inopérant (régression introduite par dcb9e59a).
   */
  isAdminAuth: boolean;
  productLine: ProductLineId;
  signupInitialRole?: UserRole | null;
  initialPole?: CarouselPoleId | null;
};

/**
 * Libellés « Espace … » strictement liés au pôle actif :
 * Joueur → Espace Joueur · Coach → Espace Coach · Club/Président → Espace Club
 * Parent → Espace Parent · Supporter → Espace Supporter · Sponsor → inchangé.
 * « Espace Administrateur » n'apparaît QUE pour l'entrée admin explicite.
 */
export function resolveUniverseAuthCopy(opts: UniverseAuthCopyOpts): UniverseAuthCopy {
  if (opts.isAdminAuth) {
    return {
      kicker: 'ACCÈS FONDATION VIP',
      title: 'Connexion Admin',
      sub: 'Réservé aux fondateurs et administrateurs autorisés.',
      cta: 'Se connecter',
      gateTitle: 'Espace Administrateur',
      gateSub: 'Accès réservé à l’équipe fondatrice.',
    };
  }

  if (
    opts.productLine === 'pro_staff' ||
    opts.signupInitialRole === 'coach' ||
    opts.initialPole === 'coach'
  ) {
    return {
      kicker: 'PÔLE COACH',
      title: 'Espace Coach',
      sub: 'Séances, tactiques et convocations — en un accès.',
      cta: 'Se connecter',
      gateTitle: 'Espace Coach',
      gateSub: 'Créez votre espace staff, ou connectez-vous.',
    };
  }

  if (
    opts.productLine === 'pro_club' ||
    opts.signupInitialRole === 'club' ||
    opts.initialPole === 'pro_club' ||
    opts.initialPole === 'president'
  ) {
    return {
      kicker: 'PÔLE CLUB',
      title: 'Espace Club',
      sub: 'Effectifs, matchs et adhésions — votre structure.',
      cta: 'Se connecter',
      gateTitle: 'Espace Club',
      gateSub: 'Retrouvez votre club FFF à l’inscription, ou connectez-vous.',
    };
  }

  if (
    opts.productLine === 'parent' ||
    opts.signupInitialRole === 'parent' ||
    opts.initialPole === 'parent'
  ) {
    return {
      kicker: 'ESPACE FAMILLE',
      title: 'Espace Parent',
      sub: 'Suivi enfant et covoiturage club.',
      cta: 'Se connecter',
      gateTitle: 'Espace Parent',
      gateSub: 'Créez un compte parent, ou reconnectez-vous.',
    };
  }

  if (
    opts.productLine === 'sponsor' ||
    opts.signupInitialRole === 'sponsor' ||
    opts.initialPole === 'sponsor'
  ) {
    return {
      kicker: 'PARTENAIRES',
      title: 'Connexion Partenaire',
      sub: 'Campagnes et visibilité locale.',
      cta: 'Se connecter',
      gateTitle: 'Espace Partenaire',
      gateSub: 'Créez votre espace marque, ou reconnectez-vous.',
    };
  }

  if (
    opts.productLine === 'supporter' ||
    opts.signupInitialRole === 'supporter' ||
    opts.initialPole === 'supporter'
  ) {
    return {
      kicker: 'TRIBUNE',
      title: 'Espace Supporter',
      sub: 'Matchs en direct et votes MVP.',
      cta: 'Se connecter',
      gateTitle: 'Espace Supporter',
      gateSub: 'Créez un compte, ou reconnectez-vous.',
    };
  }

  return {
    kicker: 'PÔLE JOUEUR',
    title: 'Espace Joueur',
    sub: 'Stats, matchs et CV sportif — votre cockpit.',
    cta: 'Se connecter',
    gateTitle: 'Espace Joueur',
    gateSub: 'Créez votre compte, ou reconnectez-vous à ProDay.',
  };
}
