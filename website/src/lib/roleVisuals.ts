/**
 * Unique cinematic media per marketing rôle / page.
 * One full-bleed photo per major band. Never reuse a path across packs.
 */

export type RoleVisualId =
  | "joueur"
  | "supporter"
  | "sante"
  | "pro_club"
  | "coach"
  | "pro_staff"
  | "evenements"
  | "sponsor"
  | "fonctionnalites"
  | "tarifs"
  | "faq"
  | "demo"
  | "beta"
  | "parent"
  | "confiance";

export type RoleVisualPack = {
  id: RoleVisualId;
  label: string;
  hero: string;
  /** Optional full-bleed hero video (poster = hero). */
  heroVideo?: string;
  story: string;
  platform: string;
  accentKicker?: string;
  accentTitle?: string;
  /** Show WebGL accent band on product pages only */
  showAccent3d?: boolean;
};

export const ROLE_VISUALS: Record<RoleVisualId, RoleVisualPack> = {
  joueur: {
    id: "joueur",
    label: "Joueur",
    hero: "/images/football-pro-01.jpg",
    heroVideo: "/videos/pole-joueur.mp4",
    story: "/images/football-action-01.jpg",
    platform: "/images/football-mercato-01.jpg",
    accentKicker: "Joueur",
    accentTitle: "Ton match commence ici.",
    showAccent3d: true,
  },
  supporter: {
    id: "supporter",
    label: "Supporter",
    hero: "/images/football-supporter-01.jpg",
    heroVideo: "/videos/pole-supporter.mp4",
    story: "/images/football-fans-01.jpg",
    platform: "/images/football-crowd-01.jpg",
    accentKicker: "Supporter",
    accentTitle: "La tribune, dans ta poche.",
    showAccent3d: true,
  },
  sante: {
    id: "sante",
    label: "Santé",
    hero: "/images/football-physio-01.jpg",
    heroVideo: "/videos/pole-sante.mp4",
    story: "/images/football-training-01.jpg",
    platform: "/images/football-health-01.jpg",
    accentKicker: "Santé",
    accentTitle: "Soigner près du terrain.",
    showAccent3d: true,
  },
  pro_club: {
    id: "pro_club",
    label: "Club",
    hero: "/images/football-club-01.jpg",
    heroVideo: "/videos/pole-club.mp4",
    story: "/images/football-stadium-night-01.jpg",
    platform: "/images/football-trophy-01.jpg",
    accentKicker: "Club",
    accentTitle: "La structure, au clair.",
    showAccent3d: true,
  },
  coach: {
    id: "coach",
    label: "Coach",
    hero: "/images/football-coach-01.jpg",
    heroVideo: "/videos/pole-staff.mp4",
    story: "/images/football-tactics-01.jpg",
    platform: "/images/football-scout-01.jpg",
    accentKicker: "Coach",
    accentTitle: "Composer. Décider. Gagner.",
    showAccent3d: true,
  },
  pro_staff: {
    id: "pro_staff",
    label: "Coach",
    hero: "/images/football-coach-01.jpg",
    heroVideo: "/videos/pole-staff.mp4",
    story: "/images/football-tactics-01.jpg",
    platform: "/images/football-scout-01.jpg",
    accentKicker: "Coach",
    accentTitle: "Composer. Décider. Gagner.",
    showAccent3d: true,
  },
  evenements: {
    id: "evenements",
    label: "Club",
    hero: "/showcase/classic-arena.jpg",
    heroVideo: "/videos/pole-evenements.mp4",
    story: "/showcase/classic-exp-arena.jpg",
    platform: "/images/football-team-01.jpg",
    accentKicker: "Organisateur",
    accentTitle: "Le jour J, sans friction.",
    showAccent3d: true,
  },
  sponsor: {
    id: "sponsor",
    label: "Sponsor",
    hero: "/showcase/classic-exp-sponsors.jpg",
    heroVideo: "/videos/pole-sponsor.mp4",
    story: "/images/football-handshake-01.jpg",
    platform: "/images/football-pitch-01.jpg",
    accentKicker: "Sponsor",
    accentTitle: "Visibilité mesurée.",
    showAccent3d: true,
  },
  fonctionnalites: {
    id: "fonctionnalites",
    label: "Fonctionnalités",
    hero: "/images/football-action-01.jpg",
    heroVideo: "/videos/hero-match.mp4",
    story: "/images/football-team-01.jpg",
    platform: "/images/football-tactics-01.jpg",
    accentKicker: "Produit",
    accentTitle: "Cinq portes. Un terrain.",
    showAccent3d: true,
  },
  tarifs: {
    id: "tarifs",
    label: "Tarifs",
    hero: "/showcase/classic-exp-messages.jpg",
    heroVideo: "/videos/hero-stadium.mp4",
    story: "/images/football-contract-01.jpg",
    platform: "/images/football-boots-01.jpg",
    accentKicker: "Tarifs",
    accentTitle: "Un prix. Un pôle.",
    showAccent3d: true,
  },
  faq: {
    id: "faq",
    label: "FAQ",
    hero: "/images/football-boots-01.jpg",
    heroVideo: "/videos/hero-stadium.mp4",
    story: "/images/football-contract-01.jpg",
    platform: "/images/football-pitch-01.jpg",
    accentKicker: "FAQ",
    accentTitle: "Avant d’entrer dans le système.",
    showAccent3d: false,
  },
  demo: {
    id: "demo",
    label: "Démo",
    hero: "/images/football-match-01.jpg",
    heroVideo: "/videos/pole-joueur.mp4",
    story: "/images/football-women-01.jpg",
    platform: "/images/football-amateur-01.jpg",
    accentKicker: "Démo",
    accentTitle: "Touche l’app avant de t’inscrire.",
    showAccent3d: true,
  },
  beta: {
    id: "beta",
    label: "Bêta",
    hero: "/images/football-match-01.jpg",
    heroVideo: "/videos/pole-beta.mp4",
    story: "/showcase/woman/woman-discover-hero.jpg",
    platform: "/showcase/woman/woman-match.jpg",
    accentKicker: "Bêta",
    accentTitle: "Ta clé d’accès ProDay.",
    showAccent3d: true,
  },
  parent: {
    id: "parent",
    label: "Parent",
    hero: "/images/football-family-01.jpg",
    heroVideo: "/videos/pole-parent.mp4",
    story: "/showcase/woman/woman-exp-team.jpg",
    platform: "/showcase/woman/woman-profile.jpg",
    accentKicker: "Parent",
    accentTitle: "Cadre. Confiance. Sérénité.",
    showAccent3d: true,
  },
  confiance: {
    id: "confiance",
    label: "Confiance",
    hero: "/showcase/classic-staff.jpg",
    heroVideo: "/videos/pole-confiance.mp4",
    story: "/showcase/classic-mercato.jpg",
    platform: "/showcase/woman/woman-staff.jpg",
    accentKicker: "Confiance",
    accentTitle: "Vérifié. Traçable. Clair.",
    showAccent3d: true,
  },
};

export function getRoleVisuals(id: RoleVisualId): RoleVisualPack {
  return ROLE_VISUALS[id];
}

export function visualIdForUniverse(
  universe: string,
): RoleVisualId | undefined {
  switch (universe) {
    case "supporter":
      return "supporter";
    case "pro_club":
      return "pro_club";
    case "pro_staff":
    case "coach":
      return "coach";
    case "homme":
    case "woman":
    case "amateur":
    case "pro_joueur":
    case "pro":
      return "joueur";
    default:
      return undefined;
  }
}
