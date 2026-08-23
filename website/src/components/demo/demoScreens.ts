import type { MainTabId } from "@/lib/appTabs";
import type { DemoPoleId } from "@/lib/demoPoles";

export type DemoScreenMock = {
  title: string;
  subtitle: string;
  focus: { title: string; body: string }[];
};

const SHARED: Partial<Record<MainTabId, DemoScreenMock>> = {
  shop: {
    title: "Boutique",
    subtitle: "Équipement et merch ProDay. Catalogue lié à votre pôle.",
    focus: [
      { title: "Pack entraînement", body: "Maillot, short et accessoires (démo)." },
      { title: "Offres membres", body: "Réductions liées à votre plan d’abonnement (démo)." },
    ],
  },
  messages: {
    title: "Messages",
    subtitle: "Conversations entre profils du même réseau.",
    focus: [
      { title: "Fils ouverts", body: "Messagerie illustrative. Aucun envoi réel." },
    ],
  },
};

const BY_POLE: Record<DemoPoleId, Partial<Record<MainTabId, DemoScreenMock>>> = {
  joueur: {
    home: {
      title: "Carrière",
      subtitle: "Amateur → Pro. Badges, saison et opportunités.",
      focus: [
        { title: "Badge Amateur", body: "Bleu. Passez Centre (vert) ou Pro (jaune) sans changer de profil." },
        { title: "Visibilité 72", body: "Score de profil. Stats + activité." },
      ],
    },
    covoiturage: {
      title: "Trajets",
      subtitle: "Covoiturage vers matchs et détections.",
      focus: [{ title: "Départ parking club", body: "Sam. 13h30 · 2 places." }],
    },
    recrutement: {
      title: "Mercato",
      subtitle: "Filtres recruteur : amateurs / centres / pros.",
      focus: [{ title: "Attaquant · Régional", body: "FC Nord. Paris 75." }],
    },
    matchs: {
      title: "Matchs",
      subtitle: "Invitations club, RSVP et scores.",
      focus: [
        { title: "Invitation reçue", body: "FC Nord vous propose un amical U15 · sam. 15h." },
        { title: "Cette semaine", body: "Entraînement mar. · match sam." },
      ],
    },
    reels: {
      title: "Reels",
      subtitle: "Highlights pour votre vitrine.",
      focus: [{ title: "Highlight entraînement", body: "Séquence illustrative pour la démo." }],
    },
    sante: {
      title: "Santé",
      subtitle: "Annuaire praticiens près des clubs.",
      focus: [{ title: "Kiné · Ostéo", body: "Réserver via la fiche du praticien (Cal.com)." }],
    },
    feed: {
      title: "Fil",
      subtitle: "Actualités du réseau joueur.",
      focus: [{ title: "Question hebdo", body: "Objectif de saison. Réponses illustratives." }],
    },
    profil: {
      title: "Moi",
      subtitle: "Profil, badge, privacy contacts et CV.",
      focus: [{ title: "Joueur vérifié", body: "Licence ou certification club." }],
    },
  },
  supporter: {
    home: {
      title: "Tribune",
      subtitle: "Matchs près de chez vous et dans le monde. 100 % gratuit.",
      focus: [
        { title: "Ce soir · Live", body: "Deux rencontres suivies dans votre fil." },
        { title: "Clubs favoris", body: "Suivis illimités. Aucune donnée réelle." },
      ],
    },
    matchs: {
      title: "Matchs",
      subtitle: "Calendrier et live scores.",
      focus: [{ title: "En direct", body: "Score illustratif · débat ouvert." }],
    },
    feed: {
      title: "Suivis",
      subtitle: "Clubs et joueurs que vous suivez.",
      focus: [{ title: "Fil tribune", body: "Réactions et moments partagés." }],
    },
    messages: {
      title: "Débats",
      subtitle: "Échanges communautaires.",
      focus: [{ title: "Salon match", body: "Conversation illustrative." }],
    },
    reels: {
      title: "Moments",
      subtitle: "Réels et highlights community.",
      focus: [{ title: "But du weekend", body: "Clip vertical. Démo." }],
    },
    profil: {
      title: "Compte",
      subtitle: "Profil supporter et préférences.",
      focus: [{ title: "Abonnements gratuits", body: "Pas de paywall tribune." }],
    },
  },
  sante: {
    home: {
      title: "Accueil",
      subtitle: "Cockpit cabinet. RDV du jour et demandes.",
      focus: [
        { title: "5 RDV aujourd’hui", body: "Agenda lié à votre Cal.com." },
        { title: "2 demandes", body: "Sportifs en attente de créneau." },
      ],
    },
    matchs: {
      title: "Agenda",
      subtitle: "Créneaux et séances de suivi.",
      focus: [{ title: "14h. Rééducation", body: "Patient illustratif · cabinet." }],
    },
    feed: {
      title: "Demandes",
      subtitle: "Sollicitations de sportifs et clubs.",
      focus: [{ title: "Bilan post match", body: "Demande reçue. Démo." }],
    },
    reels: {
      title: "Vidéos",
      subtitle: "Contenus éducatifs (prévention, étirements).",
      focus: [{ title: "Conseil récupération", body: "Clip public. Pas la téléconsultation." }],
    },
    messages: {
      title: "Messages",
      subtitle: "Messagerie sécurisée patient ↔ praticien.",
      focus: [{ title: "Suivi blessure", body: "Conversation illustrative." }],
    },
    profil: {
      title: "Cabinet",
      subtitle: "Spécialité, zone et lien Cal.com.",
      focus: [{ title: "Cal.com connecté", body: "Username praticien. Obligatoire à l’inscription." }],
    },
  },
  pro_club: {
    home: {
      title: "Cockpit club",
      subtitle: "Équipes, compétitions et permissions.",
      focus: [
        { title: "3 équipes actives", body: "U17 · U19 · Seniors. Illustratif." },
        { title: "Convocations envoyées", body: "Match sam. · 18 confirmés." },
      ],
    },
    recrutement: {
      title: "Recrutement",
      subtitle: "Suivi et annonces.",
      focus: [{ title: "Poste milieu", body: "Annonce ouverte. Démo." }],
    },
    matchs: {
      title: "Saison",
      subtitle: "Calendrier, résultats et classements.",
      focus: [{ title: "Amical sam.", body: "Stade domicile." }],
    },
    covoiturage: {
      title: "Covoiturage",
      subtitle: "Matchs, entraînements, stages.",
      focus: [{ title: "Départ club", body: "Sam. 13h · 3 places." }],
    },
    messages: {
      title: "Communication",
      subtitle: "Staff, parents et partenaires.",
      focus: [{ title: "Groupe U19", body: "Message illustratif." }],
    },
    profil: {
      title: "Vitrine",
      subtitle: "Identité club et offres Amateur / Essentiel / Premium.",
      focus: [{ title: "Page publique", body: "Logo, couleurs, contacts." }],
    },
  },
  coach: {
    home: {
      title: "Cockpit coach",
      subtitle: "Tactique IA, effectif et matchs.",
      focus: [
        { title: "Tactique IA", body: "Composition 4 3 3 · consignes banc." },
        { title: "Analyse de forme", body: "3 joueurs à surveiller." },
      ],
    },
    matchs: {
      title: "Calendrier",
      subtitle: "Séances, matchs et préparation.",
      focus: [{ title: "Séance mar. 19h", body: "Thème : transitions." }],
    },
    recrutement: {
      title: "Mercato",
      subtitle: "Repérage (rôles réseau agent / recruteur).",
      focus: [{ title: "Profil latéral", body: "Alert scouting. Démo." }],
    },
    covoiturage: {
      title: "Déplacements",
      subtitle: "Logistique groupe.",
      focus: [{ title: "Bus match", body: "Départ 12h30." }],
    },
    profil: {
      title: "Profil coach",
      subtitle: "Parcours, diplômes et philosophie.",
      focus: [{ title: "Compte vérifié", body: "Licence / diplôme. Statut illustratif." }],
    },
  },
  sponsor: {
    home: {
      title: "Campagnes",
      subtitle: "Visibilité mesurée auprès des clubs actifs.",
      focus: [
        { title: "Tier Territorial", body: "3 clubs · 2 matchs ce weekend." },
        { title: "KPI impressions", body: "12,4 k · démo illustrative." },
      ],
    },
    feed: {
      title: "Inventaire",
      subtitle: "Emplacements et formats disponibles.",
      focus: [{ title: "Bandeau tribune", body: "Match sam. · U19." }],
    },
    matchs: {
      title: "Terrain",
      subtitle: "Événements où votre marque apparaît.",
      focus: [{ title: "Finale départementale", body: "Activation prévue." }],
    },
    messages: {
      title: "Contact",
      subtitle: "Clubs et organisateurs.",
      focus: [{ title: "FC Nord", body: "Demande de devis. Démo." }],
    },
    profil: {
      title: "Marque",
      subtitle: "Vitrine partenaire vérifiée.",
      focus: [{ title: "Badge Sponsor", body: "Profil public illustratif." }],
    },
  },
};

export function screenForDemoPole(pole: DemoPoleId, tab: MainTabId): DemoScreenMock {
  const fromPole = BY_POLE[pole][tab];
  if (fromPole) return fromPole;
  const shared = SHARED[tab];
  if (shared) return shared;
  return {
    title: tab,
    subtitle: "Écran illustratif ProDay.",
    focus: [{ title: "Démo", body: "Contenu fictif. Aucune donnée réelle." }],
  };
}
