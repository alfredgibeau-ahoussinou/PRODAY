export const BRAND = {
  name: "ProDay",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "Trois univers — Homme, Woman et Pro — pour couvrir tout l'écosystème foot amateur et professionnel.",
} as const;

export type ProductLineWeb = "homme" | "woman" | "pro";

export const HOMME_BRAND = {
  name: "Pro Day Man",
  fullName: "Pro Day Man",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "Le foot masculin amateur : Mercato M, matchs, Arena, pôle santé et CV joueur — réservé aux joueurs.",
  accent: "#0A0A0A",
  accentDark: "#262626",
} as const;

export const PRO_BRAND = {
  name: "Pro Day Pro",
  fullName: "Pro Day Pro",
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

export const TABS = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "recruit", label: "Mercato", icon: "search" },
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
  { value: "3", label: "Univers Homme · Woman · Pro" },
  { value: "∞", label: "Ambition terrain" },
] as const;

export const WOMAN_BRAND = {
  name: "ProDay Woman",
  fullName: "Pro Day for Women",
  tagline: "JOUER • BRILLER • GRANDIR",
  mission:
    "Le foot au féminin : Mercato F, matchs, Arena et profil joueuse — pensé pour les filles et les seniors F.",
  accent: "#BE185D",
  accentDark: "#831843",
} as const;

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
] as const;

export const PRODUCT_LINES = [
  {
    id: "homme" as const,
    brand: HOMME_BRAND,
    href: "/homme",
    image: "/showcase/classic-discover-hero.jpg",
    cta: "Pro Day Man",
  },
  {
    id: "woman" as const,
    brand: WOMAN_BRAND,
    href: "/woman",
    image: "/showcase/woman/woman-discover-hero.jpg",
    cta: "Univers Woman",
  },
  {
    id: "pro" as const,
    brand: PRO_BRAND,
    href: "/pro",
    image: "/showcase/classic-staff.jpg",
    cta: "Pro Day Pro",
  },
] as const;

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
    yearlyEur: 24.99,
    storeAvailable: false,
    universes: ["homme", "woman"] as ProductLineWeb[],
    freeIncludes: [
      "Profil, Pulse et CV en ligne",
      "Galerie et stats saison",
      "Mercato en lecture",
      "1 candidature / mois",
    ],
    proIncludes: [
      "Candidatures illimitées",
      "Mise en avant recherches",
      "Alertes nouvelles annonces",
      "Export PDF optionnel",
    ],
  },
  {
    id: "coach_pro",
    label: "Coach Pro",
    tagline: "Recrutement et multi-équipes",
    monthlyEur: 7.99,
    yearlyEur: 59.99,
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil staff vérifié",
      "1 équipe liée",
      "5 messages recrutement / mois",
    ],
    proIncludes: [
      "Équipes illimitées",
      "Messages illimités",
      "Annonces Mercato actives",
      "Stats candidatures",
    ],
  },
  {
    id: "club_pro",
    label: "Club Pro",
    tagline: "Annonces et structure club",
    monthlyEur: 11.99,
    yearlyEur: 89.99,
    storeAvailable: true,
    universes: ["homme", "woman"] as ProductLineWeb[],
    freeIncludes: [
      "Profil club",
      "1 équipe",
      "2 annonces actives",
      "Convocations base",
    ],
    proIncludes: [
      "Annonces illimitées",
      "Multi-équipes",
      "Priorité fil Mercato",
      "Exports candidatures",
    ],
  },
  {
    id: "agent_elite",
    label: "Agent Elite",
    tagline: "CRM joueurs et mandats",
    monthlyEur: 24.99,
    yearlyEur: 199.99,
    storeAvailable: false,
    universes: ["pro"] as ProductLineWeb[],
    freeIncludes: [
      "Profil agent vérifié",
      "10 contacts / mois",
      "Mercato lecture",
    ],
    proIncludes: [
      "Contacts illimités",
      "Alertes géolocalisées",
      "Pipeline mandats",
      "Exports et rapports",
    ],
  },
] as const;

export function plansForUniverse(line: ProductLineWeb) {
  return SUBSCRIPTION_PLANS_WEB.filter((p) => p.universes.includes(line));
}

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
      { label: "Mon profil joueur et stats", role: "player" },
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
    title: "Profil Joueur",
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

