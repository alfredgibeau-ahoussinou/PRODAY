export const BRAND = {
  name: "ProDay",
  tagline: "CONNECTER • PROGRESSER • RÉUSSIR",
  mission:
    "L'écosystème foot amateur et semi-pro : carrière, club, matchs et communauté dans une seule application.",
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
      "Compléter le profil & Pulse",
      "Postuler au Mercato",
      "Matchs & Live Stats",
      "Exporter le CV PDF",
    ],
  },
  {
    id: "coach",
    role: "Coach / Agent",
    emoji: "📋",
    steps: [
      "Vérification diplôme",
      "Annonces & détections",
      "Convocations & compositions",
      "Live Stats équipe",
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
  { value: "5", label: "Onglets unifiés" },
  { value: "8", label: "Piliers produit" },
  { value: "1", label: "Saison, une app" },
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
    subtitle: "Pulse & CV",
    description:
      "Stats saison, galerie et export PDF — votre CV foot féminin vivant.",
    image: "/showcase/woman/woman-profile.jpg",
  },
] as const;

export const VISION_PILLARS = [
  {
    title: "Mission",
    body: "Connecter • Progresser • Réussir — donner à chaque acteur du foot amateur les outils du haut niveau.",
  },
  {
    title: "Écosystème",
    body: "Recrutement, saison, convocations, matchs amicaux, Arena et sponsors — cinq onglets, une expérience.",
  },
  {
    title: "Technologie",
    body: "React Native / Expo, Firebase Auth & Firestore — données réelles, pas de fiction en production.",
  },
  {
    title: "Roadmap",
    body: "Mercato, Live Stats, Gestion équipe livrés. Notifications géo et paiements tournois à venir.",
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
] as const;

export const SUBSCRIPTION_PLANS_WEB = [
  {
    id: "player_plus",
    label: "Joueur Plus",
    tagline: "Mercato illimité et visibilité renforcée",
    monthlyEur: 4.99,
    yearlyEur: 39,
    storeAvailable: false,
    freeIncludes: [
      "Profil, Pulse et galerie",
      "Mercato en lecture",
      "3 candidatures / mois",
      "Calendrier et RSVP",
    ],
    proIncludes: [
      "Candidatures illimitées",
      "Mise en avant recherches",
      "Alertes nouvelles annonces",
      "Historique exportable",
    ],
  },
  {
    id: "coach_pro",
    label: "Coach Pro",
    tagline: "Recrutement et multi-équipes",
    monthlyEur: 14.99,
    yearlyEur: 119,
    storeAvailable: false,
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
    monthlyEur: 19.99,
    yearlyEur: 169,
    storeAvailable: true,
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
    monthlyEur: 79,
    yearlyEur: 699,
    storeAvailable: false,
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
    q: "ProDay Woman est-il séparé ?",
    a: "C'est un univers dédié au foot féminin dans la même app : Mercato F, tournois filles, profil joueuse — branding et contenus adaptés.",
  },
  {
    q: "Puis-je exporter mon CV foot ?",
    a: "Oui — chaque match alimente votre profil via Live Stats. Export PDF professionnel depuis l'onglet Profil.",
  },
  {
    q: "Les données sont-elles réelles ?",
    a: "En production, Firebase Auth et Firestore — pas de données fictives. La beta collecte des comptes testeurs réels.",
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
      { label: "Mixte / plutôt masculin", role: "standard" },
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
    description: "Complétez votre profil, montez votre Pulse et postulez au Mercato.",
    href: "/parcours",
    cta: "Voir le parcours joueur",
  },
  coach: {
    title: "Profil Coach",
    description: "Vérification diplôme, annonces et convocations — Live Stats inclus.",
    href: "/confiance",
    cta: "Vérification & parcours",
  },
  club: {
    title: "Profil Club",
    description: "Annonces Mercato, multi-équipes et exports candidatures avec Club Pro.",
    href: "/tarifs",
    cta: "Voir les offres Club",
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
    description: "CRM joueurs, mandats et contacts recrutement avec Agent Elite.",
    href: "/tarifs",
    cta: "Voir Agent Elite",
  },
  standard: {
    title: "ProDay Classique",
    description: "L'écosystème complet amateur et semi-pro.",
    href: "/fonctionnalites",
    cta: "Toutes les fonctionnalités",
  },
};

export const LIVE_STAT_EVENTS = [
  { type: "goal", label: "But", points: 1 },
  { type: "assist", label: "Passe décisive", points: 1 },
  { type: "yellow", label: "Carton jaune", points: 0 },
  { type: "save", label: "Arrêt (GK)", points: 1 },
] as const;

