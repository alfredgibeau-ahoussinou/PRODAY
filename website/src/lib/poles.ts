import {
  getWebPlanById,
  plansForUniverse,
  SPONSOR_PRICING_TIERS,
  type ProductLineWeb,
  type WebSubscriptionPlan,
  type WebSubscriptionPlanBase,
} from "./content";
import { ROUTES } from "./routes";

export type PoleId =
  | "amateur"
  | "supporter"
  | "sante"
  | "pro_joueur"
  | "pro_club"
  | "pro_staff"
  | "sponsor";

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

/** Les 6 pôles du carousel et de la navigation principale (hors Partenaires). */
export const CAROUSEL_POLES: PoleDefinition[] = [
  {
    id: "amateur",
    kicker: "PÔLE AMATEUR",
    title: "Foot amateur",
    subtitle: "Joueurs & coachs · District · Régional",
    description:
      "Le dimanche sans le chaos WhatsApp — Mercato local, convocations, effectif coach. Genre H/F à l'inscription.",
    href: ROUTES.amateur,
    pricingHash: "amateur",
    logo: "/branding/logo-amateur-picto.png",
    planIds: ["player_plus", "coach_pro"],
  },
  {
    id: "supporter",
    kicker: "PÔLE SUPPORTER",
    title: "Fans & communauté",
    subtitle: "Live · Suivis · Débats · 0 €",
    description:
      "Tribune numérique 100 % gratuite — scores live, suivis illimités, débats et moments.",
    href: ROUTES.supporter,
    pricingHash: "supporter",
    logo: "/branding/logo-supporter-picto.png",
    planIds: [],
  },
  {
    id: "sante",
    kicker: "PÔLE SANTÉ",
    title: "Praticiens & staff médical",
    subtitle: "Kiné · Mental · Nutrition",
    description:
      "Soigner près du terrain — annuaire vérifié, agenda app et téléconsultation HDS.",
    href: ROUTES.sante,
    pricingHash: "sante",
    logo: "/branding/logo-sante-picto.png",
    planIds: ["sante_visio_gratuit", "physio_pro"],
  },
  {
    id: "pro_joueur",
    kicker: "PÔLE PRO JOUEUR",
    title: "Carrière pro",
    subtitle: "Contrat · Essais · Scouting",
    description:
      "Ta carrière, pas un CV Word — portfolio scouting, essais, mandat agent et stats validées coach.",
    href: ROUTES.proJoueur,
    pricingHash: "pro_joueur",
    logo: "/branding/logo-man-picto.png",
    planIds: ["player_plus"],
  },
  {
    id: "pro_club",
    kicker: "PÔLE PRO CLUB",
    title: "Structures & équipes",
    subtitle: "U13 → Seniors · Une structure",
    description:
      "Toute la structure en un regard — catégories, recrutement, calendrier et vitrine publique.",
    href: ROUTES.proClub,
    pricingHash: "pro_club",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["club_pro"],
  },
  {
    id: "pro_staff",
    kicker: "PÔLE PRO STAFF",
    title: "Métiers du foot pro",
    subtitle: "Agent · Recruteur · Coach · Arena",
    description:
      "Ton métier, ta coque — Mercato Pro, mandats, shortlists et tournois Arena.",
    href: ROUTES.proStaff,
    pricingHash: "pro_staff",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["recruiter_pro", "coach_pro", "agent_elite", "organizer_pro"],
  },
];

export const SPONSOR_POLE: PoleDefinition = {
  id: "sponsor",
  kicker: "PÔLE SPONSOR",
  title: "Marques & sponsors",
  subtitle: "Visibilité · ROI · Terrain",
  description:
    "Votre marque sur le vrai terrain — campagnes ciblées, KPIs lisibles et vitrine vérifiée.",
  href: ROUTES.sponsor,
  pricingHash: "sponsor",
  logo: "/branding/logo-sponsor-picto.png",
  planIds: ["sponsor_pro"],
};

/** Tous les pôles (6 carousel + Partenaires). */
export const POLES: PoleDefinition[] = [...CAROUSEL_POLES, SPONSOR_POLE];

export const POLE_NAV_POLE_IDS: Record<string, PoleId> = {
  [ROUTES.amateur]: "amateur",
  [ROUTES.supporter]: "supporter",
  [ROUTES.sante]: "sante",
  [ROUTES.proJoueur]: "pro_joueur",
  [ROUTES.proClub]: "pro_club",
  [ROUTES.proStaff]: "pro_staff",
  [ROUTES.sponsor]: "sponsor",
  [ROUTES.partenaires]: "sponsor",
};

