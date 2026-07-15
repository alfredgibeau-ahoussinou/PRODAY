import {
  ANNUAL_DISCOUNT_PERCENT,
  formatAnnualPricingLine,
  yearlyPriceFromMonthly,
} from "./pricing";

export const BRAND = {
  name: "ProDay",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  logo: "/branding/logo-proday-official.png",
  mission:
    "Profil, Mercato, journal d'activités et saison — quatre pôles (Joueur, Pro, Santé, Partenaires) dans une app mobile honnête sur ce qui est livré aujourd'hui.",
} as const;

/** Pitch honnête : capacités réelles vs ambition long terme — pas de métriques fictives. */
export const PRODUCT_VISION = {
  intro:
    "ProDay relie carrière, club et communauté foot amateur et semi-pro. Nous parlons de ce qui existe dans l'app — et de ce qui arrive ensuite.",
  disclaimer:
    "Les chiffres du site décrivent l'architecture produit, pas l'audience en temps réel. L'analyse IA concerne vos highlights de séance (vidéo ou poster + notes), pas chaque action sur le terrain.",
  today: {
    title: "Aujourd'hui",
    lead: "Fonctionnalités disponibles ou en déploiement actif dans l'application.",
    items: [
      "Profil joueur / staff : Visibilité, CV en ligne, galerie et stats saison",
      "Score carrière et timeline de progression",
      "Journal d'activités (séances, matchs, highlights)",
      "Analyse IA des highlights de séance (miniature vidéo ou poster + tags et notes)",
      "Mercato : annonces, candidatures, pipeline staff et recruteurs",
      "Matchs, convocations RSVP, Live Stats vers le profil",
      "Arena : tournois, inscriptions et palmarès",
      "Fil communauté, Reels et question hebdo",
      "Espace partenaires / sponsors (Découverte, Territorial, National Pro)",
      "Pôle santé, covoiturage, contrôle parental et espace famille",
      "Admin, vérification diplômes et messagerie sécurisée",
      "Dashboard IA d'accueil (recommandations matchs, progression, alertes)",
    ],
  },
  tomorrow: {
    title: "Demain",
    lead: "Ambitions produit — pas encore livrées. Aucune promesse marketing sur ces points.",
    items: [
      "Analyse vidéo frame-by-frame avancée (trajectoires, gestes techniques)",
      "Détection automatique des talents à l'échelle mondiale",
      "Notifications géolocalisées agents et push partenaires à grande échelle",
      "Paiements tournois intégrés",
      "Couverture IAP complète sur tous les plans store",
    ],
  },
} as const;

/** Nouveautés mises en avant sur la home premium. */
export const SPOTLIGHT_FEATURES = [
  {
    id: "reels",
    title: "Reels",
    tagline: "Vidéos courtes",
    description: "Moments forts et séquences en format vertical — visibilité pour joueurs et clubs.",
    accent: "from-violet-600/30 to-violet-900/10",
  },
  {
    id: "feed",
    title: "Fil & question hebdo",
    tagline: "Communauté",
    description: "Publications, réactions et question de la semaine — l'activité de votre communauté.",
    accent: "from-indigo-600/30 to-indigo-900/10",
  },
  {
    id: "partners",
    title: "Espace partenaires",
    tagline: "Sponsors",
    description: "Offre découverte, Territorial 49 € ou National Pro 99 € — performance suivie.",
    accent: "from-blue-600/30 to-blue-900/10",
  },
  {
    id: "family",
    title: "Famille & mineurs",
    tagline: "Sécurité",
    description: "Espace jeunes, contrôle parental et portail tuteur — foot en confiance.",
    accent: "from-emerald-600/30 to-emerald-900/10",
  },
  {
    id: "tournaments",
    title: "Tournois Arena",
    tagline: "Compétition",
    description: "Création, inscriptions, tableaux et palmarès — votre saison compétitive.",
    accent: "from-amber-600/30 to-amber-900/10",
  },
  {
    id: "auth",
    title: "Accueil vidéo",
    tagline: "Signature",
    description: "Séquence de bienvenue à la connexion — une première impression soignée.",
    accent: "from-rose-600/30 to-rose-900/10",
  },
] as const;

export type ProductLineWeb = "homme" | "woman" | "amateur" | "supporter" | "pro" | "sante";

export const UNIVERSE_LOGOS: Record<ProductLineWeb, string> = {
  homme: "/branding/logo-man-picto.png",
  woman: "/branding/logo-woman-picto.png",
  amateur: "/branding/logo-amateur-picto.png",
  supporter: "/branding/logo-supporter-picto.png",
  pro: "/branding/logo-pro-picto.png",
  sante: "/branding/logo-sante-picto.png",
};

export const HOMME_BRAND = {
  name: "Pro Day Man",
  shortName: "Man",
  fullName: "Pro Day Man",
  logo: UNIVERSE_LOGOS.homme,
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "Le foot masculin amateur : Mercato M, matchs, Arena, Visibilité, CV joueur, covoiturage, pôle santé et Shop — réservé aux joueurs.",
  accent: "#0A0A0A",
  accentDark: "#262626",
} as const;

export const AMATEUR_BRAND = {
  name: "Pro Day Amateur",
  shortName: "Amateur",
  fullName: "Pro Day Amateur",
  logo: UNIVERSE_LOGOS.amateur,
  tagline: "JOUER • ENCADRER • PARTAGER",
  mission:
    "Joueurs et coachs amateur — Mercato local, matchs, effectif et convocations. Distinct du pôle Pro (staff professionnel).",
  accent: "#EA580C",
  accentDark: "#9A3412",
} as const;

export const SUPPORTER_BRAND = {
  name: "Pro Day Supporter",
  shortName: "Supporter",
  fullName: "Pro Day Supporter",
  logo: UNIVERSE_LOGOS.supporter,
  tagline: "SUIVRE • VIBRER • PARTAGER",
  mission:
    "Tribune 100 % gratuite — matchs live (PRODAY + monde), suivis illimités, débats, réels et shop merch. Sans abonnement ni paywall.",
  accent: "#7C3AED",
  accentDark: "#5B21B6",
} as const;

export const PRO_BRAND = {
  name: "Pro Day Pro",
  shortName: "Pro",
  fullName: "Pro Day Pro",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "EXPERTISE • RÉSEAU • PERFORMANCE",
  mission:
    "Coach, agent, club recruteur et organisateur — Mercato Pro, scouting, convocations et réseau vérifié.",
  accent: "#1D4ED8",
  accentDark: "#1E3A8A",
} as const;

export const PRO_JOUEUR_BRAND = {
  name: "Pro Day Pro Joueur",
  shortName: "Pro Joueur",
  fullName: "Pro Day Pro Joueur",
  logo: UNIVERSE_LOGOS.homme,
  tagline: "CARRIÈRE • VISIBILITÉ • OPPORTUNITÉS",
  mission:
    "Joueur professionnel — carrière, portfolio scouting, essais et mandat agent. Stats validées par le coach staff.",
  accent: "#059669",
  accentDark: "#047857",
} as const;

export const PRO_CLUB_BRAND = {
  name: "Pro Day Pro Club",
  shortName: "Pro Club",
  fullName: "Pro Day Pro Club",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "STRUCTURE • ÉQUIPES • RECRUTEMENT",
  mission:
    "Président, directeur sportif et secrétariat — arbre des équipes, adhésions, annonces recrutement et vitrine club.",
  accent: "#1D4ED8",
  accentDark: "#1E3A8A",
} as const;

export const PRO_STAFF_BRAND = {
  name: "Pro Day Pro Staff",
  shortName: "Pro Staff",
  fullName: "Pro Day Pro Staff",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "MÉTIERS • MANDATS • SCOUTING",
  mission:
    "Agent, recruteur, coach pro et organisateur — Mercato Pro, shortlists, convocations groupe et tournois Arena.",
  accent: "#4F46E5",
  accentDark: "#3730A3",
} as const;

/** Message waitlist / page beta */
export const BETA_PITCH = {
  summary:
    "Inscrivez-vous sur la liste d'attente pour suivre l'avancement du produit et accéder en priorité au lancement.",
  dailyUpdates:
    "Les inscrits reçoivent des nouvelles régulières sur le déploiement de l'application.",
  launch:
    "Notification dès la disponibilité sur iOS et Android.",
} as const;

