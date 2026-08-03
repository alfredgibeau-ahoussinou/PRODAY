import {
  ANNUAL_DISCOUNT_PERCENT,
  formatAnnualPricingLine,
  yearlyPriceFromMonthly,
} from "./pricing";

export const BRAND = {
  name: "ProDay",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  logo: "/branding/logo-proday-official.png",
  /** Phrase d’accueil : ce que fait l’app, en une ligne. */
  mission:
    "L'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit.",
  heroSupport:
    "Que tu sois joueur, coach, club ou supporter, ProDay t'accompagne. La bêta est ouverte.",
} as const;

/** Pitch honnête : capacités réelles vs ambition long terme. Pas de métriques fictives. */
export const PRODUCT_VISION = {
  intro:
    "ProDay relie carrière, club et communauté dans le foot amateur et semi-pro. On parle de ce qui existe dans l'app. Et de ce qui arrive ensuite.",
  disclaimer:
    "Les chiffres du site décrivent le produit, pas l'audience en direct. L'analyse IA porte sur vos highlights de séance (vidéo ou image + notes). Pas sur chaque action en match.",
  today: {
    title: "Aujourd'hui",
    lead: "Ce qui est disponible ou en déploiement dans l'app.",
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
    lead: "Ambitions produit. Pas encore livrées. Pas de promesse marketing ici.",
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
    title: "Tournois Arena",
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
    "Le foot masculin amateur. Mercato M, matchs, Arena, Visibilité, CV joueur, covoiturage, santé et Shop. Réservé aux joueurs.",
  accent: "#0054F0",
  accentDark: "#001854",
} as const;

export const AMATEUR_BRAND = {
  name: "Pro Day Joueur",
  shortName: "Joueur",
  fullName: "Pro Day Joueur",
  logo: UNIVERSE_LOGOS.amateur,
  tagline: "Amateur · Centre · Pro",
  mission:
    "Un seul Pôle Joueur. Badges Amateur, Centre de formation / Aspirant ou Professionnel. Mercato, CV et carrière — signature pro sans changer d'environnement.",
  accent: "#0054F0",
  accentDark: "#001854",
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
  accent: "#3C00F0",
  accentDark: "#180078",
} as const;

export const PRO_BRAND = {
  name: "Pro Day Pro",
  shortName: "Pro",
  fullName: "Pro Day Pro",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "EXPERTISE • RÉSEAU • PERFORMANCE",
  mission:
    "Coach, agent, club recruteur et organisateur. Mercato Pro, scouting, convocations et réseau vérifié.",
  accent: "#006CFC",
  accentDark: "#002478",
} as const;

export const PRO_JOUEUR_BRAND = {
  name: "Pro Day Joueur",
  shortName: "Joueur",
  fullName: "Pro Day Joueur",
  logo: UNIVERSE_LOGOS.homme,
  tagline: "Amateur → Pro · Badges",
  mission:
    "Même profil du district au contrat pro. Badge Professionnel (jaune) à la signature. Portfolio, essais, scouting et mandat agent.",
  accent: "#0054F0",
  accentDark: "#001854",
} as const;

export const EVENEMENTS_BRAND = {
  name: "Pro Day Événements",
  shortName: "Événements",
  fullName: "Pro Day Événements",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "Tournois · Académies · Détections",
  mission:
    "Espace organisateurs : créez des événements, inscriptions en ligne, paiements, listes, résultats et partage média.",
  accent: "#0891B2",
  accentDark: "#0e4a5c",
} as const;

export const PRO_CLUB_BRAND = {
  name: "Pro Day Pro Club",
  shortName: "Pro Club",
  fullName: "Pro Day Pro Club",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "U13 → Seniors · Une structure",
  mission:
    "Équipes, coachs, adhésions, recrutement et page publique. Pour présidents, DS et secrétariat.",
  accent: "#006CFC",
  accentDark: "#002478",
} as const;

export const PRO_STAFF_BRAND = {
  name: "Pro Day Pro Staff",
  shortName: "Pro Staff",
  fullName: "Pro Day Pro Staff",
  logo: UNIVERSE_LOGOS.pro,
  tagline: "Agent · Recruteur · Coach · Arena",
  mission:
    "Mercato Pro, shortlists, mandats et tournois Arena pour agent, recruteur, coach et organisateur. Profils vérifiés. Messagerie tracée.",
  accent: "#3B5BFF",
  accentDark: "#001848",
} as const;

/** Message waitlist / page beta */
export const BETA_PITCH = {
  summary:
    "Inscrivez-vous sur la liste d'attente. Bêta iOS via TestFlight à partir du 11 août 2026 à 18 h.",
  dailyUpdates:
    "Les inscrits reçoivent des emails réguliers : date iOS, ouverture TestFlight, astuces et nouveautés (tous les 2 jours après le lancement).",
  launch:
    "Bêta iOS ouverte le 11 août 2026 à 18 h — lien TestFlight envoyé par email. APK Android disponible dès validation.",
  iosLaunchLabel: "11 août 2026 à 18 h",
} as const;

export const MODULES = [
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
    subtitle: "Trajets match & détection",
    description:
      "Coachs et joueurs proposent ou réservent des places. Lié aux événements et convocations.",
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
    title: "ProDay Shop",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots officiels par univers. Précommande depuis l'app.",
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
      "Piloter le pipeline candidatures",
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
      "Créer un tournoi Arena",
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
  { value: "9+", label: "Onglets dynamiques", note: "Architecture produit" },
  { value: "12", label: "Piliers produit", note: "Modules illustratifs" },
  { value: "3", label: "Univers Man · Woman · Pro", note: "Offre éditoriale" },
  { value: "3", label: "Formules partenaires", note: "Grille tarifaire" },
] as const;

/** Bandeau légal. chiffres marketing, pas des métriques live */
export const STATS_DISCLAIMER =
  "Chiffres illustratifs du produit. Pas des stats d'usage en temps réel.";

export const SANTE_BRAND = {
  name: "Pro Day Santé",
  shortName: "Santé",
  fullName: "Pro Day Santé",
  logo: UNIVERSE_LOGOS.sante,
  tagline: "Kiné · Mental · Nutrition",
  mission:
    "L'annuaire santé du foot. Praticiens vérifiés près des clubs, agenda, téléconsultation HDS et contenus éducatifs. Distinct du pôle Pro Staff.",
  accent: "#00CCB4",
  accentDark: "#006C60",
} as const;

export const WOMAN_BRAND = {
  name: "ProDay Woman",
  shortName: "Woman",
  fullName: "ProDay Woman",
  logo: UNIVERSE_LOGOS.woman,
  tagline: "JOUER • BRILLER • GRANDIR",
  mission:
    "Le foot au féminin. Mercato F, matchs, Arena, Visibilité, CV joueuse, covoiturage, santé et Shop. Réservé aux joueuses.",
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
    title: "ProDay Shop Man",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo Pro Day Man. Précommande depuis l'app.",
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
      "Proposez ou acceptez un match. RSVP et relances pour vos équipes féminines.",
    image: "/showcase/woman/woman-match.jpg",
  },
  {
    id: "arena-f",
    title: "Arena",
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
    title: "ProDay Shop Woman",
    subtitle: "Équipement & textile",
    description:
      "Trépieds, t-shirts et maillots logo ProDay Woman. Précommande depuis l'app.",
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
      "Profil staff vérifié, annonces Mercato, convocations et stats candidatures. Multi-équipes.",
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
    title: "Shop joueur",
    subtitle: "Équipement & merch",
    description:
      "La boutique ProDay depuis l'onglet Shop. Même catalogue que la communauté.",
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
    id: "recrutement-club",
    title: "Recrutement club",
    subtitle: "Annonces & shortlist",
    description:
      "Publiez « Cherche gardien U17 F », recevez les candidatures et constituez votre shortlist locale.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "pipeline-club",
    title: "Pipeline candidatures",
    subtitle: "Kanban recrutement",
    description:
      "Boîte de réception → revue → shortlist → essai → offre → recruté. Suivi simple pour le bureau et la DS.",
    image: "/showcase/classic-mercato.jpg",
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
    title: "Vitrine publique",
    subtitle: "Page club",
    description:
      "Logo, palmarès, catégories. Visible des supporters et des recruteurs du territoire. Calendrier & convocations : Pôle Staff.",
    image: "/images/football-stadium-night-01.jpg",
  },
] as const;

