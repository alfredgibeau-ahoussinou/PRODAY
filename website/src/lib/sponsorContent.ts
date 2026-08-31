import { SPONSOR_PARTNER_CONTACT_EMAIL } from "./content";

export const SPONSOR_BRAND = {
  name: "Pro Day Sponsor",
  shortName: "Sponsor",
  tagline: "Opportunités · Partenariats · Impact",
  mission:
    "Trouver des opportunités de sponsoring, identifier clubs, équipes et profils pertinents, gérer les partenariats, suivre les activations et mesurer visibilité et impact · dans le même écosystème que clubs et joueurs.",
  accent: "#EF4444",
  accentDark: "#7F1D1D",
  logo: "/branding/logo-proday-mark-sponsor.png",
} as const;

export const SPONSOR_HERO = {
  kicker: "PÔLE SPONSOR",
  title: "Trouvez, activez, mesurez.",
  description:
    "Opportunités de sponsoring, clubs et profils pertinents, partenariats, activations, visibilité et impact. Une porte d'entrée vers l'écosystème ProDay, pas un pôle « en plus ».",
  image: "/showcase/classic-exp-sponsors.jpg",
} as const;

export const SPONSOR_CAPABILITIES = [
  {
    id: "offers",
    title: "Offres & financement",
    description:
      "Publiez équipement, visibilité ou soutien financier aux campagnes clubs. Offres illimitées en National Pro.",
    metric: "1 à ∞ offres",
  },
  {
    id: "geo",
    title: "Push géolocalisé",
    description:
      "Alertez les joueurs opt in dans votre ville ou département lors du lancement d'une campagne locale (National Pro, bêta).",
    metric: "Ciblage ville / dépt.",
  },
  {
    id: "dashboard",
    title: "Tableau de bord ROI",
    description:
      "Impressions, clics, leads et vues profil. Suivez chaque offre depuis l'app.",
    metric: "KPIs en temps réel",
  },
  {
    id: "branding",
    title: "Vitrine sponsor vérifiée",
    description:
      "Profil marque vérifié, logo mis en avant et messagerie directe avec les clubs qualifiés de votre territoire.",
    metric: "Badge vérifié",
  },
] as const;

export const SPONSOR_SECTORS = [
  "Équipementier sportif",
  "Alimentation & nutrition",
  "Finance & assurance",
  "Immobilier & construction",
  "Automobile & mobilité",
  "Tech & télécoms",
  "Santé & bien être",
  "Média & communication",
  "Grande distribution",
  "Autre",
] as const;

export const SPONSOR_BUDGET_RANGES = [
  "Moins de 500 € / mois",
  "500 à 2 000 € / mois",
  "2 000 à 10 000 € / mois",
  "10 000 à 50 000 € / mois",
  "Plus de 50 000 € / mois",
  "À définir ensemble",
] as const;

export const SPONSOR_CAMPAIGN_GOALS = [
  "Notoriété locale",
  "Génération de leads B2B",
  "Financement de clubs",
  "Recrutement / RH",
  "Lancement produit",
  "Événementiel & tournois",
  "Fidélisation communauté",
] as const;

export const SPONSOR_TARGET_AUDIENCES = [
  "Joueurs amateurs (18 à 35 ans)",
  "Coachs & staff encadrement",
  "Dirigeants & présidents de club",
  "Organisateurs de tournois",
  "Supporters & communauté",
  "Professionnels du sport",
] as const;

export const SPONSOR_REGIONS = [
  "Île de France",
  "Auvergne Rhône Alpes",
  "Provence Alpes Côte d'Azur",
  "Occitanie",
  "Nouvelle Aquitaine",
  "Hauts de France",
  "Grand Est",
  "Bretagne",
  "Pays de la Loire",
  "Normandie",
  "Bourgogne Franche Comté",
  "Centre Val de Loire",
  "Corse",
  "France entière",
  "International",
] as const;

export const SPONSOR_SPORTS = [
  "Football amateur",
  "Football semi pro / Régional",
  "Football féminin",
  "Futsal",
  "Football jeunes (U13 à U19)",
  "Tournois & événements",
  "Multi sports",
] as const;

