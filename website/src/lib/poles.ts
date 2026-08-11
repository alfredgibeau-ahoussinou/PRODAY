import {
  getWebPlanById,
  plansForUniverse,
  SPONSOR_PRICING_TIERS,
  type ProductLineWeb,
  type WebSubscriptionPlan,
  type WebSubscriptionPlanBase,
} from "./content";
import { ROUTES } from "./routes";

/**
 * Pôles marketing site : architecture cible.
 * Vitrine : Joueur · Club · Coach · Parent · Supporter · Sponsor.
 * Santé / Agent / Recruteur / Organisateur = rôles intégrés (pas des pôles).
 */
export type PoleId =
  | "joueur"
  | "supporter"
  | "sante"
  | "pro_club"
  | "coach"
  | "parent"
  | "sponsor"
  /** @deprecated → coach */
  | "pro_staff"
  /** @deprecated → pro_club */
  | "evenements"
  /** @deprecated → joueur */
  | "amateur"
  /** @deprecated → joueur */
  | "pro_joueur";

export type PoleDefinition = {
  id: PoleId;
  kicker: string;
  /** Short menu label (Joueur, Coach…). */
  navLabel: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  pricingHash: string;
  logo: string;
  planIds: WebSubscriptionPlanBase["id"][];
};

/** Vitrine GTM : 5 pôles principaux. */
export const CAROUSEL_POLES: PoleDefinition[] = [
  {
    id: "joueur",
    kicker: "ESPACE JOUEUR",
    navLabel: "Joueur",
    title: "Progresser chaque jour",
    subtitle: "Ma forme · Stats · Entraînement",
    description:
      "Analyse de forme personnelle, carte joueur, stats, convocations et covoiturage. Pass optionnel 3,99 € : programmes, vidéo et contenu avancé.",
    href: ROUTES.joueur,
    pricingHash: "joueur",
    logo: "/branding/logo-man-picto.png",
    planIds: ["player_plus"],
  },
  {
    id: "pro_club",
    kicker: "ESPACE CLUB",
    navLabel: "Club",
    title: "Le cœur de ProDay",
    subtitle: "Équipes · Forme · Président",
    description:
      "Équipes, analyse de forme, licenciés, coachs, dirigeants, invitations, tournois et covoiturage. À partir de 3 € / adhérent (sur devis). Caméra en option.",
    href: ROUTES.proClub,
    pricingHash: "pro_club",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["club_amateur", "club_pro", "club_premium", "club_video_pro"],
  },
  {
    id: "coach",
    kicker: "ESPACE COACH",
    navLabel: "Coach",
    title: "Banc de touche digital",
    subtitle: "Analyse de forme · Tactique · Matchs",
    description:
      "Analyse de forme de l’effectif, entraînements, Tactique IA, IA, vidéo et convocations. Séances individuelles à l’heure.",
    href: ROUTES.coach,
    pricingHash: "coach",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["coach_pro"],
  },
  {
    id: "parent",
    kicker: "PÔLE PARENT",
    navLabel: "Parent",
    title: "Accompagner sans étouffer",
    subtitle: "Supervision · Messages · Agenda",
    description:
      "Espace dédié aux parents : messages, agenda, retards coach, temps d’écran et trajets — lié au compte joueur de l’enfant.",
    href: ROUTES.parent,
    pricingHash: "parent",
    logo: "/branding/logo-sante-picto.png",
    planIds: [],
  },
  {
    id: "supporter",
    kicker: "PÔLE SUPPORTER",
    navLabel: "Supporter",
    title: "Fans & communauté",
    subtitle: "Direct · Clubs suivis · Débats",
    description:
      "Tribune 100 % gratuite. Scores live, suivis illimités, débats et moments.",
    href: ROUTES.supporter,
    pricingHash: "supporter",
    logo: "/branding/logo-supporter-picto.png",
    planIds: [],
  },
];

export const SPONSOR_POLE: PoleDefinition = {
  id: "sponsor",
  kicker: "PÔLE SPONSOR",
  navLabel: "Sponsor",
  title: "Marques & sponsors",
  subtitle: "Visibilité · Contact local · Terrain",
  description:
    "Campagnes ciblées auprès de clubs et joueurs actifs. KPIs lisibles. Vitrine vérifiée.",
  href: ROUTES.sponsor,
  pricingHash: "sponsor",
  logo: "/branding/logo-sponsor-picto.png",
  planIds: ["sponsor_pro"],
};

