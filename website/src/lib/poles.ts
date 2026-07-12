import {
  getWebPlanById,
  plansForUniverse,
  SPONSOR_PRICING_TIERS,
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
      "Ton club, ta semaine, tes déplacements — convocations, covoiturage et effectif. Genre H/F à l'inscription.",
    href: ROUTES.amateur,
    pricingHash: "amateur",
    logo: "/branding/logo-amateur-picto.png",
    planIds: ["player_plus", "coach_pro"],
  },
  {
    id: "supporter",
    kicker: "PÔLE SUPPORTER",
    title: "Fans & communauté",
    subtitle: "Matchs · Reels · Fil",
    description:
      "Le match près de chez toi et dans le monde — tribune 100 % gratuite, live scores, suivis et débats.",
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
      "Tes RDV, tes sportifs, ton cabinet — annuaire vérifié et prise de RDV près des clubs.",
    href: ROUTES.sante,
    pricingHash: "sante",
    logo: "/branding/logo-sante-picto.png",
    planIds: ["physio_pro"],
  },
  {
    id: "pro_joueur",
    kicker: "PÔLE PRO JOUEUR",
    title: "Carrière pro",
    subtitle: "Visibilité · Portfolio · Opportunités",
    description:
      "Ta carrière, ta visibilité, tes opportunités — consultations clubs, essais, mandat agent et stats validées coach.",
    href: ROUTES.proJoueur,
    pricingHash: "pro_joueur",
    logo: "/branding/logo-man-picto.png",
    planIds: ["player_plus"],
  },
  {
    id: "pro_club",
    kicker: "PÔLE PRO CLUB",
    title: "Structures & équipes",
    subtitle: "Recrutement · Calendrier · Vitrine",
    description:
      "Ta structure, tes équipes, ton recrutement — arbre des catégories, annonces et stats agrégées.",
    href: ROUTES.proClub,
    pricingHash: "pro_club",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["club_pro"],
  },
  {
    id: "pro_staff",
    kicker: "PÔLE PRO STAFF",
    title: "Métiers du foot pro",
    subtitle: "Agent · Recruteur · Coach · Orga",
    description:
      "Ton métier du foot pro — mandats agent, shortlists scouting, convocations groupe et tournois Arena.",
    href: ROUTES.proStaff,
    pricingHash: "pro_staff",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["recruiter_pro", "coach_pro", "agent_elite", "organizer_pro"],
  },
];

export const SPONSOR_POLE: PoleDefinition = {
  id: "sponsor",
  kicker: "PÔLE PARTENAIRES",
  title: "Sponsors & marques",
  subtitle: "Visibilité mesurée",
  description:
    "Ta marque sur le terrain — ROI campagnes, visibilité clubs. Hors carousel, entrée depuis proday.fr/partenaires.",
  href: ROUTES.partenaires,
  pricingHash: "sponsor",
  logo: "/branding/logo-pro-picto.png",
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
  [ROUTES.partenaires]: "sponsor",
};

export const POLE_NAV_STRIPE: Record<PoleId, string> = {
  amateur: "bg-orange-500",
  supporter: "bg-violet-600",
  sante: "bg-teal-500",
  pro_joueur: "bg-emerald-500",
  pro_club: "bg-blue-500",
  pro_staff: "bg-indigo-600",
  sponsor: "bg-amber-400",
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
    nav: "text-orange-300/80 hover:text-white",
    navActive: "bg-orange-600 text-white",
    section:
      "bg-gradient-to-b from-neutral-950 via-orange-950/50 to-neutral-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-orange-500/35",
    card: "border border-orange-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-orange-400/50 border-orange-400/30",
    badge: "bg-orange-500/20 text-orange-200",
    textMuted: "text-orange-300/70",
    cta: "bg-orange-500 text-white hover:bg-orange-400",
  },
  supporter: {
    nav: "text-violet-300/80 hover:text-white",
    navActive: "bg-violet-600 text-white",
    section:
      "bg-gradient-to-b from-neutral-950 via-violet-950/50 to-neutral-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-violet-500/35",
    card: "border border-violet-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-violet-400/50 border-violet-400/30",
    badge: "bg-violet-500/20 text-violet-200",
    textMuted: "text-violet-300/70",
    cta: "bg-violet-600 text-white hover:bg-violet-500",
  },
  sante: {
    nav: "text-teal-300/80 hover:text-white",
    navActive: "bg-teal-600 text-white",
    section: "bg-gradient-to-b from-teal-950 via-slate-950 to-teal-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-teal-500/35",
    card: "border border-teal-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-teal-400/40",
    badge: "bg-teal-500/20 text-teal-200",
    textMuted: "text-teal-300/70",
    cta: "bg-teal-500 text-white hover:bg-teal-400",
  },
  pro_joueur: {
    nav: "text-emerald-300/80 hover:text-white",
    navActive: "bg-emerald-600 text-white",
    section:
      "bg-gradient-to-b from-neutral-950 via-emerald-950/50 to-neutral-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-emerald-500/35",
    card: "border border-emerald-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-emerald-400/50 border-emerald-400/30",
    badge: "bg-emerald-500/20 text-emerald-200",
    textMuted: "text-emerald-300/70",
    cta: "bg-emerald-500 text-white hover:bg-emerald-400",
  },
  pro_club: {
    nav: "text-blue-300/80 hover:text-white",
    navActive: "bg-blue-600 text-white",
    section: "bg-gradient-to-b from-blue-950 via-slate-950 to-blue-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-blue-500/35",
    card: "border border-blue-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-amber-400/50 border-amber-400/30",
    badge: "bg-blue-500/20 text-blue-200",
    textMuted: "text-blue-300/70",
    cta: "bg-white text-blue-950 hover:bg-blue-50",
  },
  pro_staff: {
    nav: "text-indigo-300/80 hover:text-white",
    navActive: "bg-indigo-600 text-white",
    section: "bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-indigo-500/35",
    card: "border border-indigo-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-indigo-400/50 border-indigo-400/30",
    badge: "bg-indigo-500/20 text-indigo-200",
    textMuted: "text-indigo-300/70",
    cta: "bg-indigo-500 text-white hover:bg-indigo-400",
  },
  sponsor: {
    nav: "text-amber-300/80 hover:text-white",
    navActive: "bg-amber-500 text-slate-950",
    section: "bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white",
    surface: "bg-[#050505] text-white",
    accentTop: "border-t-2 border-amber-500/35",
    card: "border border-amber-500/20 bg-white/5 backdrop-blur-sm",
    cardHighlight: "ring-2 ring-amber-400/50",
    badge: "bg-amber-500/20 text-amber-200",
    textMuted: "text-amber-200/70",
    cta: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  },
};

export type PoleStyle = (typeof POLE_STYLES)[PoleId];

export const POLE_IMAGES: Record<PoleId, string> = {
  amateur: "/images/football-amateur-01.jpg",
  supporter: "/images/football-supporter-01.jpg",
  sante: "/images/football-health-01.jpg",
  pro_joueur: "/images/football-pro-01.jpg",
  pro_club: "/images/football-club-01.jpg",
  pro_staff: "/images/football-coach-01.jpg",
  sponsor: "/images/football-club-01.jpg",
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

export { SPONSOR_PRICING_TIERS };