export const MODULES = [
  {
    id: "mercato",
    title: "Mercato",
    subtitle: "Recrutement intelligent",
    description:
      "Annonces ciblées par poste, niveau et ville. Candidature depuis l'app, suivi des réponses.",
    image: "/showcase/classic-mercato.jpg",
    color: "#0A0A0A",
  },
  {
    id: "matchs",
    title: "Matchs",
    subtitle: "Amicaux & détections",
    description:
      "Proposez ou acceptez un match. Calendrier unifié avec convocations et RSVP.",
    image: "/images/football-match-01.jpg",
    color: "#262626",
  },
  {
    id: "arena",
    title: "Arena",
    subtitle: "Tournois locaux",
    description:
      "Inscriptions club, tableaux et palmarès publiés — votre saison compétitive.",
    image: "/showcase/classic-arena.jpg",
    color: "#404040",
  },
  {
    id: "pulse",
    title: "Visibilité ProDay",
    subtitle: "Score de visibilité",
    description:
      "Profil, activité et confiance combinés — signature exclusive de la plateforme.",
    image: "/showcase/classic-exp-pulse.jpg",
    color: "#525252",
  },
  {
    id: "carpool",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Coachs et joueurs proposent ou réservent des places — intégré aux événements et convocations.",
    image: "/images/football-pitch-01.jpg",
    color: "#737373",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Kiné, mental, nutrition",
    description:
      "Annuaire praticiens vérifiés — kinés, coach mental, nutritionnistes. Contact sécurisé joueur ↔ pro.",
    image: "/images/football-health-01.jpg",
    color: "#64748b",
  },
  {
    id: "shop",
    title: "ProDay Shop",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots officiels par univers — précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
    color: "#57534e",
  },
  {
    id: "feed",
    title: "Fil",
    subtitle: "Communauté & question hebdo",
    description:
      "Publications clubs et joueurs, réactions et question de la semaine — au rythme de la saison.",
    image: "/showcase/classic-exp-discover.jpg",
    color: "#6366f1",
  },
  {
    id: "reels",
    title: "Reels",
    subtitle: "Vidéos courtes foot",
    description:
      "Moments forts en format vertical — découverte et visibilité pour votre profil.",
    image: "/images/football-action-01.jpg",
    color: "#7c3aed",
  },
  {
    id: "sponsors",
    title: "Sponsors",
    subtitle: "Partenaires & financement",
    description:
      "Annuaire partenaires, offres équipement ou visibilité et soutien aux campagnes clubs.",
    image: "/showcase/classic-exp-sponsors.jpg",
    color: "#1d4ed8",
  },
] as const;

export const PILLARS = [
  {
    id: "unified",
    title: "Plateforme unifiée",
    subtitle: "Une seule app",
    description:
      "Carrière, club, convocations, matchs et tournois — tout au même endroit.",
  },
  {
    id: "trust",
    title: "Confiance ProDay",
    subtitle: "Staff certifié",
    description:
      "Diplômes validés avant messagerie complète. Contrôle parental pour les mineurs.",
  },
  {
    id: "cv",
    title: "CV vivant",
    subtitle: "Stats vers PDF",
    description:
      "Chaque match nourrit votre profil. Export professionnel en un geste.",
  },
  {
    id: "live",
    title: "Live Stats",
    subtitle: "Match vers profil",
    description:
      "Buts, passes, cartons en direct — votre saison et votre CV se mettent à jour.",
  },
  {
    id: "feed",
    title: "Fil communauté",
    subtitle: "Question hebdo",
    description:
      "Publications, réactions et question de la semaine — restez connectés au terrain.",
  },
  {
    id: "reels",
    title: "Reels",
    subtitle: "Vidéos courtes",
    description:
      "Moments forts en vertical — visibilité pour joueurs et clubs.",
  },
  {
    id: "sponsors",
    title: "Espace partenaires",
    subtitle: "Sponsors & offres",
    description:
      "Marques locales et nationales — visibilité clubs, financement et résultats mesurés.",
  },
] as const;

export const JOURNEYS = [
  {
    id: "player",
    role: "Joueur",
    steps: [
      "Profil & Visibilité",
      "CV en ligne éditable",
      "Stats & galerie",
      "Mercato & candidatures",
      "Matchs & Arena",
    ],
  },
  {
    id: "coach",
    role: "Coach",
    steps: [
      "Vérification diplôme",
      "Gestion effectif",
      "Annonces & détections",
      "Convocations & Live Stats",
    ],
  },
  {
    id: "recruiter",
    role: "Recruteur",
    steps: [
      "Profil recruteur vérifié",
      "Territoire & spécialité",
      "Annonces Mercato Pro",
      "Pipeline candidatures",
    ],
  },
  {
    id: "agent",
    role: "Agent",
    steps: [
      "Profil agent vérifié",
      "Repérage & mandats",
      "Contacts clubs & joueurs",
      "Pipeline mandats",
    ],
  },
  {
    id: "club",
    role: "Club",
    steps: [
      "Profil club & équipes",
      "Annonces Mercato actives",
      "Candidatures & exports",
      "Convocations & effectif",
    ],
  },
  {
    id: "medical",
    role: "Pôle santé",
    steps: [
      "Spécialité (kiné, coach mental…)",
      "Zone & diplômes",
      "Visibilité près des clubs",
      "Messagerie après vérif.",
    ],
  },
  {
    id: "organizer",
    role: "Organisateur",
    steps: [
      "Créer un tournoi Arena",
      "Gérer les inscriptions",
      "Publier le palmarès",
      "Visibilité sponsors",
    ],
  },
  {
    id: "parent",
    role: "Parent",
    steps: [
      "Supervision du compte",
      "Contacts approuvés",
      "Limite de temps",
      "Rapport d'activité",
    ],
  },
  {
    id: "supporter",
    role: "Supporter",
    steps: [
      "Profil supporter",
      "Clubs favoris",
      "Matchs & live",
      "Reels & fil communautaire",
      "Messagerie tribune",
    ],
  },
  {
    id: "sponsor",
    role: "Partenaire",
    steps: [
      "Profil sponsor vérifié",
      "Offres & campagnes locales",
      "Visibilité onglet Sponsors",
      "Statistiques conversions et impressions",
    ],
  },
] as const;

export function mercatoTabLabelForWeb(line: ProductLineWeb = "homme"): string {
  if (line === "woman") return "Mercato F";
  if (line === "amateur") return "Mercato Amateur";
  if (line === "supporter") return "Communauté";
  if (line === "pro") return "Mercato Pro";
  if (line === "sante") return "Cabinet";
  return "Candidater";
}

/** Ids alignés sur l'app (`mainTabConfig`) — voir `appTabs.ts` pour la visibilité par univers. */
export const TABS = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "recrutement", label: "Candidater", icon: "search" },
  { id: "matchs", label: "Matchs", icon: "handshake" },
  { id: "reels", label: "Reels", icon: "video" },
  { id: "feed", label: "Fil", icon: "sparkles" },
  { id: "covoiturage", label: "Covoit.", icon: "car" },
  { id: "sante", label: "Santé", icon: "heart" },
  { id: "messages", label: "Messages", icon: "message" },
  { id: "profil", label: "Profil", icon: "user" },
] as const;

export const VERIFICATION_STEPS = [
  { id: 1, label: "Document reçu", status: "done" },
  { id: 2, label: "Authenticité", status: "done" },
  { id: 3, label: "Établissement", status: "active" },
  { id: 4, label: "Badge vérifié", status: "pending" },
] as const;

export const STATS = [
  { value: "9+", label: "Onglets dynamiques", note: "Architecture produit" },
  { value: "12", label: "Piliers produit", note: "Modules illustratifs" },
  { value: "3", label: "Univers Man · Woman · Pro", note: "Offre éditoriale" },
  { value: "3", label: "Formules partenaires", note: "Grille tarifaire" },
] as const;

/** Bandeau légal — chiffres marketing, pas des métriques live */
export const STATS_DISCLAIMER =
  "Chiffres illustratifs décrivant l’architecture produit — pas des statistiques d’usage en temps réel.";

export const SANTE_BRAND = {
  name: "Pro Day Santé",
  shortName: "Santé",
  fullName: "Pro Day Santé",
  logo: UNIVERSE_LOGOS.sante,
  tagline: "SOIGNER • ACCOMPAGNER • PERFORMER",
  mission:
    "Kinés, coach mental et staff médical — annuaire, agenda, téléconsultation sécurisée (partenaire HDS) et vidéos éducatives.",
  accent: "#0F766E",
  accentDark: "#134E4A",
} as const;

