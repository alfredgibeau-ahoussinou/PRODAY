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
 * Pôles marketing site.
 * Amateur + Pro Joueur → Pôle Joueur unifié.
 * Nouveau : Pôle Événements.
 */
export type PoleId =
  | "joueur"
  | "supporter"
  | "sante"
  | "pro_club"
  | "pro_staff"
  | "evenements"
  | "sponsor"
  /** @deprecated → joueur */
  | "amateur"
  /** @deprecated → joueur */
  | "pro_joueur";

export type PoleDefinition = {
  id: PoleId;
  kicker: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  pricingHash: string;
  logo: string;
  planIds: WebSubscriptionPlanBase["id"][];
};

/** Les 6 pôles du carousel marketing (+ Sponsor hors carousel). */
export const CAROUSEL_POLES: PoleDefinition[] = [
  {
    id: "joueur",
    kicker: "PÔLE JOUEUR",
    title: "Amateur → Pro",
    subtitle: "Badges · Mercato · Carrière",
    description:
      "Un seul espace joueur. Badges Amateur (bleu), Centre / Aspirant (vert), Professionnel (jaune). Signature pro : même profil, badge mis à jour.",
    href: ROUTES.joueur,
    pricingHash: "joueur",
    logo: "/branding/logo-man-picto.png",
    planIds: ["player_plus"],
  },
  {
    id: "supporter",
    kicker: "PÔLE SUPPORTER",
    title: "Fans & communauté",
    subtitle: "Live · Suivis · Débats · 0 €",
    description:
      "Tribune 100 % gratuite. Scores live, suivis illimités, débats et moments.",
    href: ROUTES.supporter,
    pricingHash: "supporter",
    logo: "/branding/logo-supporter-picto.png",
    planIds: [],
  },
  {
    id: "sante",
    kicker: "PÔLE SANTÉ",
    title: "Praticiens & staff médical",
    subtitle: "Kiné · Ostéo · Médecin · Prépa · Mental · Nutrition · Podologue",
    description:
      "Soigner près du terrain. 7 métiers, annuaire vérifié, agenda et téléconsultation HDS.",
    href: ROUTES.sante,
    pricingHash: "sante",
    logo: "/branding/logo-sante-picto.png",
    planIds: ["physio_pro"],
  },
  {
    id: "pro_club",
    kicker: "PÔLE CLUB",
    title: "Structures & équipes",
    subtitle: "U13 → Seniors · Recrutement",
    description:
      "Catégories, recrutement kanban et vitrine publique. Calendrier structure et convocations : Pôle Staff (premium).",
    href: ROUTES.proClub,
    pricingHash: "pro_club",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["club_pro"],
  },
  {
    id: "pro_staff",
    kicker: "PÔLE STAFF",
    title: "Métiers du foot",
    subtitle: "Agent · Recruteur · Coach · Calendrier",
    description:
      "Mercato, mandats, shortlists, calendrier structure et convocations premium. Offre agent lancement 19,99 €.",
    href: ROUTES.proStaff,
    pricingHash: "pro_staff",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["recruiter_pro", "coach_pro", "agent_elite"],
  },
  {
    id: "evenements",
    kicker: "PÔLE ÉVÉNEMENTS",
    title: "Organisateurs",
    subtitle: "Tournois · Académies · Détections",
    description:
      "Créez tournois, stages, détections et showcases. Inscriptions en ligne, listes, résultats et médias.",
    href: ROUTES.evenements,
    pricingHash: "evenements",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["organizer_pro"],
  },
];

export const SPONSOR_POLE: PoleDefinition = {
  id: "sponsor",
  kicker: "PÔLE SPONSOR",
  title: "Marques & sponsors",
  subtitle: "Visibilité · ROI · Terrain",
  description:
    "Campagnes ciblées auprès de clubs et joueurs actifs. KPIs lisibles. Vitrine vérifiée.",
  href: ROUTES.sponsor,
  pricingHash: "sponsor",
  logo: "/branding/logo-sponsor-picto.png",
  planIds: ["sponsor_pro"],
};

/** Tous les pôles produit (6 carousel + Sponsor). */
export const POLES: PoleDefinition[] = [...CAROUSEL_POLES, SPONSOR_POLE];

