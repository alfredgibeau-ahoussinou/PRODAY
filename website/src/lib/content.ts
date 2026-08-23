import {
  ANNUAL_DISCOUNT_PERCENT,
  formatAnnualPricingLine,
  yearlyPriceFromMonthly,
} from "./pricing";

export const BRAND = {
  name: "ProDay",
  tagline: "Le quotidien digital du football amateur",
  logo: "/branding/logo-proday-official.png",
  /** Phrase d’accueil : ce que fait l’app, en une ligne. */
  mission: "Le football amateur, enfin réuni au même endroit.",
  heroSupport:
    "Joueurs, coachs, clubs et familles : entraînez, organisez, suivez l’analyse de forme et faites vivre votre club depuis une seule application.",
} as const;

/** Pitch honnête : capacités réelles vs ambition long terme. Pas de métriques fictives. */
export const PRODUCT_VISION = {
  intro:
    "ProDay accompagne le joueur, le coach et le club avant, pendant et après le match. Le quotidien digital du football amateur : pas une simple app de gestion.",
  disclaimer:
    "Les chiffres du site décrivent le produit, pas l'audience en direct. L'analyse IA porte sur vos highlights de séance (vidéo ou image + notes). Pas sur chaque action en match.",
  today: {
    title: "Aujourd'hui",
    lead: "Ce qui est disponible ou en déploiement dans l'app.",
    items: [
      "Profil joueur / staff : Visibilité, CV en ligne, galerie et stats saison",
      "Carte joueur réelle (sans note artificielle ni badge de prestige)",
      "Journal d'activités (séances, matchs, highlights)",
      "Entraînement à domicile (seul / famille) et coaching humain à l’heure",
      "Analyse IA des highlights de séance (miniature vidéo ou poster + tags et notes)",
      "Mercato : annonces, candidatures et suivi staff",
      "Matchs, invitations entre clubs, convocations RSVP, Stats en direct",
      "Organisation d’événements et tournois (générateur, Hub en direct)",
      "Fil communauté, Reels et question hebdo",
      "Espace partenaires / micro sponsoring local",
      "Covoiturage, contrôle parental et espace famille",
      "Analyse de forme : effectif (coach) et suivi personnel (joueur)",
      "Espace président : vision globale du club",
      "Tactique IA : tableau, disponibilité, IA match, entraînements et vidéo",
    ],
  },
  tomorrow: {
    title: "Demain",
    lead: "Ambitions produit. Pas encore livrées. Pas de promesse marketing ici.",
    items: [
      "Place de marché coaching humain généralisée (Stripe Connect)",
      "Analyse vidéo image par image avancée",
      "Causerie vidéo IA (« 3 choses à retenir »)",
      "Bourse aux équipements et micro sponsoring généralisés",
      "Paiements tournois intégrés",
    ],
  },
} as const;

/** Nouveautés mises en avant sur la home premium. */
export const SPOTLIGHT_FEATURES = [
  {
    id: "reels",
    title: "Reels",
    tagline: "Vidéos courtes",
    description: "Moments forts en vertical. Visible pour les joueurs et les clubs.",
    accent: "from-violet-600/30 to-violet-900/10",
  },
  {
    id: "feed",
    title: "Fil & question hebdo",
    tagline: "Communauté",
    description: "Publications, réactions et question de la semaine. L'activité de votre communauté.",
    accent: "from-indigo-600/30 to-indigo-900/10",
  },
  {
    id: "partners",
    title: "Espace partenaires",
    tagline: "Sponsors",
    description: "Découverte, Territorial 49 € ou National Pro 99 €. Avec des résultats suivis.",
    accent: "from-blue-600/30 to-blue-900/10",
  },
  {
    id: "family",
    title: "Famille & mineurs",
    tagline: "Sécurité",
    description: "Espace jeunes, contrôle parental et portail tuteur.",
    accent: "from-emerald-600/30 to-emerald-900/10",
  },
  {
    id: "tournaments",
    title: "Tournois Arène",
    tagline: "Compétition",
    description: "Création, inscriptions, tableaux et palmarès pour votre saison.",
    accent: "from-amber-600/30 to-amber-900/10",
  },
  {
    id: "auth",
    title: "Accueil vidéo",
    tagline: "Signature",
    description: "Une séquence de bienvenue à la connexion.",
    accent: "from-rose-600/30 to-rose-900/10",
  },
] as const;

export type ProductLineWeb = "homme" | "woman" | "amateur" | "supporter" | "pro" | "sante";

export const UNIVERSE_LOGOS: Record<ProductLineWeb, string> = {
  homme: "/branding/logo-proday-mark-joueur.png",
  woman: "/branding/logo-proday-mark-joueur.png",
  amateur: "/branding/logo-proday-mark-joueur.png",
  supporter: "/branding/logo-proday-mark-supporter.png",
  pro: "/branding/logo-proday-mark-club.png",
  sante: "/branding/logo-proday-mark-parent.png",
};

export const HOMME_BRAND = {
  name: "Pro Day Man",
  shortName: "Man",
  fullName: "Pro Day Man",
  logo: UNIVERSE_LOGOS.homme,
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "Le foot masculin amateur. Mercato M, matchs, Arène, Visibilité, CV joueur, covoiturage, santé et Boutique. Réservé aux joueurs.",
  accent: "#1E3AFF",
  accentDark: "#0A1A8A",
} as const;

export const AMATEUR_BRAND = {
  name: "Pro Day Joueur",
  shortName: "Joueur",
  fullName: "Pro Day Joueur",
  logo: UNIVERSE_LOGOS.amateur,
  tagline: "Progresser · Jouer · Partager",
  mission:
    "Espace Joueur : carte sportive réelle, entraînement, Mercato, CV et saison. Sans badge de prestige artificiel.",
  accent: "#1E3AFF",
  accentDark: "#0A1A8A",
} as const;

export const JOUEUR_BRAND = AMATEUR_BRAND;

export const SUPPORTER_BRAND = {
  name: "Pro Day Supporter",
  shortName: "Supporter",
  fullName: "Pro Day Supporter",
  logo: UNIVERSE_LOGOS.supporter,
  tagline: "Tribune libre · Zéro paywall",
  mission:
    "Scores live, clubs favoris, débats et moments. Une tribune 100 % gratuite. Pas de Mercato. Pas d'abonnement store.",
  accent: "#06B6D4",
  accentDark: "#164E63",
} as const;

export const PRO_BRAND = {
  name: "Pro Day Pro",
  shortName: "Pro",
  fullName: "Pro Day Pro",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "CLUB • COACH • PERFORMANCE",
  mission:
    "Club au centre, Coach en pôle dédié. Agent, recruteur et organisateur restent des rôles intégrés.",
  accent: "#7C3AED",
  accentDark: "#3B0764",
} as const;

export const PRO_JOUEUR_BRAND = {
  name: "Pro Day Joueur",
  shortName: "Joueur",
  fullName: "Pro Day Joueur",
  logo: UNIVERSE_LOGOS.homme,
  tagline: "Amateur → Pro · Badges",
  mission:
    "Même profil du district au contrat pro. Pass Premium 3,99 € : entraînements IA, heatmaps et passeport recruteur.",
  accent: "#1E3AFF",
  accentDark: "#0A1A8A",
} as const;

export const EVENEMENTS_BRAND = {
  name: "Organisateur ProDay",
  shortName: "Organisateur",
  fullName: "Rôle Organisateur",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "Tournois · Détections · Stages",
  mission:
    "Rôle intégré au Club : tournois Arène, détections et stages. Plus un pôle indépendant.",
  accent: "#1E3AFF",
  accentDark: "#0A1A8A",
} as const;

export const EVENEMENTS_AUDIENCES = [
  "Tournois associatifs et de quartier",
  "Académies football & centres",
  "Stages et camps d’entraînement",
  "Journées de détection",
  "Showcases et événements partenaires",
] as const;

export const PRO_CLUB_BRAND = {
  name: "Pro Day Club",
  shortName: "Club",
  fullName: "Pro Day Club",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "Cœur de ProDay",
  mission:
    "Équipes, licenciés, coachs, président, invitations de match, événements, tournois, covoiturage et permissions. Sur devis selon la taille du club.",
  accent: "#7C3AED",
  accentDark: "#3B0764",
} as const;

export const PRO_STAFF_BRAND = {
  name: "Pro Day Coach",
  shortName: "Coach",
  fullName: "Pro Day Coach",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "Tactique IA · IA · Effectif",
  mission:
    "Profil coach rattaché au club : parcours, diplômes, Tactique IA, assistant IA, analyse vidéo et préparation match.",
  accent: "#22C55E",
  accentDark: "#14532D",
} as const;