export const WOMAN_BRAND = {
  name: "ProDay Woman",
  shortName: "Woman",
  fullName: "ProDay Woman",
  logo: UNIVERSE_LOGOS.woman,
  tagline: "JOUER • BRILLER • GRANDIR",
  mission:
    "Le foot au féminin : Mercato F, matchs, Arena, Visibilité, CV joueuse, covoiturage, pôle santé et Shop — réservé aux joueuses.",
  accent: "#BE185D",
  accentDark: "#831843",
} as const;

export type UniverseBrand =
  | typeof HOMME_BRAND
  | typeof WOMAN_BRAND
  | typeof AMATEUR_BRAND
  | typeof SUPPORTER_BRAND
  | typeof PRO_BRAND
  | typeof SANTE_BRAND;

export const BRANDS_BY_LINE: Record<ProductLineWeb, UniverseBrand> = {
  homme: HOMME_BRAND,
  woman: WOMAN_BRAND,
  amateur: AMATEUR_BRAND,
  supporter: SUPPORTER_BRAND,
  pro: PRO_BRAND,
  sante: SANTE_BRAND,
};

/** Modules exclusifs Pro Day Man — joueurs foot masculin. */
export const MAN_MODULES = [
  {
    id: "mercato-m",
    title: "Mercato M",
    subtitle: "Recrutement masculin",
    description:
      "Annonces par poste, niveau et ville. Candidature depuis l'app, suivi des réponses sur le Mercato M.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "matchs",
    title: "Matchs",
    subtitle: "Amicaux & convocations",
    description:
      "Proposez ou acceptez un match. Calendrier unifié avec convocations et RSVP pour votre équipe.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "arena",
    title: "Arena",
    subtitle: "Tournois locaux",
    description:
      "Inscriptions, tableaux et palmarès — votre saison compétitive amateur au masculin.",
    image: "/showcase/classic-arena.jpg",
  },
  {
    id: "pulse-cv",
    title: "Visibilité & CV",
    subtitle: "Visibilité joueur",
    description:
      "Score Visibilité, stats saison, galerie et CV en ligne éditable — votre vitrine sur le Mercato M.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
  {
    id: "carpool",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Proposez ou réservez une place pour matchs et détections — intégré aux événements Man.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés — contact sécurisé joueur ↔ pro depuis l'app Man.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "shop",
    title: "ProDay Shop Man",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo Pro Day Man — précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
  },
] as const;

export const WOMAN_MODULES = [
  {
    id: "mercato-f",
    title: "Mercato F",
    subtitle: "Annonces féminines",
    description:
      "Joueuses et clubs F — filtres poste, niveau, ville. Visibilité sur le football féminin.",
    image: "/showcase/woman/woman-mercato.jpg",
  },
  {
    id: "matchs-f",
    title: "Matchs & convocations",
    subtitle: "Amicaux F",
    description:
      "Proposez ou acceptez un match. RSVP et relances pour vos équipes féminines.",
    image: "/showcase/woman/woman-match.jpg",
  },
  {
    id: "arena-f",
    title: "Arena",
    subtitle: "Tournois filles & F",
    description:
      "Inscriptions, tableaux et palmarès — tournois locaux dédiés au foot féminin.",
    image: "/showcase/woman/woman-arena.jpg",
  },
  {
    id: "profil-f",
    title: "Profil joueuse",
    subtitle: "Visibilité & CV en ligne",
    description:
      "Stats saison, galerie et CV joueuse éditable — votre vitrine sportive au féminin.",
    image: "/showcase/woman/woman-profile.jpg",
  },
  {
    id: "carpool-f",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Proposez ou réservez une place pour matchs et détections — intégré aux événements Woman.",
    image: "/images/football-women-01.jpg",
  },
  {
    id: "health-f",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés — contact sécurisé joueuse ↔ pro depuis l'app Woman.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "shop-f",
    title: "ProDay Shop Woman",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo ProDay Woman — précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
  },
] as const;

export const PRODUCT_LINES = [
  {
    id: "homme" as const,
    brand: HOMME_BRAND,
    logo: UNIVERSE_LOGOS.homme,
    href: "/homme",
    image: "/showcase/classic-discover-hero.jpg",
    cta: "Pro Day Man",
  },
  {
    id: "woman" as const,
    brand: WOMAN_BRAND,
    logo: UNIVERSE_LOGOS.woman,
    href: "/woman",
    image: "/showcase/woman/woman-discover-hero.jpg",
    cta: "ProDay Woman",
  },
  {
    id: "amateur" as const,
    brand: AMATEUR_BRAND,
    logo: UNIVERSE_LOGOS.amateur,
    href: "/amateur",
    image: "/images/football-amateur-01.jpg",
    cta: "Pro Day Amateur",
  },
  {
    id: "supporter" as const,
    brand: SUPPORTER_BRAND,
    logo: UNIVERSE_LOGOS.supporter,
    href: "/supporter",
    image: "/images/football-supporter-01.jpg",
    cta: "Pro Day Supporter",
  },
  {
    id: "pro" as const,
    brand: PRO_BRAND,
    logo: UNIVERSE_LOGOS.pro,
    href: "/pro",
    image: "/images/football-pro-01.jpg",
    cta: "Pro Day Pro",
  },
] as const;

export type UniverseModule = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
};

export const PRO_MODULES = [
  {
    id: "recruiter",
    title: "Recruteur Pro",
    subtitle: "Scouting & Mercato",
    description:
      "Profil recruteur vérifié, annonces Mercato Pro, pipeline candidatures et covoiturage détections.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "coach",
    title: "Coach Pro",
    subtitle: "Effectifs & recrutement",
    description:
      "Profil staff vérifié, annonces Mercato, convocations et stats candidatures — multi-équipes.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "agent",
    title: "Agent Elite",
    subtitle: "Mandats & repérage",
    description:
      "CRM joueurs, alertes géolocalisées, pipeline mandats et contacts clubs.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "sante",
    title: "Pôle santé",
    subtitle: "Kiné, mental, nutrition",
    description:
      "Visibilité près des clubs, messagerie après validation — coach mental inclus.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "reseau",
    title: "Réseau Pro",
    subtitle: "Messagerie sécurisée",
    description:
      "Contacts vérifiés entre staff, agents et structures — fini les échanges non tracés.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "sponsor",
    title: "Espace Partenaires",
    subtitle: "Visibilité & financement",
    description:
      "Offres sponsors, campagnes locales et tableau de bord partenaires — accessibles depuis le module Sponsors de l'Accueil (pas un onglet barre).",
    image: "/images/football-club-01.jpg",
  },
] as const;

