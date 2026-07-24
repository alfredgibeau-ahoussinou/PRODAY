import type { ProductLineWeb } from "./content";

export const ROUTES = {
  home: "/",
  /** @deprecated Redirige vers /amateur. conservé pour liens legacy. */
  joueurs: "/joueurs",
  features: "/fonctionnalites",
  demo: "/demo",
  pulse: "/pulse",
  journeys: "/parcours",
  trust: "/confiance",
  privacy: "/confidentialite",
  terms: "/cgu",
  /** @deprecated Redirige vers /amateur. conservé pour liens legacy. */
  homme: "/homme",
  amateur: "/amateur",
  supporter: "/supporter",
  /** @deprecated Redirige vers /amateur. conservé pour liens legacy. */
  woman: "/woman",
  proJoueur: "/pro-joueur",
  proClub: "/pro-club",
  proStaff: "/pro-staff",
  /** @deprecated Hub legacy. voir pro-joueur, pro-club, pro-staff. */
  pro: "/pro",
  /** Hub bêta legacy. redirect vers programme si cookie. */
  beta: "/beta",
  /** Programme bêta (mini-site protégé). */
  betaProgramme: "/beta/programme",
  /** Guide installation APK / TestFlight (mini-site protégé). */
  betaInstaller: "/beta/installer",
  /** FAQ et support bêta (mini-site protégé). */
  betaAide: "/beta/aide",
  /** Liste d'attente publique (formulaire d'inscription). */
  betaWaitlist: "/beta/inscription",
  /** Espace admin fondateurs (protégé par minicode). */
  admin: "/admin",
  adminLogin: "/admin/login",
  adminBeta: "/admin/beta",
  about: "/a-propos",
  vision: "/vision",
  pricing: "/tarifs",
  sponsor: "/sponsor",
  partenaires: "/partenaires",
  partenairesConvention: "/partenaires/convention",
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
  { href: ROUTES.amateur, label: "Amateur" },
  { href: ROUTES.supporter, label: "Supporter" },
  { href: ROUTES.sante, label: "Santé" },
  { href: ROUTES.proJoueur, label: "Pro Joueur" },
  { href: ROUTES.proClub, label: "Pro Club" },
  { href: ROUTES.proStaff, label: "Pro Staff" },
  { href: ROUTES.sponsor, label: "Sponsor" },
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
  { href: ROUTES.amateur, label: "Pôle Amateur", subtitle: "Joueurs & coachs · district & régional" },
  { href: ROUTES.supporter, label: "Pôle Supporter", subtitle: "Fans & communauté" },
  { href: ROUTES.sante, label: "Pôle Santé", subtitle: "Kiné · Mental · Nutrition" },
  { href: ROUTES.proJoueur, label: "Pôle Pro Joueur", subtitle: "Carrière · visibilité · opportunités" },
  { href: ROUTES.proClub, label: "Pôle Pro Club", subtitle: "Structures · équipes · recrutement" },
  { href: ROUTES.proStaff, label: "Pôle Pro Staff", subtitle: "Agent · Recruteur · Coach · Orga" },
  { href: ROUTES.sponsor, label: "Pôle Sponsor", subtitle: "Marques & visibilité mesurée" },
] as const;