/** Message waitlist / page beta */
export const BETA_PITCH = {
  summary:
    "Laisse ton email. Bêta décalée au 15 août 2026 (améliorations en cours). iOS TestFlight à 18 h. Gratuit pour les inscrits.",
  dailyUpdates:
    "Les inscrits reçoivent des emails réguliers : report de date, ouverture TestFlight, astuces et nouveautés (tous les 2 jours après le lancement).",
  launch:
    "Bêta iOS ouverte le 15 août 2026 à 18 h. Lien TestFlight envoyé par email. APK Android disponible dès validation.",
  iosLaunchLabel: "15 août 2026 à 18 h",
  delayNotice:
    "La bêta a été décalée au 15 août 2026 en raison d'améliorations nécessaires au bon développement de l'application.",
} as const;

export const MODULES = [
  {
    id: "smart-tactics",
    title: "Tactique IA",
    subtitle: "Tableau · disponibilité · IA",
    description:
      "Tableau tactique interactif, lineup, disponibilité match, préparation IA, entraînements collectifs et individuels, tagging en direct et analyse vidéo smartphone.",
    image: "/images/football-tactics-01.jpg",
    color: "#1B5E20",
  },
  {
    id: "mercato",
    title: "Mercato",
    subtitle: "Annonces & candidatures",
    description:
      "Annonces filtrées par poste, niveau et ville. Candidature depuis l'app. Suivi des réponses.",
    image: "/showcase/classic-mercato.jpg",
    color: "#0A0A0A",
  },
  {
    id: "matchs",
    title: "Matchs",
    subtitle: "Invitations & amicaux",
    description:
      "Proposez un match à un autre club, acceptez ou contre proposez. Calendrier, convocations et RSVP une fois confirmé.",
    image: "/images/football-match-01.jpg",
    color: "#262626",
  },
  {
    id: "arena",
    title: "Arène",
    subtitle: "Tournois locaux",
    description:
      "Inscriptions club, tableaux et palmarès publiés.",
    image: "/showcase/classic-arena.jpg",
    color: "#404040",
  },
  {
    id: "pulse",
    title: "Visibilité ProDay",
    subtitle: "Score de visibilité",
    description:
      "Profil, activité et confiance combinés. Le score de visibilité ProDay.",
    image: "/showcase/classic-exp-pulse.jpg",
    color: "#525252",
  },
  {
    id: "carpool",
    title: "Covoiturage",
    subtitle: "Différenciateur ProDay",
    description:
      "Proposez un trajet, cherchez des places, filtrez par match / entraînement / événement ou lieu, réservez et contactez le conducteur en messagerie.",
    image: "/images/football-pitch-01.jpg",
    color: "#737373",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Kiné, mental, nutrition",
    description:
      "Annuaire de praticiens vérifiés. Kinés, coach mental, nutritionnistes. Contact sécurisé joueur et pro.",
    image: "/images/football-health-01.jpg",
    color: "#64748b",
  },
  {
    id: "shop",
    title: "Boutique ProDay",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t shirts et maillots officiels par univers. Précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
    color: "#57534e",
  },
  {
    id: "feed",
    title: "Fil",
    subtitle: "Communauté & question hebdo",
    description:
      "Publications clubs et joueurs, réactions et question de la semaine.",
    image: "/showcase/classic-exp-discover.jpg",
    color: "#6366f1",
  },
  {
    id: "reels",
    title: "Reels",
    subtitle: "Vidéos courtes foot",
    description:
      "Moments forts en vertical. De la visibilité pour votre profil.",
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
      "Carrière, club, convocations, matchs et tournois. Tout au même endroit.",
  },
  {
    id: "trust",
    title: "Confiance ProDay",
    subtitle: "Staff certifié",
    description:
      "Diplômes staff et badge joueur vérifié. Confidentialité contacts et demandes de message. Contrôle parental pour les mineurs.",
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
    title: "Stats en direct",
    subtitle: "Match vers profil",
    description:
      "Buts, passes, cartons en direct. Votre saison et votre CV se mettent à jour.",
  },
  {
    id: "feed",
    title: "Fil communauté",
    subtitle: "Question hebdo",
    description:
      "Publications, réactions et question de la semaine.",
  },
  {
    id: "reels",
    title: "Reels",
    subtitle: "Vidéos courtes",
    description:
      "Moments forts en vertical. Visibilité pour joueurs et clubs.",
  },
  {
    id: "sponsors",
    title: "Espace partenaires",
    subtitle: "Sponsors & offres",
    description:
      "Marques locales et nationales. Visibilité clubs, financement et résultats mesurés.",
  },
] as const;