/** @deprecated Rôle Santé retiré de la vitrine — /sante redirige vers /joueur. */
export const SANTE_POLE: PoleDefinition = {
  id: "sante",
  kicker: "RÉSERVÉ",
  navLabel: "Santé",
  title: "Praticiens & staff médical",
  subtitle: "Retiré de la vitrine",
  description:
    "Le rôle Santé n’est plus proposé comme espace public ProDay.",
  href: ROUTES.joueur,
  pricingHash: "joueur",
  logo: "/branding/logo-sante-picto.png",
  planIds: [],
};

/** @deprecated Conservé pour redirections / liens legacy. */
export const LEGACY_STAFF_POLE: PoleDefinition = {
  id: "pro_staff",
  kicker: "PÔLE COACH",
  navLabel: "Coach",
  title: "Banc de touche digital",
  subtitle: "Tactique IA · IA · Effectif",
  description: "Redirigé vers le Pôle Coach.",
  href: ROUTES.coach,
  pricingHash: "coach",
  logo: "/branding/logo-pro-picto.png",
  planIds: ["coach_pro", "recruiter_pro", "agent_elite"],
};

/** @deprecated Organisateur = rôle intégré au Club. */
export const LEGACY_EVENEMENTS_POLE: PoleDefinition = {
  id: "evenements",
  kicker: "RÔLE ORGANISATEUR",
  navLabel: "Organisateur",
  title: "Tournois & détections",
  subtitle: "Rôle intégré au Club",
  description:
    "Tournois, détections et stages : rôle organisateur, plus un pôle indépendant.",
  href: ROUTES.proClub,
  pricingHash: "pro_club",
  logo: "/branding/logo-pro-picto.png",
  planIds: ["organizer_pro"],
};

/** Pôles vitrine (carousel + Sponsor). */
export const SHOWCASE_POLES: PoleDefinition[] = [...CAROUSEL_POLES, SPONSOR_POLE];

/** Tous les pôles produit (vitrine + legacy aliases). Santé retiré de la vitrine. */
export const POLES: PoleDefinition[] = [
  ...SHOWCASE_POLES,
  LEGACY_STAFF_POLE,
  LEGACY_EVENEMENTS_POLE,
];

export function normalizePoleId(id: string): PoleId | null {
  if (id === "amateur" || id === "pro_joueur" || id === "pro" || id === "joueur") {
    return "joueur";
  }
  if (id === "pro_staff" || id === "coach") return "coach";
  if (id === "evenements") return "pro_club";
  if (POLES.some((p) => p.id === id)) return id as PoleId;
  return null;
}

export const POLE_NAV_POLE_IDS: Record<string, PoleId> = {
  [ROUTES.amateur]: "joueur",
  [ROUTES.joueur]: "joueur",
  [ROUTES.supporter]: "supporter",
  [ROUTES.sante]: "sante",
  [ROUTES.parent]: "parent",
  [ROUTES.proJoueur]: "joueur",
  [ROUTES.proClub]: "pro_club",
  [ROUTES.coach]: "coach",
  [ROUTES.proStaff]: "coach",
  [ROUTES.evenements]: "pro_club",
  [ROUTES.sponsor]: "sponsor",
  [ROUTES.partenaires]: "sponsor",
};

/** Rayures nav. Hex logos officiels. */
export const POLE_NAV_STRIPE: Record<PoleId, string> = {
  joueur: "bg-[#0054F0]",
  amateur: "bg-[#0054F0]",
  supporter: "bg-[#3C00F0]",
  sante: "bg-[#00CCB4]",
  parent: "bg-[#0F766E]",
  pro_joueur: "bg-[#0054F0]",
  pro_club: "bg-[#006CFC]",
  coach: "bg-[#3B5BFF]",
  pro_staff: "bg-[#3B5BFF]",
  evenements: "bg-[#006CFC]",
  sponsor: "bg-[#D4AF37]",
};

