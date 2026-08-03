import type { ProductLineWeb } from "./content";

export const ROUTES = {
  home: "/",
  /** @deprecated Redirige vers /joueur. conservé pour liens legacy. */
  joueurs: "/joueurs",
  features: "/fonctionnalites",
  demo: "/demo",
  pulse: "/pulse",
  journeys: "/parcours",
  trust: "/confiance",
  privacy: "/confidentialite",
  terms: "/cgu",
  /** @deprecated Redirige vers /joueur. conservé pour liens legacy. */
  homme: "/homme",
  /** @deprecated Redirige vers /joueur. */
  amateur: "/amateur",
  /** Pôle Joueur unifié (amateur → pro). */
  joueur: "/joueur",
  supporter: "/supporter",
  /** @deprecated Redirige vers /joueur. conservé pour liens legacy. */
  woman: "/woman",
  /** @deprecated Redirige vers /joueur. */
  proJoueur: "/pro-joueur",
  proClub: "/pro-club",
  proStaff: "/pro-staff",
  /** Pôle Événements (organisateurs). */
  evenements: "/evenements",
  /** @deprecated Hub legacy. voir joueur, pro-club, pro-staff. */
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
  /** Tableau de suivi des visites site / app. */
  adminVisites: "/admin/visites",
  /** Dashboard admin principal. */
  adminDashboard: "/admin/dashboard",
  /** Gestion des utilisateurs. */
  adminUsers: "/admin/users",
  /** Gestion du contenu (FAQ, témoignages). */
  adminContent: "/admin/content",
  /** Analytics détaillés. */
  adminAnalytics: "/admin/analytics",
  /** Gestion des pôles et fonctionnalités. */
  adminPoles: "/admin/poles",
  /** Gestion des emails et notifications. */
  adminEmails: "/admin/emails",
  /** Logs et audit trail. */
  adminLogs: "/admin/logs",
  /** Abonnements (Stripe / plans). */
  adminSubscriptions: "/admin/subscriptions",
  /** Rôles et permissions. */
  adminRoles: "/admin/roles",
  /** Modération et signalements. */
  adminReports: "/admin/reports",
  /** Parrainage. */
  adminReferrals: "/admin/referrals",
  /** Paramètres admin. */
  adminSettings: "/admin/settings",
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
  { href: ROUTES.joueur, label: "Joueur" },
  { href: ROUTES.supporter, label: "Supporter" },
  { href: ROUTES.sante, label: "Santé" },
  { href: ROUTES.proClub, label: "Club" },
  { href: ROUTES.proStaff, label: "Staff" },
  { href: ROUTES.evenements, label: "Événements" },
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
  { href: ROUTES.joueur, label: "Pôle Joueur", subtitle: "Amateur → Centre → Pro · un seul profil" },
  { href: ROUTES.supporter, label: "Pôle Supporter", subtitle: "Fans & communauté" },
  { href: ROUTES.sante, label: "Pôle Santé", subtitle: "Kiné · Mental · Nutrition" },
  { href: ROUTES.proClub, label: "Pôle Club", subtitle: "Structures · équipes · recrutement" },
  { href: ROUTES.proStaff, label: "Pôle Staff", subtitle: "Agent · Recruteur · Coach · calendrier" },
  { href: ROUTES.evenements, label: "Pôle Événements", subtitle: "Tournois · stages · détections" },
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
    href: routeWithHash(ROUTES.journeys, "parcours"),
    title: "Étapes par rôle",
    description: "Joueur, recruteur, santé, organisateur ou parent. Étape par étape.",
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
    description: "Gratuit et offres Pro. Joueur, Club, Staff, Événements, Santé, Supporter, Sponsor.",
    image: "/showcase/classic-exp-messages.jpg",
    tag: "Tarifs",
  },
  {
    href: routeWithHash(ROUTES.joueur, "modules"),
    title: "Pôle Joueur",
    description: "Amateur, centre de formation ou pro — badges, Mercato et carrière dans un seul espace.",
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
    href: routeWithHash(ROUTES.proStaff, "modules"),
    title: "Pôle Staff",
    description: "Agent, recruteur, coach. Calendrier structure, convocations premium et Mercato.",
    image: "/showcase/classic-staff.jpg",
    tag: "Staff",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.evenements, "modules"),
    title: "Pôle Événements",
    description: "Tournois, académies, camps, détections et showcases pour organisateurs.",
    image: "/showcase/classic-arena.jpg",
    tag: "Événements",
    accent: true,
  },
  {
    href: routeWithHash(ROUTES.joueur, "modules"),
    title: "Pro Day Man",
    description: "Foot masculin. Mercato, matchs et CV joueur — badge Amateur ou Pro.",
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
    amateur: "joueur",
    supporter: "supporter",
    sante: "sante",
    homme: "joueur",
    woman: "joueur",
    pro: "pro_staff",
  };
  return `${ROUTES.demo}?p=${poleByLine[line]}`;
}