export const JOURNEYS = [
  {
    id: "player",
    role: "Joueur amateur",
    steps: [
      "Créer votre profil (M ou F)",
      "Remplir le CV foot",
      "Postuler au Mercato local",
      "Répondre aux convocations",
      "Suivre votre saison et votre visibilité",
    ],
  },
  {
    id: "pro_player",
    role: "Joueur pro",
    steps: [
      "Accueil Carrière et contrat",
      "Portfolio vidéos et stats coach",
      "Recevoir essais et opportunités",
      "Échanger avec agent / staff",
      "Suivre votre visibilité scouting",
    ],
  },
  {
    id: "coach",
    role: "Coach",
    steps: [
      "Vérifier votre diplôme",
      "Constituer l'effectif",
      "Publier une détection",
      "Convocations et live stats",
    ],
  },
  {
    id: "recruiter",
    role: "Recruteur",
    steps: [
      "Profil recruteur vérifié",
      "Définir territoire & poste",
      "Publier sur le Mercato Pro",
      "Piloter le suivi des candidatures",
    ],
  },
  {
    id: "agent",
    role: "Agent",
    steps: [
      "Profil agent vérifié",
      "Constituer le CRM joueurs",
      "Activer alertes géolocalisées",
      "Suivre mandats & clubs",
    ],
  },
  {
    id: "club",
    role: "Structure club",
    steps: [
      "Créer la structure & les catégories",
      "Affecter coachs et staff",
      "Ouvrir les annonces recrutement",
      "Publier la vitrine publique",
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
      "Créer un tournoi Arène",
      "Ouvrir les inscriptions",
      "Gérer poules & scores",
      "Publier le palmarès",
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
      "Créer votre profil tribune",
      "Suivre clubs et joueurs",
      "Ouvrir le live le jour J",
      "Réagir aux débats et moments",
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

/** Ids alignés sur l'app (`mainTabConfig`). voir `appTabs.ts` pour la visibilité par univers. */
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
  { value: "30s", label: "Démarrage", note: "Créer un profil" },
  { value: "3", label: "Étapes", note: "Profil · équipe · match" },
  { value: "1", label: "App", note: "Tout au même endroit" },
  { value: "9+", label: "Modules", note: "Fonctions utiles" },
] as const;

/** Bandeau légal. chiffres marketing, pas des métriques live */
export const STATS_DISCLAIMER =
  "Repères produit illustratifs. Pas des stats live d'utilisation.";

export const SANTE_BRAND = {
  name: "Pro Day Santé",
  shortName: "Santé",
  fullName: "Pro Day Santé",
  logo: UNIVERSE_LOGOS.sante,
  tagline: "Kiné · Mental · Nutrition",
  mission:
    "Rôle médical intégré : praticiens vérifiés près des clubs, agenda et téléconsultation. Plus un pôle indépendant.",
  accent: "#F97316",
  accentDark: "#7C2D12",
} as const;

export const WOMAN_BRAND = {
  name: "ProDay Woman",
  shortName: "Woman",
  fullName: "ProDay Woman",
  logo: UNIVERSE_LOGOS.woman,
  tagline: "JOUER • BRILLER • GRANDIR",
  mission:
    "Le foot au féminin. Mercato F, matchs, Arène, Visibilité, CV joueuse, covoiturage, santé et Boutique. Réservé aux joueuses.",
  accent: "#F00000",
  accentDark: "#540000",
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

/** Modules exclusifs Pro Day Man. joueurs foot masculin. */
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
    subtitle: "Invitations & convocations",
    description:
      "Invitation club ↔ club, contre proposition et calendrier unifié avec RSVP pour votre équipe.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "arena",
    title: "Arène",
    subtitle: "Tournois locaux",
    description:
      "Inscriptions, tableaux et palmarès pour la saison amateur masculine.",
    image: "/showcase/classic-arena.jpg",
  },
  {
    id: "pulse-cv",
    title: "Visibilité & CV",
    subtitle: "Visibilité joueur",
    description:
      "Score Visibilité, stats saison, galerie et CV en ligne. Votre vitrine sur le Mercato M.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
  {
    id: "carpool",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Proposez ou réservez une place pour matchs et détections. Lié aux événements Man.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "health",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés. Contact sécurisé depuis l'app Man.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "shop",
    title: "Boutique ProDay Man",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t shirts et maillots logo Pro Day Man. Précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
  },
] as const;

export const WOMAN_MODULES = [
  {
    id: "mercato-f",
    title: "Mercato F",
    subtitle: "Annonces féminines",
    description:
      "Joueuses et clubs F. Filtres poste, niveau, ville. Visibilité sur le foot féminin.",
    image: "/showcase/woman/woman-mercato.jpg",
  },
  {
    id: "matchs-f",
    title: "Matchs & convocations",
    subtitle: "Amicaux F",
    description:
      "Invitations club ↔ club, RSVP et relances pour vos équipes féminines.",
    image: "/showcase/woman/woman-match.jpg",
  },
  {
    id: "arena-f",
    title: "Arène",
    subtitle: "Tournois filles & F",
    description:
      "Inscriptions, tableaux et palmarès pour les tournois foot féminin.",
    image: "/showcase/woman/woman-arena.jpg",
  },
  {
    id: "profil-f",
    title: "Profil joueuse",
    subtitle: "Visibilité & CV en ligne",
    description:
      "Stats saison, galerie et CV joueuse éditable.",
    image: "/showcase/woman/woman-profile.jpg",
  },
  {
    id: "carpool-f",
    title: "Covoiturage",
    subtitle: "Trajets match & détection",
    description:
      "Proposez ou réservez une place pour matchs et détections. Lié aux événements Woman.",
    image: "/images/football-women-01.jpg",
  },
  {
    id: "health-f",
    title: "Pôle santé",
    subtitle: "Annuaire praticiens",
    description:
      "Kinés, coach mental, nutritionnistes vérifiés. Contact sécurisé depuis l'app Woman.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "shop-f",
    title: "Boutique ProDay Woman",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t shirts et maillots logo ProDay Woman. Précommande depuis l'app.",
    image: "/images/football-training-01.jpg",
  },
] as const;

export const PRODUCT_LINES = [
  {
    id: "homme" as const,
    brand: HOMME_BRAND,
    logo: UNIVERSE_LOGOS.homme,
    href: "/joueur?gender=men",
    image: "/showcase/classic-discover-hero.jpg",
    cta: "Pro Day Man",
  },
  {
    id: "woman" as const,
    brand: WOMAN_BRAND,
    logo: UNIVERSE_LOGOS.woman,
    href: "/joueur?gender=women",
    image: "/showcase/woman/woman-discover-hero.jpg",
    cta: "ProDay Woman",
  },
  {
    id: "amateur" as const,
    brand: AMATEUR_BRAND,
    logo: UNIVERSE_LOGOS.amateur,
    href: "/joueur",
    image: "/images/football-amateur-01.jpg",
    cta: "Pôle Joueur",
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
      "Profil recruteur vérifié, annonces Mercato Pro, suivi des candidatures et covoiturage détections.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "coach",
    title: "Coach Pro",
    subtitle: "Effectifs & recrutement",
    description:
      "Profil staff vérifié, annonces Mercato, convocations et stats candidatures. multi équipes.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "agent",
    title: "Agent ProDay",
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
      "Visibilité près des clubs. Messagerie après validation. Coach mental inclus.",
    image: "/images/football-health-01.jpg",
  },
  {
    id: "reseau",
    title: "Réseau Pro",
    subtitle: "Messagerie sécurisée",
    description:
      "Contacts vérifiés entre staff, agents et structures. Fini les échanges non tracés.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "sponsor",
    title: "Espace Partenaires",
    subtitle: "Visibilité & financement",
    description:
      "Offres sponsors, campagnes locales et tableau de bord. Depuis le module Sponsors de l'Accueil (pas un onglet barre).",
    image: "/images/football-club-01.jpg",
  },
] as const;

export const PRO_JOUEUR_MODULES = [
  {
    id: "carriere",
    title: "Accueil Carrière",
    subtitle: "Contrat & timeline",
    description:
      "Jours avant fin de contrat, consultations profil, essais et messages agent. Votre tableau de bord pro dès l'ouverture.",
    image: "/images/football-pro-01.jpg",
  },
  {
    id: "opportunites",
    title: "Opportunités",
    subtitle: "Essais & détections",
    description:
      "Offres filtrées par poste et niveau. Le circuit pro, pas le Mercato district.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "portfolio",
    title: "Portfolio scouting",
    subtitle: "Vidéos & stats coach",
    description:
      "Clips tagués par match, stats saison avec badge « Validé coach », export PDF pour les recruteurs.",
    image: "/showcase/classic-profile.jpg",
  },
  {
    id: "groupe",
    title: "Groupe",
    subtitle: "Convocations staff",
    description:
      "Entraînements et matchs officiels, transport groupe. Tu suis. Le staff pilote.",
    image: "/images/football-team-01.jpg",
  },
  {
    id: "pulse-pro",
    title: "Visibilité scouting",
    subtitle: "Score Accueil Carrière",
    description:
      "Profil, activité et confiance pour les shortlists. Intégré à l'Accueil. Pas un onglet en plus.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
  {
    id: "shop-pro-joueur",
    title: "Boutique joueur",
    subtitle: "Équipement & merch",
    description:
      "La boutique ProDay depuis l'onglet Boutique. Même catalogue que la communauté.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "sponsors-pro-joueur",
    title: "Partenariats",
    subtitle: "Offres marques",
    description:
      "Marques qui cherchent des joueurs visibles. Depuis le module Sponsors de l'Accueil Carrière.",
    image: "/images/football-club-01.jpg",
  },
] as const;

export const PRO_CLUB_MODULES = [
  {
    id: "structure",
    title: "Arbre des équipes",
    subtitle: "U13 → Seniors",
    description:
      "Toutes les catégories, coachs affectés et staff club. Lisible pour le bureau et le DS.",
    image: "/images/football-club-01.jpg",
  },
  {
    id: "bourse-club",
    title: "Bourse de recrutement",
    subtitle: "Vivier interne d’abord",
    description:
      "Poste manquant : matching sur équipe B, réserve et catégories voisines, propositions de montée (coach + club), avant de chercher dehors.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "pipeline-club",
    title: "Mercato & candidatures",
    subtitle: "Observé → Intégré",
    description:
      "Après le vivier interne : annonces, shortlist, essai et suivi kanban pour le bureau et la DS.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "convocations-club",
    title: "Convocations & retards",
    subtitle: "Présences centralisées",
    description:
      "RSVP, retard annoncé en 1–2 clics (joueur ou parent), feuille de présence visible par le coach — sans WhatsApp.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "covoiturage-club",
    title: "Covoiturage club",
    subtitle: "Matchs & entraînements",
    description:
      "Proposez ou réservez des places. Places visibles, contact conducteur en messagerie sécurisée, suivi pour les parents.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "tournois-club",
    title: "Tournois",
    subtitle: "Poules · Direct · QR",
    description:
      "Générateur de poules, Hub en direct, classements auto et page publique. Organisateur = rôle intégré au Club.",
    image: "/images/football-stadium-night-01.jpg",
  },
  {
    id: "communication-club",
    title: "Communication interne",
    subtitle: "Adhésions & annonces",
    description:
      "Messages structure, validation des adhésions et annonces internes. Sans multiplier les groupes.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "vitrine-club",
    title: "Vitrine & écosystème",
    subtitle: "Page club · équipements · caméras",
    description:
      "Logo, palmarès, marketplace, et Caméras & Vidéo multi marques (Veo, XbotGo, import…).",
    image: "/images/football-stadium-night-01.jpg",
  },
] as const;

export const PRO_STAFF_MODULES = [
  {
    id: "coach",
    title: "Tactique IA",
    subtitle: "Tableau · formations · IA",
    description:
      "Tableau interactif, compositions, banc, consignes et plans de jeu. Préparation match et débriefs automatiques.",
    image: "/images/football-tactics-01.jpg",
  },
  {
    id: "effectif",
    title: "Effectif & convocations",
    subtitle: "Présences · calendrier",
    description:
      "multi équipes, convocations, présences et calendrier. Rattaché aux permissions du Club.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "covoiturage-staff",
    title: "Covoiturage",
    subtitle: "Matchs & entraînements",
    description:
      "Trajets liés aux matchs, séances, tournois et stages. Parents en suivi live.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "agent",
    title: "Agent (rôle intégré)",
    subtitle: "CRM & mandats · 19,99 € lancement",
    description:
      "CRM joueurs, alertes géo, demandes de message et mandats. Rôle réseau : pas un pôle.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "recruiter",
    title: "Recruteur (rôle intégré)",
    subtitle: "Suivi & territoire",
    description:
      "Annonces Mercato, shortlists et filtres badge joueur. Couche réseau sous l’écosystème Club / Coach.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "reseau",
    title: "Réseau vérifié",
    subtitle: "Messagerie tracée",
    description:
      "Contacts validés entre coachs, agents et structures. Demandes joueur↔agent avant conversation active.",
    image: "/showcase/classic-exp-messages.jpg",
  },
] as const;

export const EVENEMENTS_MODULES = [
  {
    id: "create-events",
    title: "Créer un événement",
    subtitle: "Tournois · camps · détections",
    description:
      "Publiez tournois, académies, stages, détections, showcases ou événements partenaires depuis l’app organisateur.",
    image: "/showcase/classic-arena.jpg",
  },
  {
    id: "covoiturage-events",
    title: "Covoiturage événement",
    subtitle: "Différenciateur ProDay",
    description:
      "Coordonnez les trajets vers tournois et détections : places disponibles, réservation et messagerie conducteur.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "registration",
    title: "Inscriptions en ligne",
    subtitle: "Listes & capacités",
    description:
      "Ouverture / fermeture des inscriptions, liste d’attente automatique et suivi des participants.",
    image: "/showcase/classic-exp-team.jpg",
  },
  {
    id: "payments",
    title: "Paiements",
    subtitle: "Stripe Checkout",
    description:
      "Droits d’inscription encaissés via Stripe (carte). Paiement manuel possible côté organisateur.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "results-media",
    title: "Résultats & médias",
    subtitle: "Partage natif",
    description:
      "Publiez classements, ajoutez photos/vidéos et partagez depuis l’app avec clubs et joueurs.",
    image: "/images/football-stadium-night-01.jpg",
  },
] as const;

export const AMATEUR_MODULES = [
  {
    id: "joueur-amateur",
    title: "Espace joueur",
    subtitle: "CV & candidatures",
    description:
      "Profil, CV foot, candidatures Mercato et RSVP. Homme ou Femme. Sans badge de prestige.",
    image: "/showcase/classic-profile.jpg",
  },
  {
    id: "mercato-amateur",
    title: "Mercato",
    subtitle: "Recrutement & filtres",
    description:
      "Annonces, candidatures et filtres recruteur (genre, badge). Coach ? Pôle Coach.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "matchs-amateur",
    title: "Matchs & covoiturage",
    subtitle: "Le weekend organisé",
    description:
      "Invitations entre clubs, calendrier unifié, RSVP et covoiturage pour championnat, coupe ou amical.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "reseau-amateur",
    title: "Réseau de zone",
    subtitle: "Messagerie locale",
    description:
      "Contacts vérifiés avec joueurs et clubs du secteur. Un fil propre à la place de dix groupes.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "shop-amateur",
    title: "Boutique Amateur",
    subtitle: "Équipement & merch",
    description:
      "Maillots, entraînement et goodies ProDay. Depuis l'onglet Boutique.",
    image: "/images/football-pitch-01.jpg",
  },
  {
    id: "sponsors-amateur",
    title: "Sponsors locaux",
    subtitle: "Financement club",
    description:
      "Offres partenaires près de chez vous. Depuis le module Sponsors de l'Accueil Équipe.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "pulse-amateur",
    title: "Visibilité Accueil",
    subtitle: "Score de saison",
    description:
      "Votre score de visibilité vit sur l'Accueil Équipe, à côté de la saison. Pas un onglet en plus.",
    image: "/showcase/classic-exp-pulse.jpg",
  },
] as const;

export const SUPPORTER_MODULES = [
  {
    id: "matchs-supporter",
    title: "Matchs en direct",
    subtitle: "PRODAY & monde",
    description:
      "Scores live (API Football), filtres H/F/mixte et calendrier. La tribune s'ouvre le jour du match.",
    image: "/images/football-fans-01.jpg",
  },
  {
    id: "suivis-supporter",
    title: "Suivis illimités",
    subtitle: "Clubs · joueurs · tournois",
    description:
      "Ajoutez sans limite vos favoris. Alertes opt in depuis le profil. Zéro plafond d'abonnement.",
    image: "/images/football-supporter-01.jpg",
  },
  {
    id: "debats-supporter",
    title: "Débats & fil",
    subtitle: "La voix des tribunes",
    description:
      "Publications, réactions, débats match et question hebdo. Sans paywall.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "reels-supporter",
    title: "Moments & shop",
    subtitle: "Réels & merch",
    description:
      "Vidéos courtes des clubs suivis et boutique merch. Tout inclus. Sans abonnement store.",
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
      { label: "Saison", value: "Matchs & Arène" },
      { label: "Visibilité", value: "Visibilité & CV" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato M, matchs, Arène, Visibilité, covoiturage, santé et Boutique.",
    modules: MAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Pôle Joueur : joueurs uniquement. Coach ? Direction Pôle Coach.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueur",
    cta: {
      title: "Créez votre compte Man",
      description:
        "Inscription joueur en quelques minutes. Mercato M, CV en ligne et convocations.",
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
      { label: "Saison", value: "Matchs & Arène" },
      { label: "Visibilité", value: "Visibilité & CV F" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato F, matchs, Arène, Visibilité, covoiturage, santé et Boutique.",
    modules: WOMAN_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Pôle Joueur : joueuses uniquement. Coach ? Direction Pôle Coach.",
    showPulse: true,
    showVerification: false,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Tarif joueuse",
    cta: {
      title: "Créez votre compte Woman",
      description:
        "Inscription joueuse en quelques minutes. Mercato F et CV en ligne.",
      beta: "Liste d'attente Woman",
    },
  },
  amateur: {
    line: "amateur" as const,
    brand: AMATEUR_BRAND,
    hero: {
      title: "Le dimanche, sans le chaos.",
      image: "/images/football-amateur-01.jpg",
    },
    highlights: [
      { label: "Pour qui", value: "Joueurs" },
      { label: "Recrutement", value: "Mercato" },
      { label: "Saison", value: "Matchs & CV" },
      { label: "Badges", value: "Amateur → Pro" },
    ],
    modulesTitle: "Tout pour votre carrière joueur",
    modulesSubtitle:
      "Un seul espace joueur : CV, candidatures, matchs et badges. Coach ? Pôle Coach.",
    modules: AMATEUR_MODULES as readonly UniverseModule[],
    journeyIds: ["player"] as const,
    audienceNote:
      "Homme ou Femme à l'inscription. Coach ? Pôle Coach. Agent / recruteur = rôles intégrés.",
    showPulse: true,
    showVerification: true,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Formule Joueur",
    cta: {
      title: "Rejoindre le Pôle Joueur",
      description:
        "Inscription joueur rapide. Mercato, Pass Premium et covoiturage. Coach ? Pôle Coach.",
      beta: "Liste d'attente Joueur",
    },
  },
  supporter: {
    line: "supporter" as const,
    brand: SUPPORTER_BRAND,
    hero: {
      title: "La tribune. Sans paywall.",
      image: "/images/football-fans-01.jpg",
    },
    highlights: [
      { label: "Prix", value: "Toujours 0 €" },
      { label: "Direct", value: "PRODAY + monde" },
      { label: "Favoris", value: "Suivis illimités" },
      { label: "Voix", value: "Débats & moments" },
    ],
    modulesTitle: "La tribune numérique",
    modulesSubtitle:
      "Scores, suivis, fil et merch. Pas de Mercato. Pas d'abonnement. Le match, point.",
    modules: SUPPORTER_MODULES as readonly UniverseModule[],
    journeyIds: ["supporter"] as const,
    audienceNote:
      "Vous jouez ? Pôle Joueur. Vous coachez ? Pôle Coach. Vous représentez une marque ? Pôle Sponsor.",
    showPulse: false,
    showVerification: false,
    pricingPlanIds: [] as const,
    pricingTitle: "Gratuit. Sans abonnement store.",
    cta: {
      title: "Entrer dans la tribune",
      description:
        "Compte supporter gratuit. Direct le jour J, suivis sans limite, débats et boutique.",
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
      { label: "Rôles", value: "Club · Coach · Joueur" },
      { label: "Mercato", value: "Mercato Pro" },
      { label: "Confiance", value: "Profils vérifiés" },
      { label: "Réseau", value: "Messagerie sécurisée" },
    ],
    modulesTitle: "Modules professionnels",
    modulesSubtitle:
      "Coach, club et organisateur. Mercato Pro et suivi des candidatures.",
    modules: PRO_MODULES as readonly UniverseModule[],
    journeyIds: [
      "coach",
      "club",
      "organizer",
    ] as const,
    audienceNote:
      "Joueur ? Pôle Joueur. Structure ? Pôle Club. Coach ? Pôle Coach.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: [
      "coach_pro",
      "club_pro",
      "organizer_pro",
    ] as const,
    pricingTitle: "Formules Pro",
    cta: {
      title: "Créez votre compte Pro",
      description:
        "Coach, club ou organisateur. Validation métier incluse.",
      beta: "Liste d'attente Pro",
    },
  },
  pro_joueur: {
    line: "pro" as const,
    brand: PRO_JOUEUR_BRAND,
    hero: {
      title: "Votre carrière, hors CV Word.",
      image: "/images/football-action-01.jpg",
    },
    highlights: [
      { label: "Pour qui", value: "Joueurs sous contrat" },
      { label: "Focus", value: "Essais & opportunités" },
      { label: "Preuve", value: "Stats validées coach" },
      { label: "Réseau", value: "Agent & scouting" },
    ],
    modulesTitle: "La coque joueur pro",
    modulesSubtitle:
      "Accueil Carrière, portfolio scouting et opportunités. Distinct du Mercato district. Relié aux recruteurs.",
    modules: PRO_JOUEUR_MODULES as readonly UniverseModule[],
    journeyIds: ["pro_player"] as const,
    audienceNote:
      "Foot district / régional ? Pôle Joueur. Club ? Pôle Club. Coach ? Pôle Coach.",
    showPulse: true,
    showVerification: true,
    pricingPlanIds: ["player_plus"] as const,
    pricingTitle: "Formule Pro Joueur",
    cta: {
      title: "Passer en mode Pro Joueur",
      description:
        "Portfolio scouting, alertes clubs et mandat agent.",
      beta: "Liste d'attente Pro Joueur",
    },
  },
  pro_club: {
    line: "pro" as const,
    brand: PRO_CLUB_BRAND,
    hero: {
      title: "Le club au centre.",
      image: "/images/football-club-01.jpg",
    },
    highlights: [
      { label: "Pour qui", value: "Présidents & DS" },
      { label: "Organisation", value: "Multi catégories" },
      { label: "Offres", value: "Amateur → Premium" },
      { label: "Cœur", value: "Écosystème complet" },
    ],
    modulesTitle: "Piloter le club",
    modulesSubtitle:
      "Équipes, bourse interne, convocations, covoiturage, tournois et permissions. Cœur de ProDay.",
    modules: PRO_CLUB_MODULES as readonly UniverseModule[],
    journeyIds: ["club"] as const,
    audienceNote:
      "Joueurs : Pôle Joueur. Coachs : Pôle Coach. Agent / recruteur / organisateur = rôles intégrés.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: ["club_amateur", "club_pro", "club_premium"] as const,
    pricingTitle: "Offres Club (Amateur · Essentiel · Premium)",
    cta: {
      title: "Structurer le club sur ProDay",
      description:
        "Validation mandat, multi équipes et recrutement local. Pour le bureau et la direction sportive.",
      beta: "Liste d'attente Pro Club",
    },
  },
  pro_staff: {
    line: "pro" as const,
    brand: PRO_STAFF_BRAND,
    hero: {
      title: "Votre banc de touche.",
      image: "/showcase/classic-staff.jpg",
    },
    highlights: [
      { label: "Cœur", value: "Tactique IA" },
      { label: "Effectif", value: "Convocations" },
      { label: "IA", value: "Rapports auto" },
      { label: "Réseau", value: "Rôles optionnels" },
    ],
    modulesTitle: "Outils du Pôle Coach",
    modulesSubtitle:
      "Tactique IA, effectif, vidéo et IA pour le banc de touche.",
    modules: PRO_STAFF_MODULES as readonly UniverseModule[],
    journeyIds: ["coach", "organizer"] as const,
    audienceNote:
      "Joueur sous contrat ? Pro Joueur. Président / DS ? Pro Club. Marque ? Pôle Sponsor.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: [
      "coach_pro",
      "organizer_pro",
    ] as const,
    pricingTitle: "Formules Coach",
    cta: {
      title: "Rejoindre le Pôle Coach",
      description:
        "Tactique IA, effectif et outils du banc de touche.",
      beta: "Liste d'attente Coach",
    },
  },
} as const;

export type UniversePageId = keyof typeof UNIVERSE_PAGE_CONFIG;

export const VISION_PILLARS = [
  {
    title: "Mission",
    body: "Relier carrière, club et communauté dans le foot amateur. Sans surestimer l'IA.",
  },
  {
    title: "Aujourd'hui",
    body: "Profil, Mercato, score carrière, journal, analyse IA des highlights, sponsors, Arène, admin et contrôle parental. Dans une app React Native / Expo.",
  },
  {
    title: "IA honnête",
    body: "L'analyse Mistral porte sur vos séances enregistrées (highlight vidéo ou image + contexte). Ce n'est pas une détection automatique sur chaque geste en match.",
  },
  {
    title: "Demain",
    body: "image par image avancé, repérage talent mondial automatisé, paiements tournois. Voir Vision et roadmap pour le détail.",
  },
] as const;

export const ALL_PILLARS = [
  ...PILLARS,
  {
    id: "pulse-pillar",
    title: "Visibilité ProDay",
    subtitle: "Score de visibilité",
    description:
      "Score de visibilité : profil, activité et confiance.",
  },
  {
    id: "recruit-pillar",
    title: "Mercato",
    subtitle: "Filtres & candidatures",
    description:
      "Annonces filtrées, candidature depuis l'app, suivi des réponses.",
  },
  {
    id: "matches-pillar",
    title: "Matchs & Arène",
    subtitle: "Réseau d’adversaires",
    description:
      "Invitations de match entre clubs, amicaux, tournois locaux et palmarès intégrés au calendrier.",
  },
  {
    id: "calendar-pillar",
    title: "Convocations ProDay",
    subtitle: "RSVP & relances",
    description:
      "Présent, absent, peut être ou retard annoncé (< 10 min / ≥ 10 min). Avec relances et composition d'équipe.",
  },
  {
    id: "carpool-pillar",
    title: "Covoiturage",
    subtitle: "Différenciateur ProDay",
    description:
      "Proposez, cherchez, réservez une place et contactez le conducteur. Lié aux matchs, entraînements et événements.",
  },
  {
    id: "health-pillar",
    title: "Pôle santé",
    subtitle: "Kiné & coach mental",
    description:
      "Annuaire de praticiens vérifiés. Kinés, coach mental, nutrition. Messagerie sécurisée.",
  },
  {
    id: "shop-pillar",
    title: "Boutique ProDay",
    subtitle: "Équipement officiel",
    description:
      "Trépieds, t shirts et maillots par univers. Précommande depuis l'app.",
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
      "Moments forts en vertical. Visibilité pour votre profil.",
  },
  {
    id: "sponsors-pillar",
    title: "Espace partenaires",
    subtitle: "Sponsors & offres",
    description:
      "Annuaire partenaires, campagnes locales et financement clubs. Résultats mesurés.",
  },
  {
    id: "family-pillar",
    title: "Famille & mineurs",
    subtitle: "Espace sécurisé",
    description:
      "Contrôle parental, portail tuteur et espace jeunes.",
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
    "Sponsor et partenaire : même profil sur ProDay. Clubs, joueurs et organisateurs sur votre territoire. Visibilité mesurable. Sans intermédiaire.",
  footnote:
    "Tarifs HT. Mensuel ou annuel (−20 %). Résiliation à tout moment sur les formules en ligne.",
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
      "10 messages clubs / mois",
      "Statistiques de base",
    ],
  },
  {
    id: "territorial",
    name: "Territorial",
    tagline: "Visibilité sur un département",
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
    tagline: "Visibilité nationale sur ProDay",
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
      "Push géolocalisé local (bêta, opt in joueurs)",
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

export const SPONSOR_PARTNER_CONTACT_EMAIL = "proday.admin@gmail.com";

/** Miroir mobile : `src/content/clubOffers.ts` + `subscriptionPlans.ts`. */
export const PLAYER_PASS_PREMIUM_EUR = 3.99;

export const SUBSCRIPTION_PLANS_WEB = [
  {
    id: "player_plus",
    label: "Pass Joueur Premium",
    tagline: "Entraînements IA, stats avancées et passeport recruteur",
    monthlyEur: 3.99,
    storeAvailable: true,
    universes: ["homme", "woman", "amateur"] as ProductLineWeb[],
    freeIncludes: [
      "Profil & réseau",
      "Statistiques de base",
      "Événements & messagerie",
      "Convocations & covoiturage",
    ],
    proIncludes: [
      "Entraînements personnalisés IA",
      "Statistiques avancées & heatmaps",
      "Analyse vidéo",
      "Passeport recruteur",
      "Objectifs personnalisés & historique",
      "Comparaison avec d’autres joueurs",
    ],
  },
  {
    id: "coach_pro",
    label: "Coach Premium",
    tagline: "Tactique IA, IA, vidéo et préparation match",
    monthlyEur: 7.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil coach (parcours, diplômes, philosophie)",
      "1 équipe liée",
      "Calendrier & communication de base",
    ],
    proIncludes: [
      "Tactique IA (tableau, formations, banc)",
      "Assistant IA & rapports automatiques",
      "Analyse vidéo & adversaires",
      "Préparation des matchs",
      "Entraînements IA (collectifs & individuels)",
      "Convocations, présences, multi équipes",
    ],
  },
  {
    id: "club_amateur",
    label: "Club Amateur",
    tagline: "Essentiel pour les petits clubs",
    monthlyEur: 4.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil club",
      "1 équipe",
      "Covoiturage lecture",
    ],
    proIncludes: [
      "Gestion des licenciés",
      "Convocations & présences",
      "Calendrier & communication",
      "Covoiturage",
      "Résultats & classements automatiques",
    ],
  },
  {
    id: "club_pro",
    label: "Club Essentiel",
    tagline: "Gestion club ; coachs en abonnement individuel",
    monthlyEur: 11.99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil club et vérification",
      "1 équipe",
      "2 annonces Mercato Pro actives",
      "Vitrine publique",
    ],
    proIncludes: [
      "Gestion, convocations, présences",
      "Calendrier, communication, covoiturage",
      "Compétitions & classements",
      "multi équipes & suivi des candidatures",
      "Coachs : souscription individuelle Tactique IA",
    ],
  },
  {
    id: "club_premium",
    label: "Tout inclus",
    tagline: "Votre matériel",
    monthlyEur: 0,
    quoteOnly: true,
    priceHint: "À partir de 3 € / adhérent · sur devis",
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil club",
      "Vitrine publique",
    ],
    proIncludes: [
      "Tous les coachs, staff, dirigeants et joueurs",
      "Tactique IA, IA, analyse vidéo",
      "Statistiques, convocations, présences",
      "Calendrier, communication, covoiturage",
      "Analyse de forme & entraînements IA",
      "Suivi de charge & récupération déclarée",
      "Administration complète",
      "Pass Joueur Premium optionnel à 3,99 €/mois",
    ],
  },
  {
    id: "club_video_pro",
    label: "ProDay Pro + Veo",
    tagline: "Clé en main · achat, location ou caméra déjà possédée : prix admin",
    monthlyEur: 0,
    fixedAnnualEur: null,
    quoteOnly: true,
    priceHint: "À partir de 3 € / adhérent · sur devis (+ option caméra)",
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Connexion caméra existante",
    ],
    proIncludes: [
      "Toutes les fonctions Tout inclus (vidéo BYO)",
      "Caméra Veo (achat / location / déjà possédée)",
      "Trépied, installation, configuration, formation",
      "Cloud, synchronisation, traitement vidéo",
      "Analyse IA, découpage auto, bibliothèque, export",
    ],
  },
  {
    id: "organizer_pro",
    label: "Organisateur Pro",
    tagline: "Rôle intégré : tournois et détections",
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
      "Tournois Arène illimités",
      "Visibilité sponsors intégrée",
      "Relances participants",
      "Priorité fil événements",
    ],
  },
  {
    id: "sponsor_pro",
    label: "National Pro (partenaires)",
    tagline: "Formule premium. Espace partenaires dans l'app",
    monthlyEur: 99,
    storeAvailable: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Formule Découverte (0 €) : profil vérifié",
      "1 offre active dans l'annuaire",
      "Zone géographique (ville)",
      "10 messages clubs / mois",
    ],
    proIncludes: [
      "National Pro : offres illimitées",
      "Logo mis en avant (onglet Sponsors)",
      "Campagnes locales ciblées",
      "Espace partenaire dans l'app",
      "Push géolocalisé local (bêta, opt in joueurs)",
    ],
  },
] as const;