export const EXPLORE_CARDS = [
  {
    href: routeWithHash(ROUTES.features, "modules"),
    title: "Fonctionnalités",
    description: "Mercato, Fil, Reels, Arena, Sponsors et le reste.",
    image: "/showcase/classic-mercato.jpg",
    tag: "Produit",
  },
  {
    href: ROUTES.demo,
    title: "Démo interactive",
    description: "Naviguez les 9 onglets. Fil, Reels, Mercato et plus.",
    image: "/images/football-action-01.jpg",
    tag: "Essayer",
  },
  {
    href: ROUTES.pulse,
    title: "Visibilité ProDay",
    description: "Simulez votre score de visibilité en temps réel.",
    image: "/showcase/classic-exp-pulse.jpg",
    tag: "Simulateur",
  },
  {
    href: ROUTES.liveStats,
    title: "Live Stats",
    description: "Saisissez buts et passes. Voyez le profil se mettre à jour.",
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
    href: routeWithHash(ROUTES.journeys, "parcours"),
    title: "Parcours par rôle",
    description: "Joueur, recruteur, santé, organisateur ou parent. Étape par étape.",
    image: "/images/football-team-01.jpg",
    tag: "Parcours",
  },
  {
    href: ROUTES.quiz,
    title: "Quiz profil",
    description: "3 questions. Man, Woman ou Pro : quel parcours vous correspond.",
    image: "/showcase/classic-exp-discover.jpg",
    tag: "Quiz",
  },
  {
    href: routeWithHash(ROUTES.trust, "verification"),
    title: "Confiance",
    description: "Vérification diplômes, badges et contrôle parental.",
    image: "/showcase/classic-staff.jpg",
    tag: "Sécurité",
  },
  {
    href: ROUTES.compare,
    title: "Comparatif",
    description: "ProDay vs WhatsApp vs tableur. Pourquoi une seule app.",
    image: "/showcase/classic-exp-team.jpg",
    tag: "Analyse",
  },
  {
    href: ROUTES.vision,
    title: "Vision",
    description: "Aujourd'hui vs demain. Ce que l'app fait vraiment.",
    image: "/images/football-stadium-night-01.jpg",
    tag: "Vision",
  },
  {
    href: ROUTES.ecosystem,
    title: "Carte des acteurs",
    description: "Qui est relié à qui sur ProDay.",
    image: "/showcase/classic-arena.jpg",
    tag: "Carte",
  },
  {
    href: ROUTES.roadmap,
    title: "Roadmap",
    description: "Livré, en cours et à venir.",
    image: "/images/football-pitch-01.jpg",
    tag: "Roadmap",
  },
  {
    href: routeWithHash(ROUTES.sponsor, "formules"),
    title: "Pôle Sponsor",
    description: "Découverte 0 €, Territorial 49 € ou National Pro 99 €/mois.",
    image: "/images/football-mercato-01.jpg",
    tag: "Sponsor",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.pricing, "amateur"),
    title: "Tarifs",
    description: "Gratuit et offres Pro. 7 pôles : Amateur, Supporter, Santé, Pro et Sponsor.",
    image: "/showcase/classic-exp-messages.jpg",
    tag: "Tarifs",
  },
  {
    href: routeWithHash(ROUTES.proJoueur, "modules"),
    title: "Pôle Pro Joueur",
    description: "Carrière, visibilité scouting, portfolio et opportunités.",
    image: "/images/football-pro-01.jpg",
    tag: "Pro Joueur",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.proClub, "modules"),
    title: "Pôle Pro Club",
    description: "Structures, équipes, recrutement et vitrine.",
    image: "/images/football-club-01.jpg",
    tag: "Pro Club",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.proStaff, "modules"),
    title: "Pôle Pro Staff",
    description: "Agent, recruteur, coach pro et organisateur. Mercato Pro et réseau vérifié.",
    image: "/showcase/classic-staff.jpg",
    tag: "Pro Staff",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.amateur, "modules"),
    title: "Pro Day Man",
    description: "Foot masculin amateur. Mercato M, matchs et CV joueur.",
    image: "/images/football-amateur-01.jpg",
    tag: "Man",
  },
  {
    href: ROUTES.woman,
    title: "ProDay Woman",
    description: "Foot féminin. Mercato F, tournois et profil joueuse.",
    image: "/showcase/woman/woman-discover-hero.jpg",
    tag: "Woman",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.sante, "modules"),
    title: "Pro Day Santé",
    description: "Kinés, coach mental et nutrition. Annuaire vérifié et RDV en ligne.",
    image: "/images/football-health-01.jpg",
    tag: "Santé",
    accent: true,
  },
  {
    href: ROUTES.shop,
    title: "ProDay Shop",
    description: "Trépieds, t-shirts et maillots officiels. Man, Woman et Pro.",
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

/** Lien vers une page avec ancre de section (scroll précis après navigation). */
export function routeWithHash(route: string, sectionId: string): string {
  const base = route.split("#")[0] ?? route;
  return `${base}#${sectionId}`;
}

/** URL de la démo interactive pour un univers legacy → pôle `?p=`. */
export function demoUrlForUniverse(line: ProductLineWeb): string {
  const poleByLine: Record<ProductLineWeb, string> = {
    amateur: "amateur",
    supporter: "supporter",
    sante: "sante",
    homme: "pro_joueur",
    woman: "pro_joueur",
    pro: "pro_staff",
  };
  return `${ROUTES.demo}?p=${poleByLine[line]}`;
}