/** Hex logo. Usage JS (hero, inline styles). */
export const POLE_BRAND_HEX: Record<PoleId, string> = {
  joueur: "#0054F0",
  amateur: "#0054F0",
  supporter: "#3C00F0",
  sante: "#00CCB4",
  parent: "#0F766E",
  pro_joueur: "#0054F0",
  pro_club: "#006CFC",
  coach: "#3B5BFF",
  pro_staff: "#3B5BFF",
  evenements: "#006CFC",
  sponsor: "#D4AF37",
};

const JOUEUR_STYLES = {
  nav: "text-white/70 hover:text-[#0054F0]",
  navActive: "bg-[#0054F0] text-white",
  section: "bg-black text-white",
  surface: "bg-black text-white",
  accentTop: "border-t border-white/10",
  card: "border border-white/10 bg-white/[0.03]",
  cardHighlight: "ring-1 ring-[#0054F0]/40 border-[#0054F0]/30",
  badge: "bg-[#0054F0]/12 text-[#0054F0]",
  textMuted: "text-white/55",
  cta: "bg-[#0054F0] text-white hover:brightness-110",
} as const;

export const POLE_STYLES: Record<
  PoleId,
  {
    nav: string;
    navActive: string;
    section: string;
    surface: string;
    accentTop: string;
    card: string;
    cardHighlight: string;
    badge: string;
    textMuted: string;
    cta: string;
  }
> = {
  joueur: JOUEUR_STYLES,
  amateur: JOUEUR_STYLES,
  pro_joueur: JOUEUR_STYLES,
  supporter: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#3C00F0]",
    navActive: "bg-[#3C00F0] text-white",
    cardHighlight: "ring-1 ring-[#3C00F0]/40 border-[#3C00F0]/30",
    badge: "bg-[#3C00F0]/12 text-[#3C00F0]",
    cta: "bg-[#3C00F0] text-white hover:brightness-110",
  },
  sante: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#00CCB4]",
    navActive: "bg-[#00CCB4] text-black",
    cardHighlight: "ring-1 ring-[#00CCB4]/40 border-[#00CCB4]/30",
    badge: "bg-[#00CCB4]/12 text-[#00CCB4]",
    cta: "bg-[#00CCB4] text-black hover:brightness-110",
  },
  parent: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#14B8A6]",
    navActive: "bg-[#0F766E] text-white",
    cardHighlight: "ring-1 ring-[#14B8A6]/40 border-[#14B8A6]/30",
    badge: "bg-[#0F766E]/12 text-[#14B8A6]",
    cta: "bg-[#0F766E] text-white hover:brightness-110",
  },
  pro_club: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#006CFC]",
    navActive: "bg-[#006CFC] text-white",
    cardHighlight: "ring-1 ring-[#006CFC]/40 border-[#006CFC]/30",
    badge: "bg-[#006CFC]/12 text-[#006CFC]",
    cta: "bg-[#006CFC] text-white hover:brightness-110",
  },
  coach: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#3B5BFF]",
    navActive: "bg-[#3B5BFF] text-white",
    cardHighlight: "ring-1 ring-[#3B5BFF]/40 border-[#3B5BFF]/30",
    badge: "bg-[#3B5BFF]/12 text-[#3B5BFF]",
    cta: "bg-[#3B5BFF] text-white hover:brightness-110",
  },
  pro_staff: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#3B5BFF]",
    navActive: "bg-[#3B5BFF] text-white",
    cardHighlight: "ring-1 ring-[#3B5BFF]/40 border-[#3B5BFF]/30",
    badge: "bg-[#3B5BFF]/12 text-[#3B5BFF]",
    cta: "bg-[#3B5BFF] text-white hover:brightness-110",
  },
  evenements: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#006CFC]",
    navActive: "bg-[#006CFC] text-white",
    cardHighlight: "ring-1 ring-[#006CFC]/40 border-[#006CFC]/30",
    badge: "bg-[#006CFC]/12 text-[#006CFC]",
    cta: "bg-[#006CFC] text-white hover:brightness-110",
  },
  sponsor: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#D4AF37]",
    navActive: "bg-[#D4AF37] text-black",
    cardHighlight: "ring-1 ring-[#D4AF37]/40 border-[#D4AF37]/30",
    badge: "bg-[#D4AF37]/12 text-[#D4AF37]",
    cta: "bg-[#D4AF37] text-black hover:brightness-110",
  },
};