export type WebSubscriptionPlanBase = (typeof SUBSCRIPTION_PLANS_WEB)[number];
export type WebSubscriptionPlan = WebSubscriptionPlanBase & {
  yearlyEur: number;
};

function planFixedAnnualEur(plan: WebSubscriptionPlanBase): number | null | undefined {
  if (!("fixedAnnualEur" in plan)) return undefined;
  return (plan as { fixedAnnualEur?: number | null }).fixedAnnualEur;
}

function planIsQuoteOnly(plan: WebSubscriptionPlanBase): boolean {
  return "quoteOnly" in plan && Boolean((plan as { quoteOnly?: boolean }).quoteOnly);
}

function withYearly(plan: WebSubscriptionPlanBase): WebSubscriptionPlan {
  const fixed = planFixedAnnualEur(plan);
  if (planIsQuoteOnly(plan) || fixed === null) {
    return { ...plan, yearlyEur: 0 };
  }
  if (typeof fixed === "number") {
    return { ...plan, yearlyEur: fixed };
  }
  return { ...plan, yearlyEur: yearlyPriceFromMonthly(plan.monthlyEur) };
}

function womanPlayerPlusPlan(
  plan: WebSubscriptionPlanBase,
): WebSubscriptionPlan {
  return {
    ...withYearly(plan),
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
      return withYearly(p);
    },
  );
}

