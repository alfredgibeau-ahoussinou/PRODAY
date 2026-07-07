import type { ProductLineWeb } from "./content";

export const ROUTES = {
  home: "/",
  joueurs: "/joueurs",
  features: "/fonctionnalites",
  demo: "/demo",
  pulse: "/pulse",
  journeys: "/parcours",
  trust: "/confiance",
  privacy: "/confidentialite",
  terms: "/cgu",
  /** @deprecated Redirige vers /amateur — conservé pour liens legacy. */
  homme: "/homme",
  amateur: "/amateur",
  supporter: "/supporter",
  /** @deprecated Redirige vers /amateur — conservé pour liens legacy. */
  woman: "/woman",
  pro: "/pro",
  beta: "/beta",
  about: "/a-propos",
  vision: "/vision",
  pricing: "/tarifs",
  partenaires: "/partenaires",
  faq: "/faq",
  liveStats: "/live-stats",
  cv: "/cv",
  roadmap: "/roadmap",
  quiz: "/quiz",
  compare: "/comparatif",
  ecosystem: "/ecosysteme",
  shop: "/shop",
  sante: "/sante",
} as const;

export type RouteKey = keyof typeof ROUTES;

export const POLE_NAV_ITEMS = [
  { href: ROUTES.joueurs, label: "Joueurs" },
  { href: ROUTES.amateur, label: "Amateur" },
  { href: ROUTES.supporter, label: "Supporter" },
  { href: ROUTES.pro, label: "Pro" },
  { href: ROUTES.sante, label: "Santé" },
  { href: ROUTES.partenaires, label: "Partenaires" },
] as const;

export const UTILITY_NAV_ITEMS = [
  { href: ROUTES.pricing, label: "Tarifs" },
  { href: ROUTES.features, label: "Fonctionnalités" },
  { href: ROUTES.faq, label: "FAQ" },
] as const;

/** @deprecated Utiliser POLE_NAV_ITEMS + UTILITY_NAV_ITEMS */
export const NAV_ITEMS = [
  ...POLE_NAV_ITEMS,
  ...UTILITY_NAV_ITEMS,
] as const;

export const POLE_FOOTER_LINKS = [
  { href: ROUTES.joueurs, label: "Pôle Joueur", subtitle: "Pro joueur · genre H/F/mineur" },
  { href: ROUTES.amateur, label: "Pôle Amateur", subtitle: "Joueurs & coachs" },
  { href: ROUTES.supporter, label: "Pôle Supporter", subtitle: "Fans & communauté" },
  { href: ROUTES.pro, label: "Pôle Pro", subtitle: "Staff & structures pro" },
  { href: ROUTES.sante, label: "Pôle Santé", subtitle: "Kiné · Mental · Nutrition" },
  { href: ROUTES.partenaires, label: "Pôle Partenaires", subtitle: "Sponsors & marques" },
] as const;