export type PoleStyle = (typeof POLE_STYLES)[PoleId];

export const POLE_IMAGES: Record<PoleId, string> = {
  joueur: "/images/football-pro-01.jpg",
  amateur: "/images/football-amateur-01.jpg",
  supporter: "/images/football-supporter-01.jpg",
  sante: "/images/football-health-01.jpg",
  parent: "/images/football-team-01.jpg",
  pro_joueur: "/images/football-pro-01.jpg",
  pro_club: "/images/football-club-01.jpg",
  coach: "/showcase/classic-staff.jpg",
  pro_staff: "/showcase/classic-staff.jpg",
  evenements: "/showcase/classic-arena.jpg",
  sponsor: "/showcase/classic-exp-sponsors.jpg",
};

export function plansForPole(poleId: PoleId): WebSubscriptionPlan[] {
  const resolved = normalizePoleId(poleId) ?? poleId;
  const pole = POLES.find((p) => p.id === resolved) ?? POLES.find((p) => p.id === poleId);
  if (!pole) return [];

  if (resolved === "joueur") {
    return plansForUniverse("amateur");
  }

  if (resolved === "supporter") {
    return plansForUniverse("supporter");
  }

  return pole.planIds
    .map((id) => getWebPlanById(id))
    .filter((p): p is WebSubscriptionPlan => p != null);
}

export function poleById(id: PoleId): PoleDefinition {
  const resolved = normalizePoleId(id) ?? id;
  const pole = POLES.find((p) => p.id === resolved) ?? POLES.find((p) => p.id === id);
  if (!pole) throw new Error(`Pôle inconnu : ${id}`);
  return pole;
}

/** Lien vers une section précise d'une page pôle (ex. #modules). */
export function poleSectionHref(
  pole: Pick<PoleDefinition, "href">,
  section = "modules",
): string {
  return `${pole.href}#${section}`;
}

/** Lien tarifs avec ancre pôle (ex. /tarifs#joueur). */
export function pricingHrefForPole(poleId: PoleId): string {
  const resolved = normalizePoleId(poleId) ?? poleId;
  return `${ROUTES.pricing}#${resolved}`;
}

const PATH_TO_PRICING_POLE: Record<string, PoleId> = {
  ...POLE_NAV_POLE_IDS,
  [ROUTES.homme]: "joueur",
  [ROUTES.woman]: "joueur",
  [ROUTES.pro]: "coach",
};

/** Tarifs contextualisés depuis la page courante (nav, footer). */
export function pricingHrefForPath(pathname: string): string {
  const base = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  const poleId = PATH_TO_PRICING_POLE[base];
  return poleId ? pricingHrefForPole(poleId) : ROUTES.pricing;
}

const UNIVERSE_TO_POLE: Record<string, PoleId> = {
  homme: "joueur",
  woman: "joueur",
  amateur: "joueur",
  joueur: "joueur",
  supporter: "supporter",
  parent: "parent",
  pro: "coach",
  pro_joueur: "joueur",
  pro_club: "pro_club",
  coach: "coach",
  pro_staff: "coach",
  evenements: "pro_club",
};

/** Tarifs depuis une page univers / pôle (UniversePage). */
export function pricingHrefForUniverse(universe: string): string {
  const poleId = UNIVERSE_TO_POLE[universe];
  return poleId ? pricingHrefForPole(poleId) : ROUTES.pricing;
}

const PRODUCT_LINE_TO_POLE: Record<ProductLineWeb, PoleId> = {
  homme: "joueur",
  woman: "joueur",
  amateur: "joueur",
  supporter: "supporter",
  pro: "coach",
  sante: "sante",
};

/** Tarifs depuis la démo interactive (?u=…). */
export function pricingHrefForProductLine(line: ProductLineWeb): string {
  return pricingHrefForPole(PRODUCT_LINE_TO_POLE[line]);
}

export function resolvePricingPoleFromHash(rawHash: string): PoleId | null {
  const hash = rawHash.replace(/^#/, "").trim();
  return normalizePoleId(hash);
}

export { SPONSOR_PRICING_TIERS };