export function getWebPlanById(
  id: WebSubscriptionPlanBase["id"],
): WebSubscriptionPlan | null {
  const plan = SUBSCRIPTION_PLANS_WEB.find((p) => p.id === id);
  if (!plan) return null;
  return withYearly(plan);
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

/** Tarif Pro Day Pro pour partenaire / sponsor. Dérivé du plan store. */
export const PRO_ESSENTIAL_MONTHLY_EUR = webPlanMonthlyPrice("sponsor_pro");

/** Organisateur Arène. Dérivé du plan store. */
export const ORGANIZER_PRO_MONTHLY_EUR = webPlanMonthlyPrice("organizer_pro");

const faqPricing = (planId: WebSubscriptionPlanBase["id"]) => {
  const plan = SUBSCRIPTION_PLANS_WEB.find((p) => p.id === planId);
  if (plan && planIsQuoteOnly(plan)) {
    const hint =
      "priceHint" in plan && typeof (plan as { priceHint?: string }).priceHint === "string"
        ? (plan as { priceHint: string }).priceHint
        : null;
    return hint ?? "sur devis";
  }
  return formatAnnualPricingLine(webPlanMonthlyPrice(planId));
};

export const FAQ_ITEMS = [
  {
    category: "general",
    q: "ProDay remplace t il WhatsApp pour mon équipe ?",
    a: "ProDay regroupe convocations, invitations de match entre clubs, Mercato et stats. Fini les groupes WhatsApp pour trouver un adversaire. La messagerie reste pour les échanges directs.",
  },
  {
    category: "general",
    q: "L'app est elle gratuite ?",
    a: "Oui. Un compte gratuit couvre profil, réseau, calendrier et limites Mercato. Le Pass Joueur (3,99 €), les offres Club et Coach Premium débloquent les outils avancés. Le pôle Supporter reste 100 % gratuit.",
  },
  {
    category: "general",
    q: "Quels sont les cinq pôles ?",
    a: "Joueur, Club, Coach, Supporter et Sponsor. Agent, recruteur et organisateur sont des rôles intégrés : pas des pôles vitrine.",
  },
  {
    category: "general",
    q: "Comment fonctionne la bêta ?",
    a: "Inscrivez vous sur la liste d'attente. La bêta a été décalée au 15 août 2026 en raison d'améliorations nécessaires au bon développement de l'application. Les accès iOS (TestFlight) ouvrent à cette date ; Android via APK selon validation.",
  },
  {
    category: "general",
    q: "Puis je changer de pôle après inscription ?",
    a: "Oui, dans les paramètres du compte. Certaines fonctionnalités restent liées au rôle (ex. Tactique IA pour le coach ou offre Tout inclus).",
  },
  {
    category: "general",
    q: "Comment sécuriser mes données personnelles ?",
    a: "ProDay respecte le RGPD. Vos données sont chiffrées et vous contrôlez ce qui est visible. Vous pouvez supprimer votre compte et vos données à tout moment.",
  },
  {
    category: "general",
    q: "L'app fonctionne t elle hors ligne ?",
    a: "Certaines fonctions restent accessibles hors ligne (profil, stats enregistrées). Les mises à jour et la messagerie nécessitent une connexion.",
  },
  {
    category: "general",
    q: "Comment signaler un comportement inapproprié ?",
    a: "Utilisez le bouton de signalement sur un profil ou un message. L'équipe modère et peut suspendre les comptes qui enfreignent les règles.",
  },
  {
    category: "general",
    q: "Comment contacter le support ?",
    a: "Via le formulaire dans l'app ou la liste d'attente sur le site. Réponse sous 24 à 48 h ouvrés.",
  },
  {
    category: "tarifs",
    q: "Y a t il un engagement ?",
    a: "Non. Les abonnements ProDay sont sans engagement : tu peux résilier à tout moment selon les règles de l’App Store ou Google Play. Le sponsoring est possible via le pôle Sponsor (formules Découverte, Territorial, National Pro).",
  },
  {
    category: "tarifs",
    q: "Comment fonctionne le tarif mensuel vs annuel ?",
    a: `Le mensuel est le tarif de base. L'annuel facture 12 mois avec ${ANNUAL_DISCOUNT_PERCENT} % de remise. Exemple Pass Joueur : ${faqPricing("player_plus")}.`,
  },
  {
    category: "tarifs",
    q: "Quel tarif pour le Pass Joueur Premium ?",
    a: `Pass Joueur Premium : ${faqPricing("player_plus")}. Entraînements IA, stats avancées, heatmaps, analyse vidéo et passeport recruteur.`,
  },
  {
    category: "tarifs",
    q: "Quels tarifs pour le Club ?",
    a: `Club Amateur ${faqPricing("club_amateur")} : licenciés, convocations, calendrier, analyse de forme. Club Essentiel ${faqPricing("club_pro")} : compétitions, multi équipes (coachs en abo individuel). Tout inclus ${faqPricing("club_premium")} : Sur devis · À partir de 3 € / adhérent — Tactique IA + vidéo avec votre matériel. Option ProDay Pro + Veo (sur devis) pour le pack caméra clé en main.`,
  },
  {
    category: "tarifs",
    q: "Quel tarif pour Coach Premium ?",
    a: `Coach Premium : ${faqPricing("coach_pro")}. Tactique IA, assistant IA, analyse vidéo, préparation match et multi équipes.`,
  },
  {
    category: "tarifs",
    q: "Le Supporter est il payant ?",
    a: "Non. La tribune est 100 % gratuite : live, suivis illimités, débats et moments.",
  },
  {
    category: "tarifs",
    q: "Quel tarif pour Sponsor ?",
    a: `Partenaire / Sponsor : ${faqPricing("sponsor_pro")}. Visibilité, contact clubs et joueurs, KPIs de campagne. Tiers Découverte, Territorial et National selon l'ambition.`,
  },
  {
    category: "joueur",
    q: "Comment m’entraîner à la maison ou avec un coach ?",
    a: "Dans l’app : « Je veux m’entraîner ». Choisissez À la maison, Avec ma famille, ou Avec un coach. Le coaching humain se paie à l’heure (tarif du coach), sans abonnement obligatoire. Exemple 30 € : coach + commission ProDay + éventuelle part club.",
  },
  {
    category: "joueur",
    q: "Comment créer mon CV ProDay ?",
    a: "Le CV se remplit à partir du profil et des stats de match. Vous personnalisez les sections, ajoutez une photo et exportez en PDF pour les clubs.",
  },
  {
    category: "joueur",
    q: "Les stats sont elles automatiques ?",
    a: "Oui, si votre équipe utilise ProDay pour les matchs : buts, passes et temps de jeu se mettent à jour après chaque rencontre.",
  },
  {
    category: "joueur",
    q: "Qu'est ce que la Visibilité ProDay ?",
    a: "Score combinant profil, stats saison, candidatures et confiance. Plus il monte, plus vous êtes visible des clubs et recruteurs.",
  },
  {
    category: "joueur",
    q: "Comment fonctionne le covoiturage ?",
    a: "Proposez un trajet ou réservez une place pour matchs, entraînements et détections. Lié aux événements : comme un BlaBlaCar du foot.",
  },
  {
    category: "club",
    q: "Comment trouver un adversaire pour un match amical ?",
    a: "Dans Matchs, « Proposer un match » : recherchez un club (nom, ville, distance, catégorie), envoyez l’invitation. Le destinataire accepte, refuse ou propose une autre date. Une fois d’accord, le match est créé dans les deux calendriers avec convocations.",
  },
  {
    category: "club",
    q: "Comment gérer mon effectif ?",
    a: "Importez les licenciés, gérez équipes, convocations, présences, compétitions et covoiturage. Choisissez Amateur, Essentiel ou Tout inclus selon le budget.",
  },
  {
    category: "club",
    q: "La caméra est elle obligatoire ?",
    a: "Non. Le module vidéo accepte smartphone, tablette, Veo, Trace, Pixellot, Spiideo ou toute caméra compatible. Le matériel n’est jamais un frein à l’adoption.",
  },
  {
    category: "club",
    q: "Qu’est ce que ProDay Pro + Veo ?",
    a: "Option clé en main au dessus de Tout inclus : caméra Veo (achat, location ou déjà possédée), trépied, installation, formation, cloud, découpage auto et bibliothèque. Si le club a déjà une Veo, ProDay se connecte simplement. Prix sur devis. La vidéo smartphone / tablette reste disponible sans ce pack.",
  },
  {
    category: "club",
    q: "Qui paie Tactique IA dans le club ?",
    a: "En Club Essentiel (mensuel), les coachs s'abonnent individuellement. En Tout inclus et Pro + Veo, Tactique IA, IA et vidéo sont inclus pour le staff.",
  },
  {
    category: "coach",
    q: "Puis je proposer un match pour mon équipe ?",
    a: "Oui, si vous êtes autorisé par le club. Sélectionnez votre équipe, le club recherché, la catégorie, la date et le lieu. L’invitation suit le même circuit d’acceptation / contre proposition.",
  },
  {
    category: "coach",
    q: "Comment fonctionne la vérification coach ?",
    a: "Diplôme ou licence à l'inscription. Badge en revue puis validé. Messagerie complète après validation.",
  },
  {
    category: "coach",
    q: "Qu'est ce que Tactique IA ?",
    a: "Tableau tactique, formations, banc, disponibilité match, assistant IA, entraînements et analyse vidéo smartphone : le banc de touche digital.",
  },
  {
    category: "coach",
    q: "Comment trouver des joueurs ?",
    a: "Mercato ProDay : filtres poste, catégorie, niveau et zone. Les candidatures arrivent avec le CV du joueur.",
  },
  {
    category: "supporter",
    q: "Quelles fonctionnalités pour le supporter ?",
    a: "Suivez vos clubs, scores live, fil communautaire et moments. Tout est gratuit, sans paywall.",
  },
  {
    category: "sponsor",
    q: "Comment sponsoriser via ProDay ?",
    a: "Choisissez un tier (Découverte, Territorial, National), ciblez clubs et joueurs actifs, suivez les KPIs. Contact organisateurs et vitrine partenaire vérifiée.",
  },
  {
    category: "roles",
    q: "Qui peut publier sur le Mercato ?",
    a: "Clubs, coachs, agents et recruteurs (rôles réseau). Les joueurs candidatent sans publier d'annonces.",
  },
] as const;

export type FaqCategoryId = (typeof FAQ_ITEMS)[number]["category"];

export const FAQ_CATEGORIES: { id: FaqCategoryId | "all"; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "general", label: "Général" },
  { id: "tarifs", label: "Tarifs" },
  { id: "joueur", label: "Joueur" },
  { id: "club", label: "Club" },
  { id: "coach", label: "Coach" },
  { id: "supporter", label: "Supporter" },
  { id: "sponsor", label: "Sponsor" },
  { id: "roles", label: "Rôles intégrés" },
];