export const PRO_JOUEUR_MODULES = [
  {
    id: "carriere",
    title: "Carrière",
    subtitle: "Contrat & timeline",
    description:
      "Jours avant fin de contrat, consultations profil, essais à venir et messages agent.",
    image: "/images/football-pro-01.jpg",
  },
  {
    id: "opportunites",
    title: "Opportunités",
    subtitle: "Essais & détections",
    description:
      "Offres correspondant au poste et au niveau — pas le Mercato amateur.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    subtitle: "Stats & vidéos",
    description:
      "Vidéos taguées par match, stats saison badge « Validé coach » et export PDF scouting.",
    image: "/showcase/classic-profile.jpg",
  },
  {
    id: "groupe",
    title: "Groupe",
    subtitle: "Convocations staff",
    description:
      "Entraînements et matchs officiels — transport groupe, sans gestion compo.",
    image: "/images/football-team-01.jpg",
  },
  {
    id: "pulse-pro",
    title: "Visibilité (dans Accueil Carrière)",
    subtitle: "Visibilité scouting",
    description:
      "Score de visibilité sur l'onglet Accueil Carrière — pas un onglet séparé. Profil, activité et confiance pour attirer les recruteurs.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
  {
    id: "shop-pro-joueur",
    title: "Shop",
    subtitle: "Boutique joueur",
    description:
      "Équipement et merch accessibles depuis l'onglet Shop — même boutique ProDay que les supporters et amateurs.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "sponsors-pro-joueur",
    title: "Sponsors",
    subtitle: "Module Accueil",
    description:
      "Partenariats et offres marques — via le module Sponsors de l'Accueil Carrière, pas via un onglet de la barre.",
    image: "/images/football-club-01.jpg",
  },
] as const;

export const PRO_CLUB_MODULES = [
  {
    id: "structure",
    title: "Structure",
    subtitle: "Arbre des équipes",
    description:
      "U13, U17, Seniors F… — effectifs, coachs affectés et staff club en un coup d'œil.",
    image: "/images/football-club-01.jpg",
  },
  {
    id: "recrutement-club",
    title: "Recrutement",
    subtitle: "Annonces & candidatures",
    description:
      "Publiez « Cherche gardien U17 F », recevez candidatures et shortlist locale.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "calendrier-club",
    title: "Calendrier",
    subtitle: "Saison multi-équipes",
    description:
      "Vue agrégée des matchs et entraînements — lecture seule sur les feuilles coach.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "communication-club",
    title: "Communication",
    subtitle: "Annonces & effectif",
    description:
      "Messages structure, validation adhésions et annonces internes.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "vitrine-club",
    title: "Vitrine",
    subtitle: "Page publique club",
    description:
      "Logo, palmarès, catégories gérées — visible supporters et recruteurs.",
    image: "/images/football-stadium-night-01.jpg",
  },
] as const;

export const PRO_STAFF_MODULES = [
  {
    id: "recruiter",
    title: "Recruteur Pro",
    subtitle: "Scouting & Mercato",
    description:
      "Profil recruteur vérifié, annonces Mercato Pro, pipeline candidatures et covoiturage détections.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "coach",
    title: "Coach Pro",
    subtitle: "Effectifs & recrutement",
    description:
      "Profil staff vérifié, annonces Mercato, convocations et stats candidatures — multi-équipes.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "agent",
    title: "Agent Elite",
    subtitle: "Mandats & repérage",
    description:
      "CRM joueurs, alertes géolocalisées, pipeline mandats et contacts clubs.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "organizer",
    title: "Organisateur",
    subtitle: "Tournois Arena",
    description:
      "Création tournoi, inscriptions, poules, scores et classements automatiques.",
    image: "/showcase/classic-arena.jpg",
  },
  {
    id: "reseau",
    title: "Réseau Pro",
    subtitle: "Messagerie sécurisée",
    description:
      "Contacts vérifiés entre staff, agents et structures — fini les échanges non tracés.",
    image: "/showcase/classic-exp-messages.jpg",
  },
] as const;

export const AMATEUR_MODULES = [
  {
    id: "joueur-amateur",
    title: "Joueur amateur",
    subtitle: "CV & Mercato local",
    description:
      "Profil joueur, CV foot en ligne, candidatures Mercato Amateur et convocations — foot M ou F via l'espace choisi.",
    image: "/showcase/classic-profile.jpg",
  },
  {
    id: "coach-amateur",
    title: "Coach amateur",
    subtitle: "Effectif & convocations",
    description:
      "Profil coach vérifié, gestion d'effectif, convocations et stats saison — district et régional.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "mercato-amateur",
    title: "Mercato Amateur",
    subtitle: "Recrutement local",
    description:
      "Annonces Mercato local, candidatures joueurs et suivi des réponses — sans la complexité du Mercato Pro.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "matchs-amateur",
    title: "Matchs",
    subtitle: "Convocations équipe",
    description:
      "Calendrier unifié, RSVP joueurs et covoiturage pour vos matchs de championnat ou amicaux.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "reseau-amateur",
    title: "Réseau local",
    subtitle: "Messagerie sécurisée",
    description:
      "Contacts vérifiés avec joueurs, clubs et coachs de votre zone — fini les groupes WhatsApp éparpillés.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "shop-amateur",
    title: "Shop",
    subtitle: "Équipement & merch",
    description:
      "Boutique ProDay — maillots, entraînement et goodies, accessible depuis l'onglet Shop de l'app.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "sponsors-amateur",
    title: "Sponsors",
    subtitle: "Module Accueil",
    description:
      "Offres partenaires et financement — accessibles depuis le module Sponsors de l'Accueil (pas un onglet de la barre).",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "pulse-amateur",
    title: "Visibilité (dans l'Accueil)",
    subtitle: "Score de visibilité",
    description:
      "Visibilité n'est pas un onglet : c'est votre score de visibilité affiché sur l'Accueil Équipe, à côté de votre saison.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
] as const;

export const SUPPORTER_MODULES = [
  {
    id: "matchs-supporter",
    title: "Matchs live",
    subtitle: "PRODAY & monde",
    description:
      "Scores en direct via API-Football, filtres H/F/mixte et calendrier — votre tribune numérique.",
    image: "/images/football-fans-01.jpg",
  },
  {
    id: "suivis-supporter",
    title: "Suivis",
    subtitle: "Clubs · joueurs · tournois",
    description:
      "Suivez sans limite vos clubs, joueurs et tournois favoris — alertes opt-in depuis le profil.",
    image: "/images/football-supporter-01.jpg",
  },
  {
    id: "debats-supporter",
    title: "Débats & fil",
    subtitle: "Communauté",
    description:
      "Publications, réactions, débats autour des matchs et question hebdo — 100 % gratuit.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "reels-supporter",
    title: "Moments & shop",
    subtitle: "Réels & merch",
    description:
      "Vidéos courtes des clubs suivis et boutique merch — sans abonnement store.",
    image: "/images/football-action-01.jpg",
  },
] as const;

export const UNIVERSE_PAGE_CONFIG = {
  homme: {
    line: "homme" as const,
    brand: HOMME_BRAND,
    hero: {
      title: "Le foot masculin amateur.",
      image: "/showcase/classic-discover-hero.jpg",
    },
    highlights: [
      { label: "Public", value: "Joueurs M" },
      { label: "Mercato", value: "Mercato M" },
      { label: "Saison", value: "Matchs & Arena" },
      { label: "Visibilité", value: "Visibilité & CV" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato M, matchs, Arena, Visibilité, covoiturage, pôle santé et Shop — pensé pour les joueurs.",
    modules: MAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Même pôle Amateur pour joueurs et coachs. Coach ou staff pro ? Direction Pro Day Pro.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueur",
    cta: {
      title: "Créez votre compte Man",
      description:
        "Inscription joueur en quelques minutes — Mercato M, CV en ligne et convocations.",
      beta: "Liste d'attente Man",
    },
  },
  woman: {
    line: "woman" as const,
    brand: WOMAN_BRAND,
    hero: {
      title: "Le foot au féminin.",
      image: "/showcase/woman/woman-discover-hero.jpg",
    },
    highlights: [
      { label: "Public", value: "Joueuses F" },
      { label: "Mercato", value: "Mercato F" },
      { label: "Saison", value: "Matchs & Arena" },
      { label: "Visibilité", value: "Visibilité & CV F" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato F, matchs, Arena, Visibilité, covoiturage, pôle santé et Shop — pensé pour les joueuses.",
    modules: WOMAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Même pôle Amateur pour joueuses et coachs F. Staff pro ou club ? L'univers Pro Day Pro.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueuse",
    cta: {
      title: "Créez votre compte Woman",
      description:
        "Inscription joueuse en quelques minutes — visibilité sur le Mercato F et votre CV en ligne.",
      beta: "Liste d'attente Woman",
    },
  },
  amateur: {
    line: "amateur" as const,
    brand: AMATEUR_BRAND,
    hero: {
      title: "Le foot amateur.",
      image: "/images/football-amateur-01.jpg",
    },
    highlights: [
      { label: "Public", value: "Joueurs & coachs" },
      { label: "Mercato", value: "Mercato Amateur" },
      { label: "Saison", value: "Matchs & effectif" },
      { label: "Zone", value: "District & régional" },
    ],
    modulesTitle: "Foot amateur connecté",
    modulesSubtitle:
      "Joueurs et coachs amateur — Mercato local, matchs, effectif et messagerie, distinct du pôle Pro.",
    modules: AMATEUR_MODULES as readonly UniverseModule[],
    journeyIds: ["player", "coach"] as const,
    audienceNote:
      "Foot M ou F ? Choisissez votre espace à l'inscription. Staff professionnel ? Direction Pro Day Pro.",
    showPulse: true,
    showVerification: true,
    pricingPlanIds: ["player_plus", "coach_pro"] as const,
    pricingTitle: "Formules amateur",
    cta: {
      title: "Créez votre compte Amateur",
      description:
        "Joueur ou coach amateur — inscription en quelques minutes, validation pour les coachs.",
      beta: "Liste d'attente Amateur",
    },
  },
  supporter: {
    line: "supporter" as const,
    brand: SUPPORTER_BRAND,
    hero: {
      title: "Le foot, ensemble.",
      image: "/images/football-fans-01.jpg",
    },
    highlights: [
      { label: "Tarif", value: "100 % gratuit" },
      { label: "Live", value: "Matchs PRODAY + monde" },
      { label: "Suivis", value: "Illimités" },
      { label: "Communauté", value: "Fil & débats" },
    ],
    modulesTitle: "Tribune numérique gratuite",
    modulesSubtitle:
      "Supporters — live scores, suivis, débats, réels et shop merch. Sans Mercato ni abonnement store.",
    modules: SUPPORTER_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Joueur ou coach ? Direction Amateur ou Pro. Partenaire commercial ? Direction Partenaires.",
    showPulse: false,
    showVerification: false,
    pricingPlanIds: [] as const,
    pricingTitle: "Tribune 100 % gratuite",
    cta: {
      title: "Créez votre compte Supporter",
      description:
        "Inscription supporter gratuite — matchs live, suivis illimités, débats et shop merch.",
      beta: "Liste d'attente Supporter",
    },
  },
  pro: {
    line: "pro" as const,
    brand: PRO_BRAND,
    hero: {
      title: "Les pros du foot.",
      image: "/images/football-pro-01.jpg",
    },
    highlights: [
      { label: "Rôles", value: "7 profils pro" },
      { label: "Mercato", value: "Mercato Pro" },
      { label: "Confiance", value: "Profils vérifiés" },
      { label: "Réseau", value: "Messagerie sécurisée" },
    ],
    modulesTitle: "Modules professionnels",
    modulesSubtitle:
      "Recruteur, coach, agent, club et organisateur — Mercato Pro et pipeline candidatures.",
    modules: PRO_MODULES as readonly UniverseModule[],
    journeyIds: [
      "coach",
      "recruiter",
      "agent",
      "club",
      "organizer",
    ] as const,
    audienceNote:
      "Joueur pro ? Direction Pro Joueur. Structure club ? Pro Club. Staff métier ? Pro Staff.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: [
      "recruiter_pro",
      "coach_pro",
      "club_pro",
      "agent_elite",
      "organizer_pro",
    ] as const,
    pricingTitle: "Formules Pro",
    cta: {
      title: "Créez votre compte Pro",
      description:
        "Recruteur, coach, agent, club ou organisateur — validation métier incluse.",
      beta: "Liste d'attente Pro",
    },
  },
  pro_joueur: {
    line: "pro" as const,
    brand: PRO_JOUEUR_BRAND,
    hero: {
      title: "Ta carrière, ta visibilité.",
      image: "/images/football-action-01.jpg",
    },
    highlights: [
      { label: "Public", value: "Joueurs pro" },
      { label: "Carrière", value: "Contrat & essais" },
      { label: "Portfolio", value: "Stats validées coach" },
      { label: "Visibilité", value: "Visibilité & scouting" },
    ],
    modulesTitle: "Coque joueur professionnel",
    modulesSubtitle:
      "Carrière, opportunités, portfolio et groupe — distinct du foot amateur et du pôle club.",
    modules: PRO_JOUEUR_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Foot amateur district ? Direction pôle Amateur. Agent ou recruteur ? Direction Pro Staff.",
    showPulse: true,
    showVerification: true,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Formule Pro Joueur",
    cta: {
      title: "Créez votre compte Pro Joueur",
      description:
        "Inscription joueur pro — portfolio scouting, alertes intérêt clubs et mandat agent.",
      beta: "Liste d'attente Pro Joueur",
    },
  },
  pro_club: {
    line: "pro" as const,
    brand: PRO_CLUB_BRAND,
    hero: {
      title: "Ta structure, tes équipes.",
      image: "/images/football-club-01.jpg",
    },
    highlights: [
      { label: "Public", value: "Clubs & DS" },
      { label: "Structure", value: "Multi-équipes" },
      { label: "Recrutement", value: "Annonces actives" },
      { label: "Vitrine", value: "Page publique" },
    ],
    modulesTitle: "Gestion de structure",
    modulesSubtitle:
      "Président et staff administratif — équipes, adhésions validées et recrutement local.",
    modules: PRO_CLUB_MODULES as readonly UniverseModule[],
    journeyIds: ["club"] as const,
    audienceNote:
      "Joueur ou coach d'une équipe ? Ils utilisent Pro Joueur ou Amateur. Staff métier ? Pro Staff.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: ["club_pro"] as const,
    pricingTitle: "Formule Pro Club",
    cta: {
      title: "Créez votre compte Pro Club",
      description:
        "Structure officielle — validation mandat FFF, multi-équipes et annonces recrutement.",
      beta: "Liste d'attente Pro Club",
    },
  },
  pro_staff: {
    line: "pro" as const,
    brand: PRO_STAFF_BRAND,
    hero: {
      title: "Ton métier du foot pro.",
      image: "/showcase/classic-staff.jpg",
    },
    highlights: [
      { label: "Métiers", value: "4 profils staff" },
      { label: "Mercato", value: "Mercato Pro" },
      { label: "Mandats", value: "Agent & scouting" },
      { label: "Réseau", value: "Messagerie vérifiée" },
    ],
    modulesTitle: "Outils staff professionnel",
    modulesSubtitle:
      "Agent, recruteur, coach pro et organisateur — chaque métier a sa coque et ses quotas.",
    modules: PRO_STAFF_MODULES as readonly UniverseModule[],
    journeyIds: ["coach", "recruiter", "agent", "organizer"] as const,
    audienceNote:
      "Joueur pro ? Pro Joueur. Président de club ? Pro Club. Partenaire commercial ? Partenaires.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: [
      "recruiter_pro",
      "coach_pro",
      "agent_elite",
      "organizer_pro",
    ] as const,
    pricingTitle: "Formules Pro Staff",
    cta: {
      title: "Créez votre compte Pro Staff",
      description:
        "Agent, recruteur, coach pro ou organisateur — validation diplôme ou licence incluse.",
      beta: "Liste d'attente Pro Staff",
    },
  },
} as const;

export type UniversePageId = keyof typeof UNIVERSE_PAGE_CONFIG;

export const VISION_PILLARS = [
  {
    title: "Mission",
    body: "Connecter • Progresser • Réussir — donner à chaque acteur du foot amateur les outils du haut niveau, sans surestimer l'IA.",
  },
  {
    title: "Aujourd'hui",
    body: "Profil, Mercato, score carrière, journal d'activités, analyse IA des highlights, sponsors, Arena, admin et contrôle parental — dans une app React Native / Expo.",
  },
  {
    title: "IA honnête",
    body: "L'analyse Mistral porte sur vos séances enregistrées (highlight vidéo ou image + contexte). Ce n'est pas une détection automatique sur chaque geste en match.",
  },
  {
    title: "Demain",
    body: "Frame-by-frame avancé, repérage talent mondial automatisé, paiements tournois — voir la page Vision et la roadmap pour le détail.",
  },
] as const;

export const ALL_PILLARS = [
  ...PILLARS,
  {
    id: "pulse-pillar",
    title: "Visibilité ProDay",
    subtitle: "Score de visibilité",
    description:
      "Indicateur exclusif : profil, activité et confiance pour vous démarquer.",
  },
  {
    id: "recruit-pillar",
    title: "Mercato intelligent",
    subtitle: "Filtres & candidatures",
    description:
      "Annonces ciblées, candidature depuis l'app, suivi des réponses — pour joueurs et clubs.",
  },
  {
    id: "matches-pillar",
    title: "Matchs & Arena",
    subtitle: "Saison complète",
    description:
      "Matchs amicaux, tournois locaux, détections et palmarès intégrés au calendrier.",
  },
  {
    id: "calendar-pillar",
    title: "Convocations ProDay",
    subtitle: "RSVP & relances",
    description:
      "Présent, absent, peut-être — avec relances et composition d'équipe.",
  },
  {
    id: "carpool-pillar",
    title: "Covoiturage",
    subtitle: "Trajets partagés",
    description:
      "Proposez ou réservez une place pour matchs et détections — coachs et joueurs.",
  },
  {
    id: "health-pillar",
    title: "Pôle santé",
    subtitle: "Kiné & coach mental",
    description:
      "Annuaire praticiens vérifiés — kinés, coach mental, nutrition. Messagerie sécurisée.",
  },
  {
    id: "shop-pillar",
    title: "ProDay Shop",
    subtitle: "Équipement officiel",
    description:
      "Trépieds, t-shirts et maillots par univers — précommande depuis l'app.",
  },
  {
    id: "feed-pillar",
    title: "Fil communauté",
    subtitle: "Question hebdo",
    description:
      "Publications clubs et joueurs, réactions et question de la semaine.",
  },
  {
    id: "reels-pillar",
    title: "Reels",
    subtitle: "Vidéos courtes",
    description:
      "Moments forts en format vertical — visibilité pour votre profil.",
  },
  {
    id: "sponsors-pillar",
    title: "Espace partenaires",
    subtitle: "Sponsors & offres",
    description:
      "Annuaire partenaires, campagnes locales et financement clubs — résultats mesurés.",
  },
  {
    id: "family-pillar",
    title: "Famille & mineurs",
    subtitle: "Espace sécurisé",
    description:
      "Contrôle parental, portail tuteur et espace jeunes — le foot en confiance pour les mineurs.",
  },
] as const;

export type SponsorPricingTierIdWeb = "starter" | "territorial" | "national";

export type SponsorPricingTierWeb = {
  id: SponsorPricingTierIdWeb;
  name: string;
  tagline: string;
  monthlyEur: number;
  yearlyEur: number;
  highlighted?: boolean;
  badge?: string;
  features: readonly string[];
  subscriptionTier?: "free" | "pro";
  ctaLabel: string;
};

export const SPONSOR_PRICING_INTRO = {
  title: "Espace Sponsors ProDay",
  subtitle:
    "Sponsor et partenaire : même profil sur ProDay. Touchez clubs, joueurs et organisateurs sur votre territoire — visibilité mesurable, sans intermédiaire.",
  footnote:
    "Tarifs HT · facturation mensuelle ou annuelle (−20 %) · résiliation à tout moment sur les formules en ligne.",
} as const;

export const SPONSOR_PRICING_TIERS: readonly SponsorPricingTierWeb[] = [
  {
    id: "starter",
    name: "Découverte",
    tagline: "Tester la visibilité locale",
    monthlyEur: 0,
    yearlyEur: 0,
    subscriptionTier: "free",
    ctaLabel: "Créer un compte gratuit",
    features: [
      "Profil sponsor vérifié",
      "1 offre active dans l'annuaire",
      "Zone géographique (ville)",
      "Messagerie clubs (limitée)",
      "Statistiques de base",
    ],
  },
  {
    id: "territorial",
    name: "Territorial",
    tagline: "Rayonner sur un département",
    monthlyEur: 49,
    yearlyEur: yearlyPriceFromMonthly(49),
    ctaLabel: "Demander un devis",
    features: [
      "Jusqu'à 5 offres actives",
      "Ciblage par département",
      "Prospects clubs recommandés",
      "Messagerie clubs illimitée",
      "Financement campagnes clubs",
      "Statistiques mensuelles détaillées",
    ],
  },
  {
    id: "national",
    name: "National Pro",
    tagline: "Visibilité maximale sur ProDay",
    monthlyEur: 99,
    yearlyEur: yearlyPriceFromMonthly(99),
    highlighted: true,
    badge: "Recommandé",
    subscriptionTier: "pro",
    ctaLabel: "Passer National Pro",
    features: [
      "Offres illimitées",
      "Logo mis en avant (onglet Sponsors)",
      "Campagnes locales ciblées",
      "Push géolocalisé local (bêta — opt-in joueurs)",
      "Account manager email",
      "Priorité support sponsors",
    ],
  },
];

export const SPONSOR_VALUE_PILLARS = [
  {
    icon: "people" as const,
    title: "Clubs qualifiés",
    body: "Accédez aux structures actives sur ProDay : convocations, Mercato, financement.",
  },
  {
    icon: "star-four-points" as const,
    title: "Visibilité mesurée",
    body: "Impressions, clics et conversions suivis depuis votre tableau de bord sponsor.",
  },
  {
    icon: "briefcase" as const,
    title: "Offres & financement",
    body: "Publiez équipement, visibilité ou soutien financier aux campagnes clubs.",
  },
] as const;

export const SPONSOR_PARTNER_CONTACT_EMAIL = "partenaires@proday.app";

export const SUBSCRIPTION_PLANS_WEB = [
  {
    id: "player_plus",
    label: "Joueur Plus",
    tagline: "CV en ligne, visibilité et Mercato",
    monthlyEur: 2.99,
    storeAvailable: true,
    universes: ["homme", "woman", "amateur"] as ProductLineWeb[],
    freeIncludes: [
      "Profil, Visibilité et CV en ligne",
      "Galerie et stats saison",
      "Mercato en lecture",
      "1 candidature / mois",
      "Calendrier et RSVP équipe",
    ],
    proIncludes: [
      "Candidatures Mercato illimitées",
      "Mise en avant dans les recherches",
      "Alertes nouvelles annonces",
      "Export PDF optionnel",
    ],
  },
  {
    id: "recruiter_pro",
    label: "Recruteur Pro",
    tagline: "Scouting, Mercato Pro et pipeline candidatures",
    monthlyEur: 7.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil recruteur vérifié",
      "Territoire & spécialité",
      "Mercato en lecture",
      "5 messages recrutement / mois",
    ],
    proIncludes: [
      "Annonces Mercato Pro actives",
      "Pipeline candidatures",
      "Messages recrutement illimités",
      "Statistiques scouting & candidatures",
    ],
  },
  {
    id: "coach_pro",
    label: "Coach Pro",
    tagline: "Recrutement et gestion multi-équipes",
    monthlyEur: 7.99,
    storeAvailable: true,
    universes: ["pro", "amateur"] as ProductLineWeb[],
    freeIncludes: [
      "Profil staff et vérification",
      "1 équipe liée",
      "5 messages recrutement / mois",
      "Annonces Mercato Pro en lecture",
    ],
    proIncludes: [
      "Équipes illimitées",
      "Messages recrutement illimités",
      "Annonces Mercato Pro actives",
      "Statistiques candidatures",
    ],
  },
  {
    id: "club_pro",
    label: "Club Pro",
    tagline: "Annonces et structure club",
    monthlyEur: 11.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil club et vérification",
      "1 équipe",
      "2 annonces Mercato Pro actives",
      "Gestion convocations (base)",
    ],
    proIncludes: [
      "Annonces actives illimitées",
      "Multi-équipes",
      "Priorité dans le fil Mercato Pro",
      "Exports candidatures",
    ],
  },
  {
    id: "agent_elite",
    label: "Agent Elite",
    tagline: "CRM joueurs, mandats et pipeline — formule premium",
    monthlyEur: 99.99,
    storeAvailable: true,
    premium: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil agent et vérification",
      "10 contacts recrutement / mois",
      "Mercato en lecture",
    ],
    proIncludes: [
      "Contacts illimités",
      "Alertes géolocalisées",
      "Pipeline mandats",
      "Exports et rapports",
    ],
  },
  {
    id: "physio_pro",
    label: "Pôle santé Pro",
    tagline: "Abonnement léger + visibilité clubs — commission sur les RDV",
    monthlyEur: 19.99,
    storeAvailable: true,
    commissionPercent: 10,
    commissionNote:
      "10 % sur chaque consultation réservée via ProDay (nutrition, coach mental, prépa…). Pas de commission sur les actes médicaux réglementés.",
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil praticien et vérification",
      "Spécialité et zone d'intervention",
      "Visibilité annuaire (base)",
      "Messagerie limitée",
    ],
    proIncludes: [
      "Visibilité prioritaire près des clubs",
      "Messagerie complète après vérif.",
      "Prise de rendez-vous via l'app",
      "Commission 10 % uniquement si RDV conclu",
    ],
  },
  {
    id: "organizer_pro",
    label: "Organisateur Pro",
    tagline: "Événements, détections et tournois Arena",
    monthlyEur: 14.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil organisateur vérifié",
      "Profil événements visible",
      "Détections publiées",
      "Calendrier local",
    ],
    proIncludes: [
      "Tournois Arena illimités",
      "Visibilité sponsors intégrée",
      "Relances participants",
      "Priorité fil événements",
    ],
  },
  {
    id: "sponsor_pro",
    label: "National Pro (partenaires)",
    tagline: "Formule premium — espace partenaires dédié",
    monthlyEur: 99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Formule Découverte (0 €) : profil vérifié",
      "1 offre active dans l'annuaire",
      "Zone géographique (ville)",
      "Messagerie clubs (limitée)",
    ],
    proIncludes: [
      "National Pro : offres illimitées",
      "Logo mis en avant (onglet Sponsors)",
      "Campagnes locales ciblées",
      "Espace partenaire dédié dans l'app",
      "Push géolocalisé local (bêta — opt-in joueurs)",
    ],
  },
] as const;

