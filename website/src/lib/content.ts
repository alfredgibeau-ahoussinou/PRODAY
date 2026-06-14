import {
  ANNUAL_DISCOUNT_PERCENT,
  formatAnnualPricingLine,
  yearlyPriceFromMonthly,
} from "./pricing";

export const BRAND = {
  name: "ProDay",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "Trois univers — Man, Woman et Pro — pour couvrir tout l'écosystème foot amateur et professionnel.",
} as const;

export type ProductLineWeb = "homme" | "woman" | "pro" | "sante";

export const UNIVERSE_LOGOS: Record<ProductLineWeb, string> = {
  homme: "/branding/logo-man-picto.png",
  woman: "/branding/logo-woman-picto.png",
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
    "Le foot masculin amateur : Mercato M, matchs, Arena, Pulse, CV joueur, covoiturage, pôle santé et Shop — réservé aux joueurs.",
  accent: "#0A0A0A",
  accentDark: "#262626",
} as const;

export const PRO_BRAND = {
  name: "Pro Day Pro",
  shortName: "Pro",
  fullName: "Pro Day Pro",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "EXPERTISE • RÉSEAU • PERFORMANCE",
  mission:
    "Coach, agent, club recruteur et pôle santé — Mercato Pro, réseau vérifié et accompagnement sportif.",
  accent: "#1D4ED8",
  accentDark: "#1E3A8A",
} as const;

/** Message waitlist / page beta */
export const BETA_PITCH = {
  summary:
    "Rejoignez la bêta pour suivre l'avancement de ProDay au quotidien et accéder en avant-première au lancement.",
  dailyUpdates:
    "Les inscrits reçoivent des informations quotidiennes sur l'avancement de l'application.",
  launch:
    "Soyez prévenus dès que ProDay est disponible sur iOS et Android.",
} as const;

export const MODULES = [
  {
    id: "mercato",
    title: "Mercato",
    subtitle: "Recrutement intelligent",
    description:
      "Annonces ciblées par poste, niveau et ville. Candidatures en un tap, suivi des réponses.",
    image: "/showcase/classic-mercato.jpg",
    color: "#0A0A0A",
  },
  {
    id: "matchs",
    title: "Matchs",
    subtitle: "Amicaux & détections",
    description:
      "Proposez ou acceptez un match. Calendrier unifié avec convocations et RSVP.",
    image: "/showcase/classic-match.jpg",
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
    title: "Pulse ProDay",
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
      "Coachs et joueurs proposent ou réservent des places — style BlaBlaCar, intégré aux événements.",
    image: "/showcase/classic-match.jpg",
    color: "#737373",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Kiné, mental, nutrition",
    description:
      "Annuaire praticiens vérifiés — kinés, coach mental, nutritionnistes. Contact sécurisé joueur ↔ pro.",
    image: "/showcase/classic-exp-profile.jpg",
    color: "#64748b",
  },
  {
    id: "shop",
    title: "ProDay Shop",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots officiels par univers — précommande depuis l'app.",
    image: "/showcase/classic-exp-sponsors.jpg",
    color: "#57534e",
  },
] as const;

export const PILLARS = [
  {
    id: "unified",
    title: "Écosystème unique",
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
    subtitle: "Stats → PDF",
    description:
      "Chaque match nourrit votre profil. Export professionnel en un geste.",
  },
  {
    id: "live",
    title: "Live Stats",
    subtitle: "Match → profil",
    description:
      "Buts, passes, cartons en direct — votre saison et votre CV se mettent à jour.",
  },
] as const;

export const JOURNEYS = [
  {
    id: "player",
    role: "Joueur",
    emoji: "⚽",
    steps: [
      "Profil & Pulse",
      "CV en ligne éditable",
      "Stats & galerie",
      "Mercato & candidatures",
      "Matchs & Arena",
    ],
  },
  {
    id: "coach",
    role: "Coach",
    emoji: "📋",
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
    emoji: "🎯",
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
    emoji: "💼",
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
    emoji: "🏟️",
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
    emoji: "🩺",
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
    emoji: "🏆",
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
    emoji: "🛡️",
    steps: [
      "Supervision du compte",
      "Contacts approuvés",
      "Limite de temps",
      "Rapport d'activité",
    ],
  },
] as const;

export function mercatoTabLabelForWeb(line: ProductLineWeb = "homme"): string {
  if (line === "woman") return "Mercato F";
  if (line === "pro") return "Mercato Pro";
  if (line === "sante") return "Cabinet";
  return "Candidater";
}

export const TABS = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "recruit", label: "Candidater", icon: "search" },
  { id: "matches", label: "Matchs", icon: "calendar" },
  { id: "carpool", label: "Covoit.", icon: "car" },
  { id: "health", label: "Santé", icon: "heart" },
  { id: "messages", label: "Messages", icon: "message" },
  { id: "profile", label: "Profil", icon: "user" },
] as const;