export const EXPLORE_CARDS = [
  {
    href: ROUTES.features,
    title: "Fonctionnalités",
    description: "11 piliers produit — Mercato, Fil, Reels, Arena, Sponsors…",
    image: "/showcase/classic-mercato.jpg",
    tag: "Produit",
  },
  {
    href: ROUTES.demo,
    title: "Démo interactive",
    description: "Naviguez les 9 onglets dynamiques — Fil, Reels, Mercato et plus.",
    image: "/images/football-action-01.jpg",
    tag: "Essayer",
  },
  {
    href: ROUTES.pulse,
    title: "Pulse ProDay",
    description: "Simulez votre score de visibilité en temps réel.",
    image: "/showcase/classic-exp-pulse.jpg",
    tag: "Simulateur",
  },
  {
    href: ROUTES.liveStats,
    title: "Live Stats",
    description: "Saisissez buts et passes — voyez votre profil se mettre à jour.",
    image: "/images/football-match-01.jpg",
    tag: "Match",
  },
  {
    href: ROUTES.cv,
    title: "CV joueur",
    description: "Aperçu du CV foot en ligne alimenté par vos matchs.",
    image: "/showcase/classic-profile.jpg",
    tag: "Export",
  },
  {
    href: ROUTES.journeys,
    title: "Parcours par rôle",
    description: "Joueur, recruteur, pôle santé, organisateur ou parent — étape par étape.",
    image: "/images/football-team-01.jpg",
    tag: "Parcours",
  },
  {
    href: ROUTES.quiz,
    title: "Quiz profil",
    description: "3 questions — Man, Woman ou Pro : quel parcours vous correspond.",
    image: "/showcase/classic-exp-discover.jpg",
    tag: "Quiz",
  },
  {
    href: ROUTES.trust,
    title: "Confiance",
    description: "Vérification diplômes, badges et contrôle parental.",
    image: "/images/football-coach-01.jpg",
    tag: "Sécurité",
  },
  {
    href: ROUTES.compare,
    title: "Comparatif",
    description: "ProDay vs WhatsApp vs tableur — pourquoi une seule app.",
    image: "/showcase/classic-exp-team.jpg",
    tag: "Analyse",
  },
  {
    href: ROUTES.vision,
    title: "Vision",
    description: "Aujourd'hui vs demain — pitch honnête sur les capacités réelles de l'app.",
    image: "/images/football-stadium-night-01.jpg",
    tag: "Vision",
  },
  {
    href: ROUTES.ecosystem,
    title: "Écosystème",
    description: "Carte interactive des acteurs reliés par ProDay.",
    image: "/showcase/classic-arena.jpg",
    tag: "Écosystème",
  },
  {
    href: ROUTES.roadmap,
    title: "Roadmap",
    description: "Livré, en cours et à venir — transparence produit.",
    image: "/images/football-pitch-01.jpg",
    tag: "Roadmap",
  },
  {
    href: ROUTES.partenaires,
    title: "Espace Partenaires",
    description: "Découverte 0 €, Territorial 49 € ou National Pro 99 €/mois — visibilité clubs.",
    image: "/images/football-club-01.jpg",
    tag: "Partenaires",
    accent: true,
  },
  {
    href: ROUTES.pricing,
    title: "Tarifs",
    description: "Gratuit et offres Pro — 4 pôles Joueur, Pro, Santé et Partenaires.",
    image: "/showcase/classic-exp-messages.jpg",
    tag: "Tarifs",
  },
  {
    href: ROUTES.joueurs,
    title: "Pôle Joueur",
    description: "Man & Woman — Mercato, Reels, Arena, Pulse et CV joueur.",
    image: "/images/football-action-01.jpg",
    tag: "Joueurs",
    accent: true,
  },
  {
    href: ROUTES.homme,
    title: "Pro Day Man",
    description: "Foot masculin amateur — Mercato M, matchs et CV joueur.",
    image: "/images/football-amateur-01.jpg",
    tag: "Man",
  },
  {
    href: ROUTES.woman,
    title: "ProDay Woman",
    description: "Univers foot féminin — Mercato F, tournois et profil joueuse.",
    image: "/showcase/woman/woman-discover-hero.jpg",
    tag: "Woman",
    accent: true,
  },
  {
    href: ROUTES.pro,
    title: "Pro Day Pro",
    description: "Recruteurs, coach, agent et club — Mercato Pro et réseau vérifié.",
    image: "/images/football-pro-01.jpg",
    tag: "Pro",
    accent: true,
  },
  {
    href: ROUTES.sante,
    title: "Pro Day Santé",
    description: "Kinés, coach mental et nutrition — annuaire vérifié et RDV en ligne.",
    image: "/images/football-health-01.jpg",
    tag: "Santé",
    accent: true,
  },
  {
    href: ROUTES.shop,
    title: "ProDay Shop",
    description: "Trépieds, t-shirts et maillots officiels — par univers Man, Woman et Pro.",
    image: "/images/football-training-01.jpg",
    tag: "Shop",
  },
  {
    href: ROUTES.faq,
    title: "FAQ",
    description: "Réponses aux questions les plus fréquentes.",
    image: "/images/football-pitch-01.jpg",
    tag: "Aide",
  },
] as const;

/** URL de la démo interactive pour un univers (homme / woman / pro). */
export function demoUrlForUniverse(line: ProductLineWeb): string {
  return `${ROUTES.demo}?u=${line}`;
}