export const PRO_STAFF_MODULES = [
  {
    id: "recruiter",
    title: "Recruteur Pro",
    subtitle: "Pipeline & territoire",
    description:
      "Annonces Mercato Pro, shortlists par poste, covoiturage détections. Un pipeline clair. Pas un tableur.",
    image: "/showcase/classic-mercato.jpg",
  },
  {
    id: "coach",
    title: "Coach Pro",
    subtitle: "Effectifs, calendrier & convocations",
    description:
      "Multi-équipes, calendrier structure, convocations premium et stats. Le calendrier club vit ici — plus dans le Club freemium.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "agent",
    title: "Agent Elite",
    subtitle: "CRM & mandats · 19,99 € lancement",
    description:
      "CRM joueurs, alertes géo, demandes de message (accept/refuse) et mandats. 19,99 €/mois pour les 20 premiers, puis 29,99 €.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "calendrier-staff",
    title: "Calendrier structure",
    subtitle: "Saison multi-équipes",
    description:
      "Vue agrégée matchs et entraînements de la structure. Porté par le Staff, plus par le Club free.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "reseau",
    title: "Réseau Pro vérifié",
    subtitle: "Messagerie tracée",
    description:
      "Contacts validés entre staff, agents et structures. Demandes joueur↔agent avant conversation active.",
    image: "/showcase/classic-exp-messages.jpg",
  },
] as const;