/** Rayures nav — hex logos officiels. */
export const POLE_NAV_STRIPE: Record<PoleId, string> = {
  amateur: "bg-[#F03000]",
  supporter: "bg-[#3C00F0]",
  sante: "bg-[#00CCB4]",
  pro_joueur: "bg-[#0054F0]",
  pro_club: "bg-[#006CFC]",
  pro_staff: "bg-[#3B5BFF]",
  sponsor: "bg-[#D4AF37]",
};

/** Hex logo — usage JS (hero, inline styles). */
export const POLE_BRAND_HEX: Record<PoleId, string> = {
  amateur: "#F03000",
  supporter: "#3C00F0",
  sante: "#00CCB4",
  pro_joueur: "#0054F0",
  pro_club: "#006CFC",
  pro_staff: "#3B5BFF",
  sponsor: "#D4AF37",
};

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
  amateur: {
    nav: "text-[#F03000]/80 hover:text-white",
    navActive: "bg-[#F03000] text-white",
    section:
      "bg-gradient-to-b from-[#0a0400] via-[#841800]/45 to-black text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-[#F03000]/40",
    card: "border border-[#F03000]/25 bg-white/[0.04] backdrop-blur-md shadow-[0_24px_48px_-20px_rgba(240,48,0,0.25)]",
    cardHighlight: "ring-2 ring-[#F03000]/55 border-[#F03000]/40",
    badge: "bg-[#F03000]/18 text-[#ffb399]",
    textMuted: "text-[#F03000]/70",
    cta: "bg-[#F03000] text-white hover:bg-[#ff4a1a] shadow-[0_12px_32px_-10px_rgba(240,48,0,0.55)]",
  },
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
  pro_joueur: {
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
  amateur: "/images/football-amateur-01.jpg",
  supporter: "/images/football-supporter-01.jpg",
  sante: "/images/football-health-01.jpg",
  pro_joueur: "/images/football-pro-01.jpg",
  pro_club: "/images/football-club-01.jpg",
  pro_staff: "/showcase/classic-staff.jpg",
  sponsor: "/showcase/classic-exp-sponsors.jpg",
};

export function plansForPole(poleId: PoleId): WebSubscriptionPlan[] {
  const pole = POLES.find((p) => p.id === poleId);
  if (!pole) return [];

  if (poleId === "amateur") {
    return plansForUniverse("amateur");
  }

  if (poleId === "supporter") {
    return plansForUniverse("supporter");
  }

  return pole.planIds
    .map((id) => getWebPlanById(id))
    .filter((p): p is WebSubscriptionPlan => p != null);
}

export function poleById(id: PoleId): PoleDefinition {
  const pole = POLES.find((p) => p.id === id);
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

/** Lien tarifs avec ancre pôle (ex. /tarifs#pro_joueur). */
export function pricingHrefForPole(poleId: PoleId): string {
  return `${ROUTES.pricing}#${poleId}`;
}

const PATH_TO_PRICING_POLE: Record<string, PoleId> = {
  ...POLE_NAV_POLE_IDS,
  [ROUTES.homme]: "amateur",
  [ROUTES.woman]: "amateur",
  [ROUTES.pro]: "pro_joueur",
};

/** Tarifs contextualisés depuis la page courante (nav, footer). */
export function pricingHrefForPath(pathname: string): string {
  const base = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  const poleId = PATH_TO_PRICING_POLE[base];
  return poleId ? pricingHrefForPole(poleId) : ROUTES.pricing;
}

const UNIVERSE_TO_POLE: Record<string, PoleId> = {
  homme: "amateur",
  woman: "amateur",
  amateur: "amateur",
  supporter: "supporter",
  pro: "pro_joueur",
  pro_joueur: "pro_joueur",
  pro_club: "pro_club",
  pro_staff: "pro_staff",
};

/** Tarifs depuis une page univers / pôle (UniversePage). */
export function pricingHrefForUniverse(universe: string): string {
  const poleId = UNIVERSE_TO_POLE[universe];
  return poleId ? pricingHrefForPole(poleId) : ROUTES.pricing;
}

const PRODUCT_LINE_TO_POLE: Record<ProductLineWeb, PoleId> = {
  homme: "amateur",
  woman: "amateur",
  amateur: "amateur",
  supporter: "supporter",
  pro: "pro_joueur",
  sante: "sante",
};

/** Tarifs depuis la démo interactive (?u=…). */
export function pricingHrefForProductLine(line: ProductLineWeb): string {
  return pricingHrefForPole(PRODUCT_LINE_TO_POLE[line]);
}

export function resolvePricingPoleFromHash(rawHash: string): PoleId | null {
  const hash = rawHash.replace(/^#/, "").trim();
  if (hash === "joueur" || hash === "pro") return "pro_joueur";
  return POLES.some((p) => p.id === hash) ? (hash as PoleId) : null;
}

export { SPONSOR_PRICING_TIERS };