export type WebSubscriptionPlanBase = (typeof SUBSCRIPTION_PLANS_WEB)[number];
export type WebSubscriptionPlan = WebSubscriptionPlanBase & {
  yearlyEur: number;
};

function womanPlayerPlusPlan(
  plan: WebSubscriptionPlanBase,
): WebSubscriptionPlan {
  return {
    ...plan,
    yearlyEur: yearlyPriceFromMonthly(plan.monthlyEur),
    label: "Joueuse Plus",
    tagline: "CV joueuse, visibilité et Mercato F",
    freeIncludes: [
      "Profil, Visibilité et CV joueuse en ligne",
      "Galerie et stats saison",
      "Mercato F en lecture",
      "1 candidature Mercato F / mois",
      "Calendrier et RSVP équipe",
    ],
    proIncludes: [
      "Candidatures Mercato F illimitées",
      "Mise en avant dans les recherches",
      "Alertes nouvelles annonces Mercato F",
      "Export PDF optionnel",
    ],
  } as unknown as WebSubscriptionPlan;
}

export function plansForUniverse(line: ProductLineWeb): WebSubscriptionPlan[] {
  return SUBSCRIPTION_PLANS_WEB.filter((p) => p.universes.includes(line)).map(
    (p) => {
      if (line === "woman" && p.id === "player_plus") {
        return womanPlayerPlusPlan(p);
      }
      return {
        ...p,
        yearlyEur: yearlyPriceFromMonthly(p.monthlyEur),
      };
    },
  );
}

