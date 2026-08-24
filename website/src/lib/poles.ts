import {
  getWebPlanById,
  plansForUniverse,
  SPONSOR_PRICING_TIERS,
  type ProductLineWeb,
  type WebSubscriptionPlan,
  type WebSubscriptionPlanBase,
} from "./content";
import { POLE_ACCENT_HEX } from "./brandColors";
import {
  CLUB_APP_HREF,
  COACH_APP_HREF,
  PARENT_APP_HREF,
  PRESIDENT_HUB_HREF,
  ROUTES,
  SPONSOR_APP_HREF,
} from "./routes";

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
    subtitle: "Accueil · Matchs · Saison",
    description:
      "Analyse de forme, Centre Match, stats de saison, profil et menu Plus. Pass optionnel 3,99 € : programmes, vidéo et contenu avancé.",
    href: ROUTES.joueur,
    pricingHash: "joueur",
    logo: "/branding/logo-proday-mark-joueur.png",
    planIds: ["player_plus"],
  },
  {
    id: "pro_club",
    kicker: "ESPACE CLUB",
    navLabel: "Club",
    title: "Le cœur de ProDay",
    subtitle: "Équipes · Forme · Licenciés",
    description:
      "Équipes, analyse de forme, licenciés, coachs, invitations, tournois et covoiturage. À partir de 3 € / adhérent (sur devis). Caméra en option.",
    href: ROUTES.proClub,
    pricingHash: "pro_club",
    logo: "/branding/logo-proday-mark-club.png",
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
    logo: "/branding/logo-proday-mark-coach.png",
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
    logo: "/branding/logo-proday-mark-parent.png",
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
    logo: "/branding/logo-proday-mark-supporter.png",
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
  logo: "/branding/logo-proday-mark-sponsor.png",
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
  logo: "/branding/logo-proday-mark-parent.png",
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
  logo: "/branding/logo-proday-mark-coach.png",
  planIds: ["coach_pro"],
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
  logo: "/branding/logo-proday-mark-joueur.png",
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

/** Rayures nav. Hex logos officiels (planche brand). */
export const POLE_NAV_STRIPE: Record<PoleId, string> = {
  joueur: "bg-[#FFFFFF]",
  amateur: "bg-[#FFFFFF]",
  supporter: "bg-[#8B5CF6]",
  sante: "bg-[#84CC16]",
  parent: "bg-[#84CC16]",
  pro_joueur: "bg-[#FFFFFF]",
  pro_club: "bg-[#2563EB]",
  coach: "bg-[#E8B923]",
  pro_staff: "bg-[#E8B923]",
  evenements: "bg-[#F97316]",
  sponsor: "bg-[#EF4444]",
};

/** Hex logo. Usage JS (hero, inline styles). */
export const POLE_BRAND_HEX: Record<PoleId, string> = {
  joueur: "#FFFFFF",
  amateur: "#FFFFFF",
  supporter: "#8B5CF6",
  sante: "#84CC16",
  parent: "#84CC16",
  pro_joueur: "#FFFFFF",
  pro_club: "#2563EB",
  coach: "#E8B923",
  pro_staff: "#E8B923",
  evenements: "#F97316",
  sponsor: "#EF4444",
};

/** Couleur pastille du menu Pôles (Président = accent or dédié). */
export function poleNavAccentHex(href: string): string {
  const path = href.split("#")[0] ?? href;
  if (
    href === PRESIDENT_HUB_HREF ||
    path === ROUTES.president ||
    href.endsWith("#president")
  ) {
    return POLE_ACCENT_HEX.president;
  }
  if (
    href === CLUB_APP_HREF ||
    href === COACH_APP_HREF ||
    href === PARENT_APP_HREF ||
    href === SPONSOR_APP_HREF ||
    href.endsWith("#app")
  ) {
    if (path === ROUTES.proClub) return "#2563EB";
    if (path === ROUTES.coach) return "#2563EB";
    if (path === ROUTES.joueur) return POLE_ACCENT_HEX.joueur;
    if (path === ROUTES.parent) return POLE_ACCENT_HEX.parent;
    if (path === ROUTES.sponsor) return "#C026D3";
    if (path === ROUTES.president) return POLE_ACCENT_HEX.president;
  }
  const pole = SHOWCASE_POLES.find((p) => p.href === path);
  if (!pole) return POLE_ACCENT_HEX.president;
  if (pole.id === "joueur") return POLE_ACCENT_HEX.joueur;
  return POLE_BRAND_HEX[pole.id];
}

const JOUEUR_STYLES = {
  nav: "text-white/70 hover:text-white",
  navActive: "bg-white text-black",
  section: "bg-black text-white",
  surface: "bg-black text-white",
  accentTop: "border-t border-white/10",
  card: "border border-white/10 bg-white/[0.03]",
  cardHighlight: "ring-1 ring-white/40 border-white/30",
  badge: "bg-white/12 text-white",
  textMuted: "text-white/55",
  cta: "bg-white text-black hover:brightness-110",
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
    nav: "text-white/70 hover:text-[#8B5CF6]",
    navActive: "bg-[#8B5CF6] text-white",
    cardHighlight: "ring-1 ring-[#8B5CF6]/40 border-[#8B5CF6]/30",
    badge: "bg-[#8B5CF6]/12 text-[#8B5CF6]",
    cta: "bg-[#8B5CF6] text-white hover:brightness-110",
  },
  sante: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#84CC16]",
    navActive: "bg-[#84CC16] text-black",
    cardHighlight: "ring-1 ring-[#84CC16]/40 border-[#84CC16]/30",
    badge: "bg-[#84CC16]/12 text-[#84CC16]",
    cta: "bg-[#84CC16] text-black hover:brightness-110",
  },
  parent: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#84CC16]",
    navActive: "bg-[#84CC16] text-black",
    cardHighlight: "ring-1 ring-[#84CC16]/40 border-[#84CC16]/30",
    badge: "bg-[#84CC16]/12 text-[#84CC16]",
    cta: "bg-[#84CC16] text-black hover:brightness-110",
  },
  pro_club: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#2563EB]",
    navActive: "bg-[#2563EB] text-white",
    cardHighlight: "ring-1 ring-[#2563EB]/40 border-[#2563EB]/30",
    badge: "bg-[#2563EB]/12 text-[#2563EB]",
    cta: "bg-[#2563EB] text-white hover:brightness-110",
  },
  coach: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#E8B923]",
    navActive: "bg-[#E8B923] text-black",
    cardHighlight: "ring-1 ring-[#E8B923]/40 border-[#E8B923]/30",
    badge: "bg-[#E8B923]/12 text-[#E8B923]",
    cta: "bg-[#E8B923] text-black hover:brightness-110",
  },
  pro_staff: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#E8B923]",
    navActive: "bg-[#E8B923] text-black",
    cardHighlight: "ring-1 ring-[#E8B923]/40 border-[#E8B923]/30",
    badge: "bg-[#E8B923]/12 text-[#E8B923]",
    cta: "bg-[#E8B923] text-black hover:brightness-110",
  },
  evenements: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#F97316]",
    navActive: "bg-[#F97316] text-black",
    cardHighlight: "ring-1 ring-[#F97316]/40 border-[#F97316]/30",
    badge: "bg-[#F97316]/12 text-[#F97316]",
    cta: "bg-[#F97316] text-black hover:brightness-110",
  },
  sponsor: {
    ...JOUEUR_STYLES,
    nav: "text-white/70 hover:text-[#EF4444]",
    navActive: "bg-[#EF4444] text-black",
    cardHighlight: "ring-1 ring-[#EF4444]/40 border-[#EF4444]/30",
    badge: "bg-[#EF4444]/12 text-[#EF4444]",
    cta: "bg-[#EF4444] text-black hover:brightness-110",
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
  [ROUTES.president]: "pro_club",
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