export const EVENEMENTS_MODULES = [
  {
    id: "create-events",
    title: "Créer un événement",
    subtitle: "Tournois · camps · détections",
    description:
      "Publiez tournois, académies, stages, détections, showcases ou événements partenaires.",
    image: "/showcase/classic-arena.jpg",
  },
  {
    id: "registration",
    title: "Inscriptions en ligne",
    subtitle: "Listes & capacités",
    description:
      "Ouverture / fermeture des inscriptions, liste d'attente et export participants.",
    image: "/showcase/classic-exp-team.jpg",
  },
  {
    id: "payments",
    title: "Paiements",
    subtitle: "Bientôt",
    description:
      "Encaissement des droits d'inscription. TODO : Stripe / IAP — scaffolding prêt côté modèle.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "results-media",
    title: "Résultats & médias",
    subtitle: "Partage",
    description:
      "Scores, classements et galerie. Partagez les moments forts avec clubs et joueurs.",
    image: "/images/football-stadium-night-01.jpg",
  },
] as const;

export const AMATEUR_MODULES = [
  {
    id: "joueur-amateur",
    title: "Espace joueur",
    subtitle: "CV & candidatures",
    description:
      "Profil, CV foot, candidatures Mercato Amateur et RSVP. Foot M ou F dès l'inscription.",
    image: "/showcase/classic-profile.jpg",
  },
  {
    id: "coach-amateur",
    title: "Espace coach",
    subtitle: "Effectif & feuille",
    description:
      "Diplôme vérifié, effectif, convocations et stats saison. Du district au régional.",
    image: "/showcase/classic-staff.jpg",
  },
  {
    id: "mercato-amateur",
    title: "Mercato Amateur",
    subtitle: "Recrutement de proximité",
    description:
      "Annonces locales, candidatures et réponses suivies. Sans la complexité du Mercato Pro.",
    image: "/images/football-mercato-01.jpg",
  },
  {
    id: "matchs-amateur",
    title: "Matchs & covoiturage",
    subtitle: "Le week-end organisé",
    description:
      "Calendrier unifié, RSVP joueurs et covoiturage pour championnat, coupe ou amical.",
    image: "/images/football-match-01.jpg",
  },
  {
    id: "reseau-amateur",
    title: "Réseau de zone",
    subtitle: "Messagerie locale",
    description:
      "Contacts vérifiés avec joueurs, clubs et coachs du secteur. Un fil propre à la place de dix groupes.",
    image: "/showcase/classic-exp-messages.jpg",
  },
  {
    id: "shop-amateur",
    title: "Shop Amateur",
    subtitle: "Équipement & merch",
    description:
      "Maillots, entraînement et goodies ProDay. Depuis l'onglet Shop.",
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
      "Scores live (API-Football), filtres H/F/mixte et calendrier. La tribune s'ouvre le jour du match.",
    image: "/images/football-fans-01.jpg",
  },
  {
    id: "suivis-supporter",
    title: "Suivis illimités",
    subtitle: "Clubs · joueurs · tournois",
    description:
      "Ajoutez sans limite vos favoris. Alertes opt-in depuis le profil. Zéro plafond d'abonnement.",
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
      { label: "Saison", value: "Matchs & Arena" },
      { label: "Visibilité", value: "Visibilité & CV" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato M, matchs, Arena, Visibilité, covoiturage, santé et Shop.",
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
      { label: "Saison", value: "Matchs & Arena" },
      { label: "Visibilité", value: "Visibilité & CV F" },
    ],
    modulesTitle: "Tout pour votre saison",
    modulesSubtitle:
      "Mercato F, matchs, Arena, Visibilité, covoiturage, santé et Shop.",
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
      { label: "Pour qui", value: "Joueurs & coachs" },
      { label: "Recrutement", value: "Mercato de zone" },
      { label: "Saison", value: "Matchs & effectif" },
      { label: "Terrain", value: "District → régional" },
    ],
    modulesTitle: "Tout le week-end amateur",
    modulesSubtitle:
      "Deux espaces dans une même coque : joueur (CV, candidatures) et coach (effectif, convocations). Distinct du pôle Pro.",
    modules: AMATEUR_MODULES as readonly UniverseModule[],
    journeyIds: ["player", "coach"] as const,
    audienceNote:
      "Foot M ou F : vous choisissez à l'inscription. Staff pro, agent ou DS ? Direction les pôles Pro.",
    showPulse: true,
    showVerification: true,
    pricingPlanIds: ["player_plus", "coach_pro"] as const,
    pricingTitle: "Formules Amateur",
    cta: {
      title: "Rejoindre le pôle Amateur",
      description:
        "Joueur ou coach. Inscription rapide. Validation diplôme pour les coachs. Mercato local dès le premier profil.",
      beta: "Liste d'attente Amateur",
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
      { label: "Live", value: "PRODAY + monde" },
      { label: "Favoris", value: "Suivis illimités" },
      { label: "Voix", value: "Débats & moments" },
    ],
    modulesTitle: "La tribune numérique",
    modulesSubtitle:
      "Scores, suivis, fil et merch. Pas de Mercato. Pas d'abonnement. Le match, point.",
    modules: SUPPORTER_MODULES as readonly UniverseModule[],
    journeyIds: ["supporter"] as const,
    audienceNote:
      "Vous jouez ou vous coachez ? Pôle Amateur ou Pro. Vous représentez une marque ? Pôle Sponsor.",
    showPulse: false,
    showVerification: false,
    pricingPlanIds: [] as const,
    pricingTitle: "Gratuit. Sans abonnement store.",
    cta: {
      title: "Entrer dans la tribune",
      description:
        "Compte supporter gratuit. Live le jour J, suivis sans limite, débats et shop.",
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
      "Recruteur, coach, agent, club et organisateur. Mercato Pro et pipeline candidatures.",
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
        "Recruteur, coach, agent, club ou organisateur. Validation métier incluse.",
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
      "Foot district / régional ? Pôle Amateur. Vous recrutez ou vous représentez ? Pôle Pro Staff ou Pro Club.",
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
      title: "Club : équipes, recrutement, vitrine.",
      image: "/images/football-club-01.jpg",
    },
    highlights: [
      { label: "Pour qui", value: "Présidents & DS" },
      { label: "Organisation", value: "Multi-catégories" },
      { label: "Recrutement", value: "Annonces actives" },
      { label: "Image", value: "Vitrine publique" },
    ],
    modulesTitle: "Piloter la structure",
    modulesSubtitle:
      "Arbre des équipes, adhésions, calendrier global et page publique.",
    modules: PRO_CLUB_MODULES as readonly UniverseModule[],
    journeyIds: ["club"] as const,
    audienceNote:
      "Joueurs et coachs d'équipe restent sur Pro Joueur ou Amateur. Métiers staff (agent, recruteur) : Pro Staff.",
    showPulse: false,
    showVerification: true,
    pricingPlanIds: ["club_pro"] as const,
    pricingTitle: "Formule Pro Club",
    cta: {
      title: "Structurer le club sur ProDay",
      description:
        "Validation mandat, multi-équipes et recrutement local. Pour le bureau et la direction sportive.",
      beta: "Liste d'attente Pro Club",
    },
  },
  pro_staff: {
    line: "pro" as const,
    brand: PRO_STAFF_BRAND,
    hero: {
      title: "Votre métier. Votre espace.",
      image: "/showcase/classic-staff.jpg",
    },
    highlights: [
      { label: "Métiers", value: "4 profils staff" },
      { label: "Marché", value: "Mercato Pro" },
      { label: "Agent", value: "Mandats & CRM" },
      { label: "Confiance", value: "Profils vérifiés" },
    ],
    modulesTitle: "Outils des métiers pro",
    modulesSubtitle:
      "Recruteur, coach pro, agent et organisateur Arena. Messagerie tracée entre profils vérifiés.",
    modules: PRO_STAFF_MODULES as readonly UniverseModule[],
    journeyIds: ["coach", "recruiter", "agent", "organizer"] as const,
    audienceNote:
      "Joueur sous contrat ? Pro Joueur. Président / DS ? Pro Club. Marque ? Pôle Sponsor.",
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
      title: "Rejoindre le pôle Pro Staff",
      description:
        "Agent, recruteur, coach pro ou organisateur. Validation diplôme ou licence. Puis le terrain.",
      beta: "Liste d'attente Pro Staff",
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
    body: "Profil, Mercato, score carrière, journal, analyse IA des highlights, sponsors, Arena, admin et contrôle parental. Dans une app React Native / Expo.",
  },
  {
    title: "IA honnête",
    body: "L'analyse Mistral porte sur vos séances enregistrées (highlight vidéo ou image + contexte). Ce n'est pas une détection automatique sur chaque geste en match.",
  },
  {
    title: "Demain",
    body: "Frame-by-frame avancé, repérage talent mondial automatisé, paiements tournois. Voir Vision et roadmap pour le détail.",
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
      "Présent, absent ou peut-être. Avec relances et composition d'équipe.",
  },
  {
    id: "carpool-pillar",
    title: "Covoiturage",
    subtitle: "Trajets partagés",
    description:
      "Proposez ou réservez une place pour matchs et détections.",
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
    title: "ProDay Shop",
    subtitle: "Équipement officiel",
    description:
      "Trépieds, t-shirts et maillots par univers. Précommande depuis l'app.",
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
      "Push géolocalisé local (bêta, opt-in joueurs)",
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
      "Vitrine publique (sans convocations)",
    ],
    proIncludes: [
      "Annonces actives illimitées",
      "Multi-équipes",
      "Priorité dans le fil Mercato Pro",
      "Pipeline candidatures kanban",
    ],
  },
  {
    id: "agent_elite",
    label: "Agent Elite",
    tagline: "Lancement 19,99 € (20 premiers) puis 29,99 €/mois",
    monthlyEur: 29.99,
    storeAvailable: true,
    premium: true,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil agent et vérification",
      "10 contacts recrutement / mois",
      "Mercato en lecture",
      "Demandes de message joueurs",
    ],
    proIncludes: [
      "Contacts illimités",
      "Alertes géolocalisées",
      "Pipeline mandats",
      "Exports et rapports",
    ],
  },
  {
    id: "sante_visio_gratuit",
    label: "Visio gratuite",
    tagline: "Téléconsultations 15 et 30 min. Sans abonnement",
    monthlyEur: 0,
    storeAvailable: false,
    universes: ["sante"] as ProductLineWeb[],
    freeIncludes: [
      "Téléconsultation Daily (15 ou 30 min)",
      "Rejoindre la visio en un tap (praticien et joueur)",
      "Prise de rendez-vous via l'app",
      "Salle sécurisée sans formulaire externe",
      "Aucune carte bancaire requise",
    ],
    proIncludes: [
      "Passez à Cabinet Pro pour la visibilité prioritaire près des clubs",
    ],
  },
  {
    id: "physio_pro",
    label: "Pôle santé Pro",
    tagline: "Abonnement léger + visibilité clubs. Commission sur les RDV",
    monthlyEur: 19.99,
    storeAvailable: true,
    commissionPercent: 10,
    commissionNote:
      "10 % sur chaque consultation réservée via ProDay (nutrition, coach mental, prépa…). Pas de commission sur les actes médicaux réglementés.",
    universes: ["pro", "sante"] as ProductLineWeb[],
    freeIncludes: [
      "Profil praticien et vérification",
      "Spécialité et zone d'intervention",
      "Visibilité annuaire (base)",
      "Téléconsultation visio 15/30 min (incluse)",
      "Messagerie limitée",
    ],
    proIncludes: [
      "Visibilité prioritaire près des clubs",
      "Messagerie complète après vérif.",
      "Prise de rendez-vous prioritaire",
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
      "Push géolocalisé local (bêta, opt-in joueurs)",
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

/** Tarif Pro Day Pro pour partenaire / sponsor. Dérivé du plan store. */
export const PRO_ESSENTIAL_MONTHLY_EUR = webPlanMonthlyPrice("sponsor_pro");

/** Organisateur Arena. Dérivé du plan store. */
export const ORGANIZER_PRO_MONTHLY_EUR = webPlanMonthlyPrice("organizer_pro");

/** Pôle santé. Dérivé du plan store. */
export const PHYSIO_PRO_MONTHLY_EUR = webPlanMonthlyPrice("physio_pro");
export const PHYSIO_BOOKING_COMMISSION_PERCENT = 10;

const faqPricing = (planId: WebSubscriptionPlanBase["id"]) =>
  formatAnnualPricingLine(webPlanMonthlyPrice(planId));

export const FAQ_ITEMS = [
  {
    q: "ProDay remplace-t-il WhatsApp pour mon équipe ?",
    a: "ProDay regroupe convocations, matchs, Mercato et stats. Fini les groupes éparpillés. La messagerie reste pour les échanges directs.",
  },
  {
    q: "L'app est-elle gratuite ?",
    a: "Oui, un compte gratuit couvre profil, Visibilité, calendrier, Arena en consultation et limites Mercato. Les offres Pro débloquent candidatures illimitées, multi-équipes, etc.",
  },
  {
    q: "Comment fonctionne la vérification coach ?",
    a: "Diplôme ou licence obligatoire à l'inscription. Badge orange pendant la revue, badge vert après validation. Messagerie complète ensuite.",
  },
  {
    q: "Qu'est-ce que la Visibilité ProDay ?",
    a: "Score de visibilité combinant profil, stats saison, candidatures et confiance. Plus elle monte, plus vous êtes visible des clubs.",
  },
  {
    q: "Qui peut publier sur le Mercato ?",
    a: "Les recruteurs ProDay : rôle Recruteur, clubs, coachs, agents et organisateurs (univers Pro). Les joueurs Man et Woman candidatent sans publier d'annonces.",
  },
  {
    q: "Le pôle santé inclut-il le coach mental ?",
    a: "Oui. Kinés, médecins du sport, coach mental, nutritionnistes et autres spécialités. Diplômes validés avant messagerie complète.",
  },
  {
    q: "Comment fonctionne le covoiturage ?",
    a: "Coachs et joueurs proposent des trajets ou réservent une place pour matchs et détections. Lié aux événements, comme un BlaBlaCar du foot.",
  },
  {
    q: "Qu'est-ce que le ProDay Shop ?",
    a: "Boutique officielle dans l'app : trépieds, t-shirts et maillots par univers (Man, Woman, Pro). Précommande par email en attendant le paiement in-app.",
  },
  {
    q: "Pro Day Man, Woman et Pro, c'est quoi ?",
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
    q: "Pôle Joueur : Comment créer mon CV ProDay ?",
    a: "Votre CV se remplit automatiquement à partir de votre profil et de vos stats de match. Vous pouvez personnaliser les sections, ajouter une photo et exporter en PDF pour les clubs.",
  },
  {
    q: "Pôle Joueur : Les stats sont-elles automatiques ?",
    a: "Oui, si votre équipe utilise ProDay pour les matchs, vos stats (buts, passes, temps de jeu) sont mises à jour automatiquement après chaque rencontre.",
  },
  {
    q: "Pôle Pro Club : Comment gérer mon effectif ?",
    a: "Importez votre liste de joueurs, gérez les contrats, les licences et les disponibilités. Le calendrier unifié simplifie la planification des entraînements et matchs.",
  },
  {
    q: "Pôle Pro Staff : Comment trouver des joueurs ?",
    a: "Utilisez le Mercato ProDay pour filtrer par poste, niveau, zone géographique. Les candidatures arrivent directement dans votre messagerie avec le CV du joueur.",
  },
  {
    q: "Pôle Santé : Comment prendre RDV avec des joueurs ?",
    a: "Votre agenda ProDay permet aux joueurs de prendre RDV en ligne. Vous recevez les notifications et pouvez gérer vos créneaux selon vos disponibilités.",
  },
  {
    q: "Pôle Supporter : Quelles fonctionnalités sont disponibles ?",
    a: "Suivez vos clubs favoris, accédez aux matchs en direct, participez au fil communautaire et recevez les actualités de vos équipes préférées.",
  },
  {
    q: "Pôle Partenaires : Comment sponsoriser des événements ?",
    a: "Connectez-vous avec des organisateurs de tournois et événements. Votre visibilité augmente via les partenariats affichés sur les profils et événements ProDay.",
  },
  {
    q: "Comment sécuriser mes données personnelles ?",
    a: "ProDay respecte le RGPD. Vos données sont chiffrées et vous contrôlez ce qui est visible. Vous pouvez supprimer votre compte et vos données à tout moment.",
  },
  {
    q: "L'app fonctionne-t-elle hors ligne ?",
    a: "Certaines fonctionnalités sont accessibles hors ligne (profil, stats enregistrées), mais les mises à jour et la messagerie nécessitent une connexion internet.",
  },
  {
    q: "Comment signaler un comportement inapproprié ?",
    a: "Utilisez le bouton de signalement sur un profil ou message. Notre équipe modère les signalements et peut suspendre les comptes qui enfreignent nos règles.",
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
    a: `Agent Elite : offre de lancement 19,99 €/mois pour les 20 premiers agents, puis 29,99 €/mois (${faqPricing("agent_elite")} après lancement). CRM joueurs, alertes géo, demandes de message et mandats.`,
  },
  {
    q: "Quel tarif pour le pôle santé ?",
    a: `Santé Pro : ${faqPricing("physio_pro")}. Agenda en ligne, messagerie patients et visibilité auprès des clubs partenaires.`,
  },
  {
    q: "Quel tarif pour Partenaire Pro ?",
    a: `Partenaire Pro : ${faqPricing("sponsor_pro")}. Visibilité événements, contacts organisateurs et sponsoring prioritaire.`,
  },
  {
    q: "Comment fonctionne la bêta ?",
    a: "Inscrivez-vous sur la liste d'attente. Les accès sont délivrés progressivement. Vous recevez un email d'invitation quand votre tour arrive.",
  },
  {
    q: "Puis-je changer de pôle après inscription ?",
    a: "Oui, vous pouvez changer de pôle dans les paramètres de votre compte. Notez que certaines fonctionnalités peuvent être spécifiques à certains pôles.",
  },
  {
    q: "Comment contacter le support ?",
    a: "Utilisez le formulaire de contact dans l'app ou via la liste d'attente sur le site. Notre équipe répond sous 24-48h ouvrés.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Enfin une app qui regroupe convocations, matchs et recrutement. Notre U17 ne jongle plus entre cinq groupes.",
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
    question: "Le week-end, tu passes ton temps plutôt à…",
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
    description: "Visibilité, stats et opportunités. Le Mercato complète votre profil.",
    thought: "Le foot, c'est avant tout une question de passion et de dépassement de soi. Chaque entraînement, chaque match compte pour construire ton parcours. ProDay t'accompagne pour que ton talent ne passe plus inaperçu.",
    href: "/pro-joueur",
    cta: "Voir le pôle Joueur",
  },
  coach: {
    title: "Profil Coach Pro",
    description: "Vérification diplôme, effectif et convocations. Univers Pro Day Pro.",
    thought: "Un coach, c'est bien plus qu'un tacticien. C'est un mentor, un guide qui façonne les caractères et construit les champions de demain. Ta vision mérite d'être structurée et reconnue.",
    href: "/pro#poles",
    cta: "Voir Pro Day Pro",
  },
  recruiter: {
    title: "Profil Recruteur",
    description: "Scouting, Mercato Pro et pipeline candidatures. Rôle Recruteur sur Pro Day Pro.",
    thought: "Repérer le talent, c'est un art. Entre intuition et analyse, tu cherches ces pépites qui feront la différence demain. ProDay te donne les outils pour transformer cette vision en réalité.",
    href: "/pro#poles",
    cta: "Voir Pro Day Pro",
  },
  club: {
    title: "Profil Club",
    description: "Annonces Mercato, multi-équipes et exports candidatures. Univers Pro Day Pro.",
    thought: "Un club, c'est une famille, une vision, un projet. Construire quelque chose de durable demande de la rigueur et de l'organisation. Ton ambition mérite les meilleurs outils pour grandir.",
    href: "/pro#poles",
    cta: "Voir Pro Day Pro",
  },
  organizer: {
    title: "Profil Organisateur",
    description: "Créez vos tournois Arena. Inscriptions et palmarès dans le calendrier.",
    thought: "Créer des moments inoubliables, rassembler la communauté autour d'une passion commune. C'est ça, la magie de l'organisation. ProDay simplifie la logistique pour que tu puisses te concentrer sur l'essentiel.",
    href: "/fonctionnalites#modules",
    cta: "Voir Arena",
  },
  woman: {
    title: "Univers ProDay Woman",
    description: "Mercato F, matchs et profil joueuse.",
    thought: "Le foot féminin écrit son histoire chaque jour. Talenteuse, déterminée, tu portes l'avenir de ce sport. ProDay t'offre la visibilité que tu mérites pour briller.",
    href: "/woman",
    cta: "Voir Woman",
  },
  parent: {
    title: "Espace Parent",
    description: "Supervision, contacts approuvés et limites de temps.",
    thought: "Voir son enfant s'épanouir sur le terrain, c'est une fierté immense. L'accompagner dans son parcours demande du temps, de l'écoute et les bons outils. ProDay facilite ce rôle de guide.",
    href: "/confiance#verification",
    cta: "Confiance & contrôle",
  },
  agent: {
    title: "Profil Agent",
    description: "CRM joueurs, mandats et contacts Mercato. Agent Elite sur Pro Day Pro.",
    thought: "Un agent, c'est le lien entre le talent et l'opportunité. Tu connais la valeur de chaque joueur et tu sais où elle peut s'exprimer. ProDay te donne la visibilité pour faire les bons matchs.",
    href: "/pro#poles",
    cta: "Voir Pro Day Pro",
  },
  homme: {
    title: "Pro Day Man",
    description: "Foot masculin amateur. Mercato M, matchs, Arena et CV joueur.",
    thought: "Le foot amateur, c'est la passion pure. Sans pression, juste le plaisir de jouer et de progresser. ProDay te permet de vivre cette passion avec des outils professionnels.",
    href: "/amateur#modules",
    cta: "Voir Man",
  },
  pro: {
    title: "Univers Pro Day Pro",
    description: "Recruteurs, coach, agent, club, pôle santé et réseau vérifié. Mercato Pro.",
    thought: "L'excellence demande un environnement d'excellence. Tu évolues dans un monde où chaque détail compte, chaque relation est précieuse. ProDay t'offre l'écosystème qui correspond à tes ambitions.",
    href: "/pro#poles",
    cta: "Voir Pro",
  },
};

export const SHOP_HIGHLIGHTS = [
  {
    name: "Trépied ProDay",
    priceEur: 34.9,
    description: "Filmez matchs et séquences pour votre CV. Sac de transport inclus.",
  },
  {
    name: "T-shirt officiel",
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