export function getWebPlanById(
  id: WebSubscriptionPlanBase["id"],
): WebSubscriptionPlan | null {
  const plan = SUBSCRIPTION_PLANS_WEB.find((p) => p.id === id);
  if (!plan) return null;
  return { ...plan, yearlyEur: yearlyPriceFromMonthly(plan.monthlyEur) };
}

export type WebSubscriptionPlanUnion = WebSubscriptionPlan;

export function isPremiumWebPlan(plan: WebSubscriptionPlan): boolean {
  return "premium" in plan && plan.premium === true;
}

export function webPlanMonthlyPrice(id: WebSubscriptionPlanBase["id"]): number {
  const plan = SUBSCRIPTION_PLANS_WEB.find((p) => p.id === id);
  if (!plan) throw new Error(`Plan inconnu : ${id}`);
  return plan.monthlyEur;
}

/** Tarif Pro Day Pro pour partenaire / sponsor — dérivé du plan store. */
export const PRO_ESSENTIAL_MONTHLY_EUR = webPlanMonthlyPrice("sponsor_pro");

/** Organisateur Arena — dérivé du plan store. */
export const ORGANIZER_PRO_MONTHLY_EUR = webPlanMonthlyPrice("organizer_pro");

/** Pôle santé — dérivé du plan store. */
export const PHYSIO_PRO_MONTHLY_EUR = webPlanMonthlyPrice("physio_pro");
export const PHYSIO_BOOKING_COMMISSION_PERCENT = 10;

