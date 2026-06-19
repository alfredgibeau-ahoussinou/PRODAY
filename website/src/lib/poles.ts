import {
  getWebPlanById,
  plansForUniverse,
  SPONSOR_PRICING_TIERS,
  type WebSubscriptionPlan,
  type WebSubscriptionPlanBase,
} from "./content";
import { ROUTES } from "./routes";

export type PoleId = "joueur" | "pro" | "sante" | "sponsor";

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
  /** Joueur : variantes Man / Woman sur le même plan */
  playerVariants?: ("homme" | "woman")[];
};

export const POLES: PoleDefinition[] = [
  {
    id: "joueur",
    kicker: "PÔLE JOUEUR",
    title: "Man & Woman",
    subtitle: "Foot amateur & semi-pro",
    description:
      "Joueurs et joueuses — Mercato, Reels, Fil, Arena, Pulse et CV en ligne. Formule découverte gratuite, Joueur Plus pour les candidatures illimitées.",
    href: ROUTES.joueurs,
    pricingHash: "joueur",
    logo: "/branding/logo-man-picto.png",
    planIds: ["player_plus"],
    playerVariants: ["homme", "woman"],
  },
  {
    id: "pro",
    kicker: "PÔLE PRO",
    title: "Staff & structures",
    subtitle: "Coach · Club · Agent · Recruteur · Orga",
    description:
      "Professionnels du foot — Mercato Pro, convocations, scouting et tournois Arena. Chaque rôle a sa formule Gratuit / Pro.",
    href: ROUTES.pro,
    pricingHash: "pro",
    logo: "/branding/logo-pro-picto.png",
    planIds: [
      "recruiter_pro",
      "coach_pro",
      "club_pro",
      "agent_elite",
      "organizer_pro",
    ],
  },
  {
    id: "sante",
    kicker: "PÔLE SANTÉ",
    title: "Praticiens & staff médical",
    subtitle: "Kiné · Mental · Nutrition",
    description:
      "Annuaire vérifié, visibilité près des clubs et prise de RDV — abonnement léger + commission uniquement sur les consultations réservées via l'app.",
    href: ROUTES.sante,
    pricingHash: "sante",
    logo: "/branding/logo-sante-picto.png",
    planIds: ["physio_pro"],
  },
  {
    id: "sponsor",
    kicker: "PÔLE PARTENAIRES",
    title: "Sponsors & marques",
    subtitle: "Visibilité mesurée",
    description:
      "Espace dédié dans l'app — sans Reels ni Fil joueur. Découverte gratuite, Territorial sur devis ou National Pro à 99 €/mois.",
    href: ROUTES.partenaires,
    pricingHash: "sponsor",
    logo: "/branding/logo-pro-picto.png",
    planIds: ["sponsor_pro"],
  },
];

export const POLE_STYLES: Record<
  PoleId,
  {
    nav: string;
    navActive: string;
    /** Pleine largeur — page tarifs uniquement */
    section: string;
    /** Sections internes — fond sobre */
    surface: string;
    accentTop: string;
    card: string;
    cardHighlight: string;
    badge: string;
    textMuted: string;
    cta: string;
  }
> = {
  joueur: {
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
  pro: {
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

export function plansForPole(poleId: PoleId): WebSubscriptionPlan[] {
  const pole = POLES.find((p) => p.id === poleId);
  if (!pole) return [];

  if (poleId === "joueur") {
    return [
      ...plansForUniverse("homme"),
      ...plansForUniverse("woman"),
    ];
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

export { SPONSOR_PRICING_TIERS };