export const VERIFICATION_STEPS = [
  { id: 1, label: "Document reçu", status: "done" },
  { id: 2, label: "Authenticité", status: "done" },
  { id: 3, label: "Établissement", status: "active" },
  { id: 4, label: "Badge vérifié", status: "pending" },
] as const;

export const STATS = [
  { value: "7", label: "Onglets dynamiques" },
  { value: "8", label: "Piliers produit" },
  { value: "3", label: "Univers Man · Woman · Pro" },
  { value: "∞", label: "Ambition terrain" },
] as const;

export const SANTE_BRAND = {
  name: "Pro Day Santé",
  shortName: "Santé",
  fullName: "Pro Day Santé",
  logo: UNIVERSE_LOGOS.sante,
  tagline: "SOIGNER • ACCOMPAGNER • PERFORMER",
  mission:
    "Kinés, coach mental et staff médical — annuaire santé, RDV en ligne et messagerie patients.",
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
    "Le foot au féminin : Mercato F, matchs, Arena, Pulse, CV joueuse, covoiturage, pôle santé et Shop — réservé aux joueuses.",
  accent: "#BE185D",
  accentDark: "#831843",
} as const;

export type UniverseBrand =
  | typeof HOMME_BRAND
  | typeof WOMAN_BRAND
  | typeof PRO_BRAND
  | typeof SANTE_BRAND;