export function normalizePoleId(id: string): PoleId | null {
  if (id === "amateur" || id === "pro_joueur" || id === "pro" || id === "joueur") {
    return "joueur";
  }
  if (POLES.some((p) => p.id === id)) return id as PoleId;
  return null;
}

export const POLE_NAV_POLE_IDS: Record<string, PoleId> = {
  [ROUTES.amateur]: "joueur",
  [ROUTES.joueur]: "joueur",
  [ROUTES.supporter]: "supporter",
  [ROUTES.sante]: "sante",
  [ROUTES.proJoueur]: "joueur",
  [ROUTES.proClub]: "pro_club",
  [ROUTES.proStaff]: "pro_staff",
  [ROUTES.evenements]: "evenements",
  [ROUTES.sponsor]: "sponsor",
  [ROUTES.partenaires]: "sponsor",
};

/** Rayures nav. Hex logos officiels. */
export const POLE_NAV_STRIPE: Record<PoleId, string> = {
  joueur: "bg-[#0054F0]",
  amateur: "bg-[#0054F0]",
  supporter: "bg-[#3C00F0]",
  sante: "bg-[#00CCB4]",
  pro_joueur: "bg-[#0054F0]",
  pro_club: "bg-[#006CFC]",
  pro_staff: "bg-[#3B5BFF]",
  evenements: "bg-[#0891B2]",
  sponsor: "bg-[#D4AF37]",
};

/** Hex logo. Usage JS (hero, inline styles). */
export const POLE_BRAND_HEX: Record<PoleId, string> = {
  joueur: "#0054F0",
  amateur: "#0054F0",
  supporter: "#3C00F0",
  sante: "#00CCB4",
  pro_joueur: "#0054F0",
  pro_club: "#006CFC",
  pro_staff: "#3B5BFF",
  evenements: "#0891B2",
  sponsor: "#D4AF37",
};