export const SPONSOR_SIGNUP_STEPS = [
  { id: "company", label: "Entreprise", title: "Votre marque" },
  { id: "campaign", label: "Campagne", title: "Objectifs & budget" },
  { id: "targeting", label: "Ciblage", title: "Territoires & sports" },
  { id: "contact", label: "Contact", title: "Coordonnées & logo" },
  { id: "review", label: "Validation", title: "Récapitulatif" },
] as const;

export const SPONSOR_CONTACT_ROLES = [
  "Directeur / Directrice marketing",
  "Responsable partenariats",
  "Brand manager",
  "CEO / Fondateur",
  "Chargé(e) de communication",
  "Responsable commercial",
  "Autre",
] as const;

export type SponsorPackageTier = "starter" | "territorial" | "national" | "custom";

/** Étapes du parcours devis multi-pages (`/sponsor/devis/...`). */
export const SPONSOR_DEVIS_STEPS = [
  {
    id: "entreprise",
    path: "/sponsor/devis/entreprise",
    label: "Entreprise",
    title: "Votre marque",
    description: "Raison sociale et secteur d'activité.",
  },
  {
    id: "contact",
    path: "/sponsor/devis/contact",
    label: "Contact",
    title: "Vos coordonnées",
    description: "Personne à recontacter pour le devis.",
  },
  {
    id: "formule",
    path: "/sponsor/devis/formule",
    label: "Formule",
    title: "Formule & budget",
    description: "Niveau d'intérêt et enveloppe indicative.",
  },
  {
    id: "projet",
    path: "/sponsor/devis/projet",
    label: "Projet",
    title: "Votre projet",
    description: "Objectifs, ciblage et message libre.",
  },
  {
    id: "recap",
    path: "/sponsor/devis/recap",
    label: "Envoi",
    title: "Récapitulatif",
    description: "Vérifiez puis envoyez votre demande à ProDay.",
  },
] as const;

export type SponsorDevisStepId = (typeof SPONSOR_DEVIS_STEPS)[number]["id"];

export type SponsorDevisFormState = {
  companyName: string;
  sector: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  packageTier: SponsorPackageTier;
  budget: string;
  goals: string[];
  audience: string[];
  regions: string[];
  sports: string[];
  message: string;
};

export const SPONSOR_DEVIS_INITIAL: SponsorDevisFormState = {
  companyName: "",
  sector: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  packageTier: "custom",
  budget: "",
  goals: [],
  audience: [],
  regions: [],
  sports: [],
  message: "",
};

export type SponsorQuotePayload = {
  companyName: string;
  sector: string;
  contactName: string;
  contactRole?: string;
  email: string;
  phone?: string;
  packageTier: SponsorPackageTier;
  budget?: string;
  goals?: string[];
  audience?: string[];
  regions?: string[];
  sports?: string[];
  message?: string;
  source?: "website" | "app";
};

export type SponsorSignupPayload = {
  companyName: string;
  sector: string;
  contactName: string;
  budget: string;
  goals: string[];
  audience: string[];
  regions: string[];
  sports: string[];
  email: string;
  phone: string;
  logoFileName?: string;
  message?: string;
  packageTier?: SponsorPackageTier;
};

export const SPONSOR_FAQ = [
  {
    q: "Quelle différence avec les autres pôles ProDay ?",
    a: "Sponsor n'est pas un produit séparé : c'est une porte d'entrée vers le même écosystème. Vous trouvez des opportunités, identifiez clubs/profils, gérez partenariats et activations, et mesurez l'impact · sur la même donnée que clubs et joueurs.",
  },
  {
    q: "Puis je tester avant de m'engager ?",
    a: "Oui. La formule Découverte (0 €) donne un profil vérifié, une offre active et 10 messages clubs / mois.",
  },
  {
    q: "Comment fonctionne le push géolocalisé ?",
    a: "Les joueurs opt in reçoivent une notification lors du lancement d'une offre dans leur ville. Disponible en National Pro (bêta), avec respect du consentement RGPD.",
  },
  {
    q: "Qui traite ma demande d'inscription ?",
    a: `L'équipe partenaires ProDay (${SPONSOR_PARTNER_CONTACT_EMAIL}) reçoit chaque devis en ligne et vous contacte sous 48 h ouvrées pour activer votre espace.`,
  },
  {
    q: "Comment demander un devis ?",
    a: "Utilisez le parcours /sponsor/devis (entreprise, contact, formule, projet). À l'envoi, la demande est enregistrée et un email part vers proday.admin@gmail.com.",
  },
] as const;