export const BRANDS_BY_LINE: Record<ProductLineWeb, UniverseBrand> = {
  homme: HOMME_BRAND,
  woman: WOMAN_BRAND,
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
      "Annonces par poste, niveau et ville. Candidatures en un tap, suivi des réponses sur le Mercato M.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "matchs",
    title: "Matchs",
    subtitle: "Amicaux & convocations",
    description:
      "Proposez ou acceptez un match. Calendrier unifié avec convocations et RSVP pour votre équipe.",
    image: "/showcase/classic-match.jpg",
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
    title: "Pulse & CV",
    subtitle: "Visibilité joueur",
    description:
      "Score Pulse, stats saison, galerie et CV en ligne éditable — votre vitrine sur le Mercato M.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
  {
    id: "carpool",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Proposez ou réservez une place pour matchs et détections — intégré aux événements Man.",
    image: "/showcase/classic-match.jpg",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés — contact sécurisé joueur ↔ pro depuis l'app Man.",
    image: "/showcase/classic-exp-profile.jpg",
  },
  {
    id: "shop",
    title: "ProDay Shop Man",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo Pro Day Man — précommande depuis l'app.",
    image: "/showcase/classic-exp-sponsors.jpg",
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
    subtitle: "Pulse & CV en ligne",
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
    image: "/showcase/woman/woman-match.jpg",
  },
  {
    id: "health-f",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés — contact sécurisé joueuse ↔ pro depuis l'app Woman.",
    image: "/showcase/woman/woman-profile.jpg",
  },
  {
    id: "shop-f",
    title: "ProDay Shop Woman",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo ProDay Woman — précommande depuis l'app.",
    image: "/showcase/woman/woman-arena.jpg",
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
    id: "pro" as const,
    brand: PRO_BRAND,
    logo: UNIVERSE_LOGOS.pro,
    href: "/pro",
    image: "/showcase/classic-staff.jpg",
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
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "sante",
    title: "Pôle santé",
    subtitle: "Kiné, mental, nutrition",
    description:
      "Visibilité près des clubs, messagerie après validation — coach mental inclus.",
    image: "/showcase/classic-exp-profile.jpg",
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
      { label: "Visibilité", value: "Pulse & CV" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato M, matchs, Arena, Pulse, covoiturage, pôle santé et Shop — pensé pour les joueurs.",
    modules: MAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Coach, club ou recruteur ? Direction Pro Day Pro — univers dédié aux professionnels.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueur",
    cta: {
      title: "Créez votre compte Man",
      description:
        "Inscription joueur en quelques minutes — Mercato M, CV en ligne et convocations.",
      beta: "Rejoindre la beta Man",
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
      { label: "Visibilité", value: "Pulse & CV F" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato F, matchs, Arena, Pulse, covoiturage, pôle santé et Shop — pensé pour les joueuses.",
    modules: WOMAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Staff, club ou recruteur F ? L'univers Pro Day Pro couvre les structures et le réseau pro.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueuse",
    cta: {
      title: "Créez votre compte Woman",
      description:
        "Inscription joueuse en quelques minutes — visibilité sur le Mercato F et votre CV en ligne.",
      beta: "Rejoindre la beta Woman",
    },
  },
  pro: {
    line: "pro" as const,
    brand: PRO_BRAND,
    hero: {
      title: "Les pros du foot.",
      image: "/showcase/classic-staff.jpg",
    },
    highlights: [
      { label: "Rôles", value: "7 profils pro" },
      { label: "Mercato", value: "Mercato Pro" },
      { label: "Confiance", value: "Profils vérifiés" },
      { label: "Réseau", value: "Messagerie sécurisée" },
    ],
    modulesTitle: "Modules professionnels",
    modulesSubtitle:
      "Recruteur, coach, agent, pôle santé et réseau Pro — Mercato Pro et pipeline candidatures.",
    modules: PRO_MODULES as readonly UniverseModule[],
    journeyIds: [
      "coach",
      "recruiter",
      "agent",
      "club",
      "medical",
      "organizer",
    ] as const,
    audienceNote:
      "Joueurs foot M ou F ? Choisissez Pro Day Man ou ProDay Woman à l'inscription.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: [
      "coach_pro",
      "agent_elite",
      "physio_pro",
      "organizer_pro",
    ] as const,
    pricingTitle: "Formules Pro",
    cta: {
      title: "Créez votre compte Pro",
      description:
        "Recruteur, coach, agent, club, pôle santé, organisateur ou partenaire — validation métier incluse.",
      beta: "Rejoindre la beta Pro",
    },
  },
} as const;

export type UniversePageId = keyof typeof UNIVERSE_PAGE_CONFIG;

export const VISION_PILLARS = [
  {
    title: "Mission",
    body: "Connecter • Progresser • Réussir — donner à chaque acteur du foot amateur les outils du haut niveau.",
  },
  {
    title: "Écosystème",
    body: "Recrutement, matchs, covoiturage, pôle santé, Arena et ProDay Shop — sept onglets selon votre rôle, une expérience.",
  },
  {
    title: "Technologie",
    body: "React Native / Expo — une app mobile et web unifiée, données synchronisées en temps réel.",
  },
  {
    title: "Roadmap",
    body: "Mercato, Live Stats, covoiturage, pôle santé et Shop livrés. Notifications géo et paiements tournois à venir.",
  },
] as const;

export const ALL_PILLARS = [
  ...PILLARS,
  {
    id: "pulse-pillar",
    title: "Pulse ProDay",
    subtitle: "Score de visibilité",
    description:
      "Indicateur exclusif : profil, activité et confiance pour vous démarquer.",
  },
  {
    id: "recruit-pillar",
    title: "Mercato intelligent",
    subtitle: "Filtres & candidatures",
    description:
      "Annonces ciblées, postuler en un tap, suivi des réponses — pour joueurs et clubs.",
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
] as const;

export const SUBSCRIPTION_PLANS_WEB = [
  {
    id: "player_plus",
    label: "Joueur Plus",
    tagline: "CV en ligne, visibilité et Mercato",
    monthlyEur: 2.99,
    storeAvailable: false,
    universes: ["homme", "woman"] as ProductLineWeb[],
    freeIncludes: [
      "Profil, Pulse et CV en ligne",
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
    storeAvailable: false,
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
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
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
    storeAvailable: false,
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
    storeAvailable: false,
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
    tagline: "Tournois Arena, inscriptions et palmarès",
    monthlyEur: 14.99,
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil organisateur vérifié",
      "1 tournoi Arena actif",
      "Inscriptions en ligne",
      "Palmarès publié",
    ],
    proIncludes: [
      "Tournois illimités",
      "Visibilité sponsors intégrée",
      "Exports participants",
      "Priorité fil événements",
    ],
  },
  {
    id: "sponsor_pro",
    label: "Partenaire Pro",
    tagline: "Visibilité marque & clubs locaux",
    monthlyEur: 99.99,
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil partenaire vérifié",
      "Présence annuaire Sponsors",
      "1 offre active",
      "Zone géographique",
    ],
    proIncludes: [
      "Offres sponsors illimitées",
      "Logo onglet Sponsors",
      "Campagnes locales ciblées",
      "Push géolocalisé (à venir)",
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
      "Profil, Pulse et CV joueuse en ligne",
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
    a: "Oui, un compte gratuit couvre profil, Pulse, calendrier, Arena en consultation et limites Mercato. Les offres Pro débloquent candidatures illimitées, multi-équipes, etc.",
  },
  {
    q: "Comment fonctionne la vérification coach ?",
    a: "Diplôme ou licence obligatoire à l'inscription. Badge orange pendant la revue, badge vert après validation admin — messagerie complète débloquée.",
  },
  {
    q: "Qu'est-ce que le Pulse ProDay ?",
    a: "Score de visibilité combinant profil, stats saison, candidatures et confiance. Plus il monte, plus vous êtes visible des clubs.",
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
    a: `Partenaire Pro : ${faqPricing("sponsor_pro")}. Visibilité marque, offres sponsors illimitées et campagnes locales ciblées.`,
  },
  {
    q: "Puis-je exporter mon CV foot ?",
    a: "Oui — chaque match alimente votre profil via Live Stats. Export PDF professionnel depuis l'onglet Profil.",
  },
  {
    q: "Les données sont-elles réelles ?",
    a: "Comptes sécurisés, données hébergées en Europe via nos prestataires certifiés. La bêta collecte des comptes testeurs réels.",
  },
  {
    q: "Prochainement disponible sur iOS et Android ?",
    a: "L'application arrive bientôt sur l'App Store et Google Play. Rejoignez la bêta pour être prévenu du lancement et accéder en avant-première.",
  },
  {
    q: "Que reçoit-on en rejoignant la bêta ?",
    a: "Des informations quotidiennes sur l'avancement de l'app (nouvelles fonctionnalités, corrections, dates clés) et un accès prioritaire dès l'ouverture sur mobile.",
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
      "Le Pulse m'a poussée à compléter mon profil. Trois clubs m'ont contactée après mes candidatures Mercato F.",
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
      "Dashboard",
      "Mercato",
      "Matchs",
      "Live Stats",
      "Gestion équipe",
      "Covoiturage",
      "Pôle santé",
      "ProDay Shop",
      "Arena MVP",
      "Contrôle parental",
    ],
  },
  {
    phase: "En cours",
    status: "active" as const,
    items: ["Functions Blaze", "Storage", "Site vitrine"],
  },
  {
    phase: "À venir",
    status: "pending" as const,
    items: ["Notifications géo agents", "Paiements tournois", "IAP tous les plans"],
  },
] as const;

export const COMPARISON_ROWS = [
  { feature: "Recrutement ciblé", proday: true, whatsapp: false, excel: false },
  { feature: "CV vivant + PDF", proday: true, whatsapp: false, excel: false },
  { feature: "Convocations RSVP", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Live Stats → profil", proday: true, whatsapp: false, excel: false },
  { feature: "Vérification staff", proday: true, whatsapp: false, excel: false },
  { feature: "Tournois Arena", proday: true, whatsapp: false, excel: "partial" as const },
  { feature: "Pulse visibilité", proday: true, whatsapp: false, excel: false },
  { feature: "Covoiturage matchs", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Pôle santé & coach mental", proday: true, whatsapp: false, excel: false },
  { feature: "ProDay Shop intégré", proday: true, whatsapp: false, excel: false },
  { feature: "Recruteurs Mercato (club/coach/agent)", proday: true, whatsapp: false, excel: "partial" as const },
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
    description: "CV en ligne, Pulse et stats — le Mercato vient compléter votre visibilité.",
    href: "/cv",
    cta: "Découvrir le CV en ligne",
  },
  coach: {
    title: "Profil Coach Pro",
    description: "Vérification diplôme, effectif et convocations — univers Pro Day Pro.",
    href: "/pro",
    cta: "Découvrir Pro Day Pro",
  },
  recruiter: {
    title: "Profil Recruteur",
    description: "Scouting, Mercato Pro et pipeline candidatures — rôle dédié Pro Day Pro.",
    href: "/pro",
    cta: "Découvrir Pro Day Pro",
  },
  club: {
    title: "Profil Club",
    description: "Annonces Mercato, multi-équipes et exports candidatures — univers Pro Day Pro.",
    href: "/pro",
    cta: "Découvrir Pro Day Pro",
  },
  organizer: {
    title: "Profil Organisateur",
    description: "Créez vos tournois Arena — inscriptions et palmarès intégrés.",
    href: "/fonctionnalites",
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
    href: "/confiance",
    cta: "Confiance & contrôle",
  },
  agent: {
    title: "Profil Agent",
    description: "CRM joueurs, mandats et contacts Mercato — Agent Elite sur Pro Day Pro.",
    href: "/pro",
    cta: "Voir Pro Day Pro",
  },
  homme: {
    title: "Pro Day Man",
    description: "Foot masculin amateur — Mercato M, matchs, Arena et CV joueur.",
    href: "/homme",
    cta: "Explorer Man",
  },
  pro: {
    title: "Univers Pro Day Pro",
    description: "Recruteurs, coach, agent, club, pôle santé et réseau vérifié — Mercato Pro.",
    href: "/pro",
    cta: "Explorer Pro",
  },
};

export const SHOP_HIGHLIGHTS = [
  {
    name: "Trépied ProDay",
    priceEur: 34.9,
    description: "Filmez matchs et skills pour votre CV — sac de transport inclus.",
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