export const TESTIMONIALS = [
  {
    quote:
      "Enfin une app qui regroupe convocations, matchs et recrutement. Notre U17 ne jongle plus entre cinq groupes.",
    author: "Marc D.",
    role: "Coach",
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
      "Arène pour notre tournoi local : inscriptions et palmarès sur l'app, zéro tableur.",
    author: "Karim B.",
    role: "Organisateur tournoi",
  },
] as const;

export const ROADMAP_ITEMS = [
  {
    phase: "Livré",
    status: "done" as const,
    items: [
      "Tableau de bord & accueil IA",
      "Profil, Visibilité & CV en ligne",
      "Score carrière & timeline",
      "Journal d'activités",
      "Analyse IA highlights séance",
      "Mercato & candidatures",
      "Matchs & Stats en direct",
      "Gestion équipe",
      "Covoiturage",
      "Pôle santé",
      "Boutique ProDay",
      "Arène (tournois)",
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
      "Analyse vidéo image par image avancée",
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
  { feature: "Stats en direct vers profil", proday: true, whatsapp: false, excel: false },
  { feature: "Vérification staff", proday: true, whatsapp: false, excel: false },
  { feature: "Tournois Arène", proday: true, whatsapp: false, excel: "partial" as const },
  { feature: "Visibilité visibilité", proday: true, whatsapp: false, excel: false },
  { feature: "Covoiturage matchs", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Convocations & retards centralisés", proday: true, whatsapp: "partial" as const, excel: false },
  { feature: "Boutique ProDay intégré", proday: true, whatsapp: false, excel: false },
  { feature: "Recruteurs Mercato (club/coach/agent)", proday: true, whatsapp: false, excel: "partial" as const },
  { feature: "Reels & Fil communauté", proday: true, whatsapp: false, excel: false },
  { feature: "Espace partenaires & sponsors", proday: true, whatsapp: false, excel: false },
  { feature: "Contrôle parental & espace famille", proday: true, whatsapp: false, excel: false },
] as const;

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "Si tu pouvais accomplir une seule chose cette saison, ce serait quoi ?",
    options: [
      { label: "Décrocher un contrat dans un club qui me correspond", role: "player" },
      { label: "Mener mon équipe vers la victoire et voir mes joueurs progresser", role: "coach" },
      { label: "Faire grandir mon club et le rendre plus professionnel", role: "club" },
      { label: "Créer des événements inoubliables pour la communauté", role: "organizer" },
    ],
  },
  {
    id: "q2",
    question: "Dans ton quotidien, ce qui te ferait vraiment gagner du temps, c'est quoi ?",
    options: [
      { label: "Avoir mon profil visible par les recruteurs sans effort", role: "player" },
      { label: "Gérer facilement mes joueurs, convocations et diplômes", role: "coach" },
      { label: "Centraliser tout mon club, équipes et calendriers au même endroit", role: "club" },
      { label: "Automatiser les inscriptions et l'organisation des tournois", role: "organizer" },
    ],
  },
  {
    id: "q3",
    question: "Ce qui te motive le plus dans le foot, c'est quoi ?",
    options: [
      { label: "La compétition et l'envie de me dépasser chaque jour", role: "player" },
      { label: "Transmettre mon savoir et voir des talents s'épanouir", role: "coach" },
      { label: "Construire quelque chose de durable et structuré", role: "club" },
      { label: "Rassembler les gens et créer des moments forts", role: "organizer" },
    ],
  },
  {
    id: "q4",
    question: "Le weekend, tu passes ton temps plutôt à…",
    options: [
      { label: "M'entraîner, jouer et analyser mes performances", role: "player" },
      { label: "Préparer mes séances et suivre mes joueurs", role: "coach" },
      { label: "Gérer l'administratif et l'organisation du club", role: "club" },
      { label: "Coordonner des événements et gérer les logistiques", role: "organizer" },
    ],
  },
  {
    id: "q5",
    question: "En vrai, ton rêve dans le foot, c'est quoi ?",
    options: [
      { label: "Me faire repérer et vivre de ma passion", role: "player" },
      { label: "Devenir un coach reconnu et former des champions", role: "coach" },
      { label: "Diriger un club pro et le mener au sommet", role: "club" },
      { label: "Organiser des compétitions de référence dans ma région", role: "organizer" },
    ],
  },
] as const;

export const QUIZ_RESULTS: Record<
  string,
  { title: string; description: string; thought: string; href: string; cta: string }
> = {
  player: {
    title: "Profil sportif",
    description: "Visibilité, stats et opportunités. Un profil joueur réel, sans badge de prestige.",
    thought: "Le foot, c'est avant tout une question de passion et de dépassement de soi. Chaque entraînement, chaque match compte pour construire ton parcours. ProDay t'accompagne pour que ton talent ne passe plus inaperçu.",
    href: "/joueur",
    cta: "Voir le pôle Joueur",
  },
  coach: {
    title: "Profil Coach",
    description: "Tactique IA, effectif, convocations, IA et analyse vidéo. Pôle Coach.",
    thought: "Un coach, c'est bien plus qu'un tacticien. C'est un mentor, un guide qui façonne les caractères et construit les champions de demain. Ta vision mérite d'être structurée et reconnue.",
    href: "/coach",
    cta: "Voir le Pôle Coach",
  },
  recruiter: {
    title: "Profil Recruteur",
    description: "Rôle intégré : scouting, filtres badge et suivi des candidatures.",
    thought: "Repérer le talent, c'est un art. Entre intuition et analyse, tu cherches ces pépites qui feront la différence demain. ProDay te donne les outils pour transformer cette vision en réalité.",
    href: "/coach",
    cta: "Voir les rôles réseau",
  },
  club: {
    title: "Profil Club",
    description: "Cœur de ProDay : équipes, compétitions, convocations et covoiturage.",
    thought: "Un club, c'est une famille, une vision, un projet. Construire quelque chose de durable demande de la rigueur et de l'organisation. Ton ambition mérite les meilleurs outils pour grandir.",
    href: "/pro-club",
    cta: "Voir le Pôle Club",
  },
  organizer: {
    title: "Profil Organisateur",
    description: "Rôle intégré au Club : tournois, détections et stages.",
    thought: "Créer des moments inoubliables, rassembler la communauté autour d'une passion commune. C'est ça, la magie de l'organisation. ProDay simplifie la logistique pour que tu puisses te concentrer sur l'essentiel.",
    href: "/pro-club",
    cta: "Voir le Pôle Club",
  },
  woman: {
    title: "Univers ProDay Woman",
    description: "Mercato F, matchs et profil joueuse dans le Pôle Joueur unifié.",
    thought: "Le foot féminin écrit son histoire chaque jour. Talenteuse, déterminée, tu portes l'avenir de ce sport. ProDay t'offre la visibilité que tu mérites pour briller.",
    href: "/joueur",
    cta: "Voir le pôle Joueur",
  },
  parent: {
    title: "Pro Day Parent",
    description: "Pôle Parent — supervision, contacts approuvés et limites de temps.",
    thought: "Voir son enfant s'épanouir sur le terrain, c'est une fierté immense. L'accompagner dans son parcours demande du temps, de l'écoute et les bons outils. ProDay facilite ce rôle de guide.",
    href: "/parent",
    cta: "Ouvrir le Pôle Parent",
  },
  agent: {
    title: "Profil Agent",
    description: "Rôle intégré : CRM, demandes de message et mandats. Offre Agent ProDay.",
    thought: "Un agent, c'est le lien entre le talent et l'opportunité. Tu connais la valeur de chaque joueur et tu sais où elle peut s'exprimer. ProDay te donne la visibilité pour faire les bons matchs.",
    href: "/coach",
    cta: "Voir les rôles réseau",
  },
  homme: {
    title: "Pro Day Man",
    description: "Foot masculin. Mercato, matchs, Arène et CV dans le Pôle Joueur.",
    thought: "Le foot amateur, c'est la passion pure. Sans pression, juste le plaisir de jouer et de progresser. ProDay te permet de vivre cette passion avec des outils professionnels.",
    href: "/joueur",
    cta: "Voir le pôle Joueur",
  },
  pro: {
    title: "Univers Pro Day",
    description: "Club et Coach au centre. Agent, recruteur et organisateur en rôles intégrés.",
    thought: "L'excellence demande un environnement d'excellence. Tu évolues dans un monde où chaque détail compte, chaque relation est précieuse. ProDay t'offre l'écosystème qui correspond à tes ambitions.",
    href: "/coach",
    cta: "Voir le Pôle Coach",
  },
};

export const SHOP_HIGHLIGHTS = [
  {
    name: "Trépied ProDay",
    priceEur: 34.9,
    description: "Filmez matchs et séquences pour votre CV. Sac de transport inclus.",
  },
  {
    name: "T shirt officiel",
    priceEur: 29.9,
    description: "Textile logo brodé. Par univers Man, Woman ou Pro.",
  },
  {
    name: "Maillot match",
    priceEur: 59.9,
    description: "Maillot domicile ou extérieur. Nom et numéro en option.",
  },
] as const;

export const LIVE_STAT_EVENTS = [
  { type: "goal", label: "But", points: 1 },
  { type: "assist", label: "Passe décisive", points: 1 },
  { type: "yellow", label: "Carton jaune", points: 0 },
  { type: "save", label: "Arrêt (GK)", points: 1 },
] as const;
