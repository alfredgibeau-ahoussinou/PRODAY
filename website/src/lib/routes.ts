import type { ProductLineWeb } from "./content";
import {
  joueurExperienceHref,
  joueurGateHref,
} from "./joueurProfileStorage";

export const ROUTES = {
  home: "/",
  /** @deprecated Redirige vers /joueur. conservé pour liens legacy. */
  joueurs: "/joueurs",
  features: "/fonctionnalites",
  demo: "/demo",
  cards: "/cartes",
  pulse: "/pulse",
  journeys: "/parcours",
  trust: "/confiance",
  privacy: "/confidentialite",
  terms: "/cgu",
  /** @deprecated Redirige vers /joueur?gender=men. */
  homme: "/homme",
  /** @deprecated Redirige vers /joueur. */
  amateur: "/amateur",
  /** Pôle Joueur — porte « Qui es-tu ? » (genre + âge). */
  joueur: "/joueur",
  /** Expérience immersive 3D dédiée (après la question). */
  joueurExperience: "/joueur/experience",
  /** Raccourcis vers la porte avec genre pré-sélectionné. */
  joueurWoman: joueurGateHref({ gender: "women" }),
  joueurMan: joueurGateHref({ gender: "men" }),
  joueurYouth: joueurExperienceHref({ age: 11, gender: "men" }),
  joueurTeen: joueurExperienceHref({ age: 15, gender: "men" }),
  joueurAdult: joueurExperienceHref({ age: 22, gender: "men" }),
  supporter: "/supporter",
  /** @deprecated Redirige vers /joueur?gender=women. */
  woman: "/woman",
  /** @deprecated Redirige vers /joueur. */
  proJoueur: "/pro-joueur",
  proClub: "/pro-club",
  /** Pôle Coach (ex-Staff). */
  coach: "/coach",
  /** @deprecated Redirige vers /coach. */
  proStaff: "/pro-staff",
  /** @deprecated Organisateur intégré au Club : redirige vers /pro-club. */
  evenements: "/evenements",
  /** @deprecated Hub legacy. voir joueur, pro-club, coach. */
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
  /** Statut post-inscription (en attente / approuvé / refusé). */
  betaStatut: "/beta/statut",
  /** Espace admin fondateurs — Control Center. */
  admin: "/admin",
  adminLogin: "/admin/login",
  adminHome: "/admin/home",
  /** @deprecated → /admin/ops/beta */
  adminBeta: "/admin/ops/beta",
  /** @deprecated → /admin/ops/visites */
  adminVisites: "/admin/ops/visites",
  /** @deprecated → /admin/home */
  adminDashboard: "/admin/home",
  adminUsers: "/admin/users",
  adminClubs: "/admin/clubs",
  adminCommercial: "/admin/commercial",
  adminPricing: "/admin/commercial/pricing",
  adminDevis: "/admin/commercial/devis",
  adminFinances: "/admin/finances",
  adminPlatform: "/admin/platform",
  adminHealth: "/admin/platform/health",
  adminAi: "/admin/ai",
  adminProduct: "/admin/product",
  adminFlags: "/admin/product/flags",
  adminSecurity: "/admin/security",
  adminSystem: "/admin/system",
  /** @deprecated → /admin/content */
  adminContent: "/admin/content",
  /** @deprecated → /admin/ops/analytics */
  adminAnalytics: "/admin/ops/analytics",
  /** @deprecated → /admin/product */
  adminPoles: "/admin/product",
  /** @deprecated → /admin/communication */
  adminEmails: "/admin/communication",
  /** @deprecated → /admin/security/audit */
  adminLogs: "/admin/security/audit",
  /** @deprecated → /admin/ops/feedback */
  adminFeedback: "/admin/ops/feedback",
  /** @deprecated → /admin/finances/subscriptions */
  adminSubscriptions: "/admin/finances/subscriptions",
  /** @deprecated → /admin/security */
  adminRoles: "/admin/security",
  /** @deprecated → /admin/security/reports */
  adminReports: "/admin/security/reports",
  /** @deprecated → /admin/ops/referrals */
  adminReferrals: "/admin/ops/referrals",
  /** @deprecated → /admin/system */
  adminSettings: "/admin/system",
  about: "/a-propos",
  vision: "/vision",
  pricing: "/tarifs",
  sponsor: "/sponsor",
  /** Parcours devis sponsor multi-pages. */
  sponsorDevis: "/sponsor/devis",
  sponsorDevisEntreprise: "/sponsor/devis/entreprise",
  sponsorDevisContact: "/sponsor/devis/contact",
  sponsorDevisFormule: "/sponsor/devis/formule",
  sponsorDevisProjet: "/sponsor/devis/projet",
  sponsorDevisRecap: "/sponsor/devis/recap",
  sponsorDevisConfirmation: "/sponsor/devis/confirmation",
  /** Devis offre Club Tout inclus. */
  clubDevis: "/pro-club/devis",
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
  parent: "/parent",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Hub Président : section du Pôle Club (lien menu, pas une page séparée). */
export const PRESIDENT_HUB_HREF = `${ROUTES.proClub}#president`;

/** Vitrine app Joueur : section sous la porte « Qui es-tu ? ». */
export const JOUEUR_APP_HREF = `${ROUTES.joueur}#app`;

/** Nav vitrine : 6 pôles + Président (rattaché au Club). Santé = rôle intégré. */
export const POLE_NAV_ITEMS = [
  { href: ROUTES.joueur, label: "Joueur" },
  { href: ROUTES.proClub, label: "Club" },
  { href: PRESIDENT_HUB_HREF, label: "Président" },
  { href: ROUTES.coach, label: "Coach" },
  { href: ROUTES.parent, label: "Parent" },
  { href: ROUTES.supporter, label: "Supporter" },
  { href: ROUTES.sponsor, label: "Sponsor" },
] as const;

export const UTILITY_NAV_ITEMS = [
  { href: ROUTES.pricing, label: "Tarifs" },
  { href: ROUTES.features, label: "Fonctionnalités" },
  { href: ROUTES.cards, label: "Cartes" },
  { href: ROUTES.faq, label: "FAQ" },
] as const;

/** @deprecated Utiliser POLE_NAV_ITEMS + UTILITY_NAV_ITEMS */
export const NAV_ITEMS = [
  ...POLE_NAV_ITEMS,
  ...UTILITY_NAV_ITEMS,
] as const;

export const POLE_FOOTER_LINKS = [
  { href: JOUEUR_APP_HREF, label: "Espace Joueur", subtitle: "App · Accueil, matchs, saison · Pass 3,99 €" },
  { href: ROUTES.proClub, label: "Espace Club", subtitle: "À partir de 3 € / adhérent · Sur devis" },
  { href: PRESIDENT_HUB_HREF, label: "Pôle Président", subtitle: "Cockpit dirigeants · lié au Club" },
  { href: ROUTES.coach, label: "Espace Coach", subtitle: "Entraînements · Tactique IA · invitations" },
  { href: ROUTES.parent, label: "Pôle Parent", subtitle: "Supervision · messages · agenda · gratuit" },
  { href: ROUTES.supporter, label: "Pôle Supporter", subtitle: "Fans & communauté" },
  { href: ROUTES.sponsor, label: "Pôle Sponsor", subtitle: "Marques & micro sponsoring local" },
] as const;

export const EXPLORE_CARDS = [
  {
    href: routeWithHash(ROUTES.features, "modules"),
    title: "Fonctionnalités",
    description: "Mercato, Fil, Reels, Arène, Sponsors et le reste.",
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
    href: ROUTES.cards,
    title: "Cartes ProDay",
    description: "Fiche sportive réelle du joueur : sans note artificielle ni badge de prestige.",
    image: "/images/football-pro-01.jpg",
    tag: "Cartes",
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
    title: "Stats en direct",
    description: "Saisissez buts et passes. Voyez le profil se mettre à jour.",
    image: "/images/football-match-01.jpg",
    tag: "Match",
  },
  {
    href: routeWithHash(ROUTES.journeys, "parcours"),
    title: "Étapes par rôle",
    description: "Joueur, recruteur, organisateur ou parent. Étape par étape.",
    image: "/images/football-team-01.jpg",
    tag: "Rôles",
  },
  {
    href: ROUTES.quiz,
    title: "Vous êtes ?",
    description: "Choisissez votre rôle. Accès direct au bon pôle ProDay.",
    image: "/showcase/classic-exp-discover.jpg",
    tag: "Rôle",
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
    href: routeWithHash(ROUTES.pricing, "joueur"),
    title: "Tarifs",
    description: "Gratuit et offres Pro. Joueur, Club, Coach, Supporter, Sponsor.",
    image: "/showcase/classic-exp-messages.jpg",
    tag: "Tarifs",
  },
  {
    href: routeWithHash(ROUTES.joueur, "modules"),
    title: "Pôle Joueur",
    description: "Amateur, centre de formation ou pro. Badges, Mercato et carrière dans un seul espace.",
    image: "/images/football-pro-01.jpg",
    tag: "Joueur",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.proClub, "modules"),
    title: "Pôle Club",
    description: "Structures, équipes, recrutement kanban et vitrine.",
    image: "/images/football-club-01.jpg",
    tag: "Club",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.coach, "modules"),
    title: "Pôle Coach",
    description: "Tactique IA, IA, effectif et préparation match. Rattaché au club.",
    image: "/showcase/classic-staff.jpg",
    tag: "Coach",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.proClub, "modules"),
    title: "Tournois & détections",
    description: "Rôle organisateur intégré au Club : Arène, stages et inscriptions.",
    image: "/showcase/classic-arena.jpg",
    tag: "Club",
    accent: true,
  },
  {
    href: ROUTES.joueurMan,
    title: "Pro Day Man",
    description: "Foot masculin. Mercato, matchs et CV joueur. Badge Amateur ou Pro.",
    image: "/images/football-amateur-01.jpg",
    tag: "Man",
  },
  {
    href: ROUTES.joueurWoman,
    title: "ProDay Woman",
    description: "Foot féminin. Mercato F, tournois et profil joueuse.",
    image: "/showcase/woman/woman-discover-hero.jpg",
    tag: "Woman",
    accent: true,
  },
  {
    href: ROUTES.shop,
    title: "Boutique ProDay",
    description: "Trépieds, t shirts et maillots officiels. Man, Woman et Pro.",
    image: "/images/football-training-01.jpg",
    tag: "Boutique",
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
    amateur: "joueur",
    supporter: "supporter",
    sante: "sante",
    homme: "joueur",
    woman: "joueur",
    pro: "coach",
  };
  return `${ROUTES.demo}?p=${poleByLine[line]}`;
}
