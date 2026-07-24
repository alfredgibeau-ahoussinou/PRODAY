import type { MainTabId } from "@/lib/appTabs";
import type { DemoPoleId } from "@/lib/demoPoles";

export type DemoScreenMock = {
  title: string;
  subtitle: string;
  focus: { title: string; body: string }[];
};

const SHARED: Partial<Record<MainTabId, DemoScreenMock>> = {
  shop: {
    title: "Shop",
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
  amateur: {
    home: {
      title: "Équipe",
      subtitle: "Votre semaine : convocations, entraînements, déplacements.",
      focus: [
        { title: "Sam. 15h. Stade Nord", body: "Convocation confirmée · amical loisir." },
        { title: "Covoiturage", body: "2 places restantes pour le match." },
      ],
    },
    covoiturage: {
      title: "Trajets",
      subtitle: "Covoiturage vers matchs et détections.",
      focus: [{ title: "Départ parking club", body: "Sam. 13h30 · 2 places." }],
    },
    recrutement: {
      title: "Club",
      subtitle: "Mercato local et annonces de votre secteur.",
      focus: [{ title: "Attaquant · Régional", body: "FC Nord. Paris 75." }],
    },
    matchs: {
      title: "Matchs",
      subtitle: "Calendrier, RSVP et scores.",
      focus: [{ title: "Cette semaine", body: "Entraînement mar. · match sam." }],
    },
    reels: {
      title: "Reels",
      subtitle: "Moments d’équipe. Format vertical.",
      focus: [{ title: "Highlight entraînement", body: "Séquence illustrative pour la démo." }],
    },
    sante: {
      title: "Santé",
      subtitle: "Annuaire praticiens près des clubs.",
      focus: [{ title: "Kiné · Ostéo", body: "Réserver via la fiche du praticien (Cal.com)." }],
    },
    feed: {
      title: "Fil",
      subtitle: "Actualités du réseau amateur.",
      focus: [{ title: "Question hebdo", body: "Objectif de saison. Réponses illustratives." }],
    },
    profil: {
      title: "Moi",
      subtitle: "Profil, Visibilité et CV.",
      focus: [{ title: "Visibilité 72", body: "Score de profil. Indiquez stats et bio." }],
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
      focus: [{ title: "But du week-end", body: "Clip vertical. Démo." }],
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
      focus: [{ title: "Bilan post-match", body: "Demande reçue. Démo." }],
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
  pro_joueur: {
    home: {
      title: "Carrière",
      subtitle: "Visibilité, saison et opportunités en un coup d’œil.",
      focus: [
        { title: "Visibilité 78", body: "Score ProDay. Profil + stats + activité." },
        { title: "3 opportunités", body: "Annonces Mercato ciblées." },
      ],
    },
    recrutement: {
      title: "Opportunités",
      subtitle: "Mercato pro. Clubs et essais.",
      focus: [{ title: "Essai · National", body: "Club illustratif. Candidature." }],
    },
    reels: {
      title: "Réels",
      subtitle: "Highlights pour votre vitrine.",
      focus: [{ title: "Skill du jour", body: "Ajoutez au portfolio (démo)." }],
    },
    matchs: {
      title: "Groupe",
      subtitle: "Calendrier et convocations.",
      focus: [{ title: "Convocation dim.", body: "RSVP illustrative." }],
    },
    profil: {
      title: "Moi",
      subtitle: "CV, galerie et Visibilité.",
      focus: [{ title: "CV exportable", body: "Stats saison et highlights." }],
    },
  },
  pro_club: {
    home: {
      title: "Structure",
      subtitle: "Pilotage club. Recrutement et calendrier.",
      focus: [
        { title: "Pipeline candidatures", body: "12 dossiers en revue (illustratif)." },
        { title: "Matchs du week-end", body: "Deux rencontres à confirmer." },
      ],
    },
    recrutement: {
      title: "Recrutement",
      subtitle: "Annonces et shortlists.",
      focus: [{ title: "Poste milieu", body: "Annonce ouverte. Démo." }],
    },
    matchs: {
      title: "Calendrier",
      subtitle: "Saison et événements club.",
      focus: [{ title: "Amical sam.", body: "Stade domicile." }],
    },
    messages: {
      title: "Communication",
      subtitle: "Staff, parents et partenaires.",
      focus: [{ title: "Groupe U19", body: "Message illustratif." }],
    },
    profil: {
      title: "Vitrine",
      subtitle: "Identité club et plans.",
      focus: [{ title: "Page publique", body: "Logo, couleurs, contacts." }],
    },
  },
  pro_staff: {
    home: {
      title: "Équipe",
      subtitle: "Cockpit coach / agent / recruteur.",
      focus: [
        { title: "Effectif du jour", body: "Présences et absences illustratives." },
        { title: "Mercato à traiter", body: "3 profils shortlistés." },
      ],
    },
    matchs: {
      title: "Calendrier",
      subtitle: "Séances, matchs et détections.",
      focus: [{ title: "Séance mar. 19h", body: "Thème : transitions." }],
    },
    recrutement: {
      title: "Mercato",
      subtitle: "Repérage et annonces ciblées.",
      focus: [{ title: "Profil latéral", body: "Alert scouting. Démo." }],
    },
    covoiturage: {
      title: "Déplacements",
      subtitle: "Logistique groupe.",
      focus: [{ title: "Bus match", body: "Départ 12h30." }],
    },
    profil: {
      title: "Profil",
      subtitle: "Badge staff et vérifications.",
      focus: [{ title: "Compte vérifié", body: "Licence / diplôme. Statut illustratif." }],
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