const faqPricing = (planId: WebSubscriptionPlanBase["id"]) =>
  formatAnnualPricingLine(webPlanMonthlyPrice(planId));

export const FAQ_ITEMS = [
  {
    q: "ProDay remplace-t-il WhatsApp pour mon équipe ?",
    a: "ProDay unifie convocations, matchs, Mercato et stats — fini les groupes éparpillés. La messagerie reste pour les échanges directs entre profils inscrits.",
  },
  {
    q: "L'app est-elle gratuite ?",
    a: "Oui, un compte gratuit couvre profil, Visibilité, calendrier, Arena en consultation et limites Mercato. Les offres Pro débloquent candidatures illimitées, multi-équipes, etc.",
  },
  {
    q: "Comment fonctionne la vérification coach ?",
    a: "Diplôme ou licence obligatoire à l'inscription. Badge orange pendant la revue, badge vert après validation admin — messagerie complète débloquée.",
  },
  {
    q: "Qu'est-ce que la Visibilité ProDay ?",
    a: "Score de visibilité combinant profil, stats saison, candidatures et confiance. Plus elle monte, plus vous êtes visible des clubs.",
  },
  {
    q: "Qui peut publier sur le Mercato ?",
    a: "Les recruteurs ProDay : rôle Recruteur dédié, clubs, coachs, agents et organisateurs (univers Pro). Les joueurs Man et Woman candidatent sans publier d'annonces.",
  },
  {
    q: "Le pôle santé inclut-il le coach mental ?",
    a: "Oui — kinés, médecins du sport, coach mental, nutritionnistes et autres spécialités. Diplômes validés avant messagerie complète.",
  },
  {
    q: "Comment fonctionne le covoiturage ?",
    a: "Coachs et joueurs proposent des trajets ou réservent une place pour matchs et détections — intégré aux événements, style BlaBlaCar.",
  },
  {
    q: "Qu'est-ce que le ProDay Shop ?",
    a: "Boutique officielle dans l'app : trépieds, t-shirts et maillots par univers (Man, Woman, Pro). Précommande par email en attendant le paiement in-app.",
  },
  {
    q: "Pro Day Man, Woman et Pro — c'est quoi ?",
    a: "Trois univers : Man (joueurs foot M), Woman (joueuses foot F) et Pro (coach, agent, recruteur, club, pôle santé, orga, partenaire). Choisissez le vôtre à l'inscription.",
  },
  {
    q: "Comment fonctionne le tarif mensuel vs annuel ?",
    a: `Le mensuel est toujours le tarif de base. L'annuel facture 12 mois avec ${ANNUAL_DISCOUNT_PERCENT} % de remise (prix annuel = mensuel × 12 − ${ANNUAL_DISCOUNT_PERCENT} %). Exemple : ${faqPricing("agent_elite")}.`,
  },
  {
    q: "Quel tarif pour Joueur Plus ?",
    a: `Joueur Plus (Man & Woman) : ${faqPricing("player_plus")}. Candidatures Mercato illimitées, mise en avant et alertes annonces.`,
  },
  {
    q: "Quel tarif pour Coach ou Recruteur Pro ?",
    a: `Coach Pro et Recruteur Pro : ${faqPricing("coach_pro")}. Multi-équipes, messages recrutement illimités et annonces Mercato actives.`,
  },
  {
    q: "Quel tarif pour Club Pro ?",
    a: `Club Pro : ${faqPricing("club_pro")}. Annonces illimitées, multi-équipes et priorité dans le fil Mercato.`,
  },
  {
    q: "Quel tarif pour Agent Elite ?",
    a: `Agent Elite est la formule premium agents : ${faqPricing("agent_elite")}. CRM joueurs, alertes géolocalisées, pipeline mandats et contacts illimités.`,
  },
  {
    q: "Quel tarif pour le pôle santé ?",
    a: `Pôle santé Pro : ${faqPricing("physio_pro")}. Commission ${PHYSIO_BOOKING_COMMISSION_PERCENT} % uniquement sur les consultations réservées via l'app (nutrition, coach mental, prépa…). Pas de commission sur les actes médicaux réglementés.`,
  },
  {
    q: "Quel tarif pour Organisateur Pro ?",
    a: `Organisateur Pro : ${faqPricing("organizer_pro")}. Tournois Arena illimités, inscriptions en ligne, palmarès et visibilité sponsors.`,
  },
  {
    q: "Quel tarif pour les partenaires / sponsors ?",
    a: `Trois formules partenaires : Découverte (0 € — profil vérifié, 1 offre), Territorial (${formatAnnualPricingLine(49)} — devis sur ${SPONSOR_PARTNER_CONTACT_EMAIL}), National Pro (${faqPricing("sponsor_pro")} — espace dédié dans l'app).`,
  },
  {
    q: "Puis-je exporter mon CV foot ?",
    a: "Oui — chaque match alimente votre profil via Live Stats. Export PDF professionnel depuis l'onglet Profil.",
  },
  {
    q: "Les données sont-elles réelles ?",
    a: "Comptes sécurisés, données hébergées en Europe via nos prestataires certifiés. La liste d'attente recueille des profils testeurs réels.",
  },
  {
    q: "Prochainement disponible sur iOS et Android ?",
    a: "L'application arrive sur l'App Store et Google Play. Inscrivez-vous sur la liste d'attente pour être informé du lancement et accéder en priorité.",
  },
  {
    q: "Que reçoit-on en s'inscrivant sur la liste d'attente ?",
    a: "Des nouvelles régulières sur l'avancement du produit et un accès prioritaire dès l'ouverture sur mobile.",
  },
  {
    q: "ProDay analyse-t-il chaque action en vidéo ?",
    a: "Non. L'analyse IA porte sur les highlights que vous enregistrez dans le journal d'activités (miniature vidéo ou image + notes). L'analyse frame-by-frame automatique sur tout le match est une ambition future, pas une promesse actuelle.",
  },
  {
    q: "Quelle est la différence entre aujourd'hui et la vision long terme ?",
    a: "Aujourd'hui : profil, Mercato, score carrière, journal, analyse IA des séances, sponsors, Arena et admin. Demain : repérage talent mondial automatisé et analyse vidéo avancée — voir la page Vision.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Enfin une app qui regroupe convocations, matchs et recrutement — notre U17 ne jongle plus entre cinq groupes.",
    author: "Marc D.",
    role: "Coach amateur, Île-de-France",
  },
  {
    quote:
      "La Visibilité m'a poussée à compléter mon profil. Trois clubs m'ont contactée après mes candidatures Mercato F.",
    author: "Léa M.",
    role: "Joueuse U19, ProDay Woman",
  },
  {
    quote:
      "La vérification diplôme rassure les parents. On sait qui peut vraiment contacter nos joueuses.",
    author: "Sophie R.",
    role: "Responsable club féminin",
  },
  {
    quote:
      "Arena pour notre tournoi local : inscriptions et palmarès sur l'app, zéro tableur.",
    author: "Karim B.",
    role: "Organisateur tournoi",
  },
] as const;