const JOUEUR_STYLES = {
  nav: "text-[#0054F0]/85 hover:text-white",
  navActive: "bg-[#0054F0] text-white",
  section:
    "bg-gradient-to-b from-[#000814] via-[#001854]/55 to-black text-white",
  surface: "bg-[#050505] text-white",
  accentTop: "border-t-2 border-[#0054F0]/40",
  card: "border border-[#0054F0]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(0,84,240,0.28)]",
  cardHighlight: "ring-2 ring-[#0054F0]/55 border-[#0054F0]/40",
  badge: "bg-[#0054F0]/18 text-[#93c5fd]",
  textMuted: "text-[#60a5fa]/80",
  cta: "bg-[#0054F0] text-white hover:bg-[#2a6fff] shadow-[0_12px_32px_-10px_rgba(0,84,240,0.55)]",
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
    nav: "text-[#3C00F0]/80 hover:text-white",
    navActive: "bg-[#3C00F0] text-white",
    section:
      "bg-gradient-to-b from-[#060018] via-[#180078]/50 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#3C00F0]/40",
    card: "border border-[#3C00F0]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(60,0,240,0.25)]",
    cardHighlight: "ring-2 ring-[#3C00F0]/55 border-[#3C00F0]/40",
    badge: "bg-[#3C00F0]/18 text-[#c4b5fd]",
    textMuted: "text-[#a78bfa]/80",
    cta: "bg-[#3C00F0] text-white hover:bg-[#5a2aff] shadow-[0_12px_32px_-10px_rgba(60,0,240,0.55)]",
  },
  sante: {
    nav: "text-[#00CCB4]/80 hover:text-white",
    navActive: "bg-[#00CCB4] text-[#003530]",
    section:
      "bg-gradient-to-b from-[#001412] via-[#006C60]/45 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#00CCB4]/40",
    card: "border border-[#00CCB4]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(0,204,180,0.22)]",
    cardHighlight: "ring-2 ring-[#00CCB4]/50",
    badge: "bg-[#00CCB4]/18 text-[#99f6e4]",
    textMuted: "text-[#5eead4]/75",
    cta: "bg-[#00CCB4] text-[#003530] hover:bg-[#33d9c6] shadow-[0_12px_32px_-10px_rgba(0,204,180,0.5)]",
  },
  pro_club: {
    nav: "text-[#006CFC]/85 hover:text-white",
    navActive: "bg-[#006CFC] text-white",
    section:
      "bg-gradient-to-b from-[#000a1a] via-[#002478]/50 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#006CFC]/40",
    card: "border border-[#006CFC]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(0,108,252,0.28)]",
    cardHighlight: "ring-2 ring-[#006CFC]/55 border-[#006CFC]/40",
    badge: "bg-[#006CFC]/18 text-[#93c5fd]",
    textMuted: "text-[#60a5fa]/80",
    cta: "bg-[#006CFC] text-white hover:bg-[#3388ff] shadow-[0_12px_32px_-10px_rgba(0,108,252,0.55)]",
  },
  pro_staff: {
    nav: "text-[#3B5BFF]/85 hover:text-white",
    navActive: "bg-[#3B5BFF] text-white",
    section:
      "bg-gradient-to-b from-[#000612] via-[#001848]/55 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#3B5BFF]/40",
    card: "border border-[#3B5BFF]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(59,91,255,0.28)]",
    cardHighlight: "ring-2 ring-[#3B5BFF]/55 border-[#3B5BFF]/40",
    badge: "bg-[#3B5BFF]/18 text-[#a5b4fc]",
    textMuted: "text-[#818cf8]/80",
    cta: "bg-[#3B5BFF] text-white hover:bg-[#5c76ff] shadow-[0_12px_32px_-10px_rgba(59,91,255,0.55)]",
  },
  evenements: {
    nav: "text-[#0891B2]/85 hover:text-white",
    navActive: "bg-[#0891B2] text-white",
    section:
      "bg-gradient-to-b from-[#001018] via-[#0e4a5c]/50 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#0891B2]/40",
    card: "border border-[#0891B2]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(8,145,178,0.28)]",
    cardHighlight: "ring-2 ring-[#0891B2]/55 border-[#0891B2]/40",
    badge: "bg-[#0891B2]/18 text-[#67e8f9]",
    textMuted: "text-[#22d3ee]/80",
    cta: "bg-[#0891B2] text-white hover:bg-[#06b6d4] shadow-[0_12px_32px_-10px_rgba(8,145,178,0.55)]",
  },
  sponsor: {
    nav: "text-[#D4AF37]/85 hover:text-[#F5D76E]",
    navActive: "bg-gradient-to-r from-[#92700C] to-[#D4AF37] text-[#0a0a0a]",
    section:
      "bg-gradient-to-b from-[#070605] via-[#1a1508]/80 to-[#030303] text-white",
    surface: "bg-[#070605] text-white",
    accentTop: "border-t-2 border-[#D4AF37]/45",
    card: "border border-[#D4AF37]/22 bg-gradient-to-br from-[#D4AF37]/[0.06] to-transparent backdrop-blur-md",
    cardHighlight: "ring-2 ring-[#D4AF37]/50 border-[#D4AF37]/35",
    badge: "bg-[#D4AF37]/15 text-[#F5D76E] ring-1 ring-[#D4AF37]/25",
    textMuted: "text-[#D4AF37]/65",
    cta: "bg-gradient-to-r from-[#92700C] to-[#D4AF37] text-[#0a0a0a] hover:from-[#D4AF37] hover:to-[#F5D76E]",
  },
};

export type PoleStyle = (typeof POLE_STYLES)[PoleId];

export const POLE_IMAGES: Record<PoleId, string> = {
  joueur: "/images/football-pro-01.jpg",
  amateur: "/images/football-amateur-01.jpg",
  supporter: "/images/football-supporter-01.jpg",
  sante: "/images/football-health-01.jpg",
  pro_joueur: "/images/football-pro-01.jpg",
  pro_club: "/images/football-club-01.jpg",
  pro_staff: "/showcase/classic-staff.jpg",
  evenements: "/showcase/classic-arena.jpg",
  sponsor: "/showcase/classic-exp-sponsors.jpg",
};

export function plansForPole(poleId: PoleId): WebSubscriptionPlan[] {
  const resolved = normalizePoleId(poleId) ?? poleId;
  const pole = POLES.find((p) => p.id === resolved);
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
  const pole = POLES.find((p) => p.id === resolved);
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
  [ROUTES.pro]: "pro_staff",
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
  pro: "pro_staff",
  pro_joueur: "joueur",
  pro_club: "pro_club",
  pro_staff: "pro_staff",
  evenements: "evenements",
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
  pro: "pro_staff",
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