export const ROADMAP_ITEMS = [
  {
    phase: "Livré",
    status: "done" as const,
    items: [
      "Dashboard & accueil IA",
      "Profil, Visibilité & CV en ligne",
      "Score carrière & timeline",
      "Journal d'activités",
      "Analyse IA highlights séance",
      "Mercato & candidatures",
      "Matchs & Live Stats",
      "Gestion équipe",
      "Covoiturage",
      "Pôle santé",
      "ProDay Shop",
      "Arena (tournois)",
      "Contrôle parental",
      "Fil communauté & Reels",
      "Espace partenaires / sponsors",
      "Admin & vérification staff",
    ],
  },
  {
    phase: "En cours",
    status: "active" as const,
    items: [
      "Functions Blaze & Storage",
      "Site vitrine aligné produit",
      "IAP store (16 SKU)",
      "Push géo partenaires (bêta)",
    ],
  },
  {
    phase: "À venir",
    status: "pending" as const,
    items: [
      "Analyse vidéo frame-by-frame avancée",
      "Détection talent mondiale automatique",
      "Notifications géo agents",
      "Paiements tournois",
    ],
  },
] as const;

export const COMPARISON_ROWS = [
  { feature: "Recrutement ciblé", proday: true, whatsapp: false, excel: false },
  { feature: "CV vivant + PDF", proday: true, whatsapp: false, excel: false },
  { feature: "Convocations RSVP", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Live Stats vers profil", proday: true, whatsapp: false, excel: false },
  { feature: "Vérification staff", proday: true, whatsapp: false, excel: false },
  { feature: "Tournois Arena", proday: true, whatsapp: false, excel: "partial" as const },
  { feature: "Visibilité visibilité", proday: true, whatsapp: false, excel: false },
  { feature: "Covoiturage matchs", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Pôle santé & coach mental", proday: true, whatsapp: false, excel: false },
  { feature: "ProDay Shop intégré", proday: true, whatsapp: false, excel: false },
  { feature: "Recruteurs Mercato (club/coach/agent)", proday: true, whatsapp: false, excel: "partial" as const },
  { feature: "Reels & Fil communauté", proday: true, whatsapp: false, excel: false },
  { feature: "Espace partenaires & sponsors", proday: true, whatsapp: false, excel: false },
  { feature: "Contrôle parental & espace famille", proday: true, whatsapp: false, excel: false },
] as const;

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "Votre priorité cette saison ?",
    options: [
      { label: "Trouver un club / être recruté", role: "player" },
      { label: "Gérer mon équipe et recruter", role: "coach" },
      { label: "Annonces et structure club", role: "club" },
      { label: "Organiser un tournoi", role: "organizer" },
    ],
  },
  {
    id: "q2",
    question: "Vous utilisez surtout…",
    options: [
      { label: "Mon profil sportif et stats", role: "player" },
      { label: "Diplômes et détections", role: "coach" },
      { label: "Plusieurs équipes au club", role: "club" },
      { label: "Inscriptions et tableaux", role: "organizer" },
    ],
  },
  {
    id: "q3",
    question: "Côté foot féminin ?",
    options: [
      { label: "Oui, c'est mon univers", role: "woman" },
      { label: "Mixte / plutôt masculin", role: "homme" },
      { label: "Je supervise un enfant", role: "parent" },
      { label: "Je représente des joueurs", role: "agent" },
    ],
  },
] as const;

export const QUIZ_RESULTS: Record<
  string,
  { title: string; description: string; href: string; cta: string }
> = {
  player: {
    title: "Profil sportif",
    description: "CV en ligne, Visibilité et stats — le Mercato vient compléter votre visibilité.",
    href: "/cv",
    cta: "Découvrir le CV en ligne",
  },
  coach: {
    title: "Profil Coach Pro",
    description: "Vérification diplôme, effectif et convocations — univers Pro Day Pro.",
    href: "/pro#poles",
    cta: "Découvrir Pro Day Pro",
  },
  recruiter: {
    title: "Profil Recruteur",
    description: "Scouting, Mercato Pro et pipeline candidatures — rôle dédié Pro Day Pro.",
    href: "/pro#poles",
    cta: "Découvrir Pro Day Pro",
  },
  club: {
    title: "Profil Club",
    description: "Annonces Mercato, multi-équipes et exports candidatures — univers Pro Day Pro.",
    href: "/pro#poles",
    cta: "Découvrir Pro Day Pro",
  },
  organizer: {
    title: "Profil Organisateur",
    description: "Créez vos tournois Arena — inscriptions et palmarès intégrés.",
    href: "/fonctionnalites#modules",
    cta: "Découvrir Arena",
  },
  woman: {
    title: "Univers ProDay Woman",
    description: "Mercato F, matchs et profil joueuse — le foot au féminin.",
    href: "/woman",
    cta: "Explorer Woman",
  },
  parent: {
    title: "Espace Parent",
    description: "Supervision, contacts approuvés et limites de temps.",
    href: "/confiance#verification",
    cta: "Confiance & contrôle",
  },
  agent: {
    title: "Profil Agent",
    description: "CRM joueurs, mandats et contacts Mercato — Agent Elite sur Pro Day Pro.",
    href: "/pro#poles",
    cta: "Voir Pro Day Pro",
  },
  homme: {
    title: "Pro Day Man",
    description: "Foot masculin amateur — Mercato M, matchs, Arena et CV joueur.",
    href: "/amateur#modules",
    cta: "Explorer Man",
  },
  pro: {
    title: "Univers Pro Day Pro",
    description: "Recruteurs, coach, agent, club, pôle santé et réseau vérifié — Mercato Pro.",
    href: "/pro#poles",
    cta: "Explorer Pro",
  },
};

export const SHOP_HIGHLIGHTS = [
  {
    name: "Trépied ProDay",
    priceEur: 34.9,
    description: "Filmez matchs et séquences pour votre CV — sac de transport inclus.",
  },
  {
    name: "T-shirt officiel",
    priceEur: 29.9,
    description: "Textile premium logo brodé — par univers Man, Woman ou Pro.",
  },
  {
    name: "Maillot match",
    priceEur: 59.9,
    description: "Maillot domicile ou extérieur — personnalisation nom + numéro en option.",
  },
] as const;

export const LIVE_STAT_EVENTS = [
  { type: "goal", label: "But", points: 1 },
  { type: "assist", label: "Passe décisive", points: 1 },
  { type: "yellow", label: "Carton jaune", points: 0 },
  { type: "save", label: "Arrêt (GK)", points: 1 },
] as const;

