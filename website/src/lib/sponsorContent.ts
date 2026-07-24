import { SPONSOR_PARTNER_CONTACT_EMAIL } from "./content";

export const SPONSOR_BRAND = {
  name: "Pro Day Sponsor",
  shortName: "Sponsor",
  tagline: "Visibilité · ROI · Terrain",
  mission:
    "Publiez des offres auprès de clubs, joueurs et organisateurs actifs. Suivez impressions, clics et leads. Sans intermédiaire opaque.",
  accent: "#D4AF37",
  accentDark: "#92700C",
  logo: "/branding/logo-sponsor-picto.png",
} as const;

export const SPONSOR_HERO = {
  kicker: "PÔLE SPONSOR",
  title: "Votre marque sur le terrain.",
  description:
    "Clubs, joueurs et organisateurs actifs sur ProDay. Offres géolocalisées, tableau de bord et messagerie clubs. Pour les équipes marketing.",
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
      "Alertez les joueurs opt-in dans votre ville ou département lors du lancement d'une campagne locale (National Pro, bêta).",
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
  "Santé & bien-être",
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
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "Occitanie",
  "Nouvelle-Aquitaine",
  "Hauts-de-France",
  "Grand Est",
  "Bretagne",
  "Pays de la Loire",
  "Normandie",
  "Bourgogne-Franche-Comté",
  "Centre-Val de Loire",
  "Corse",
  "France entière",
  "International",
] as const;

export const SPONSOR_SPORTS = [
  "Football amateur",
  "Football semi-pro / Régional",
  "Football féminin",
  "Futsal",
  "Football jeunes (U13 à U19)",
  "Tournois & événements",
  "Multi-sports",
] as const;

export const SPONSOR_SIGNUP_STEPS = [
  { id: "company", label: "Entreprise", title: "Votre marque" },
  { id: "campaign", label: "Campagne", title: "Objectifs & budget" },
  { id: "targeting", label: "Ciblage", title: "Territoires & sports" },
  { id: "contact", label: "Contact", title: "Coordonnées & logo" },
  { id: "review", label: "Validation", title: "Récapitulatif" },
] as const;

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
  packageTier?: "starter" | "territorial" | "national" | "custom";
};

export const SPONSOR_FAQ = [
  {
    q: "Quelle différence avec les autres pôles ProDay ?",
    a: "Le pôle Sponsor est réservé aux marques et partenaires commerciaux. Vous publiez des offres, suivez un tableau de bord ROI et contactez les clubs via une vitrine vérifiée.",
  },
  {
    q: "Puis-je tester avant de m'engager ?",
    a: "Oui. La formule Découverte (0 €) donne un profil vérifié, une offre active et 10 messages clubs / mois.",
  },
  {
    q: "Comment fonctionne le push géolocalisé ?",
    a: "Les joueurs opt-in reçoivent une notification lors du lancement d'une offre dans leur ville. Disponible en National Pro (bêta), avec respect du consentement RGPD.",
  },
  {
    q: "Qui traite ma demande d'inscription ?",
    a: `L'équipe partenaires ProDay (${SPONSOR_PARTNER_CONTACT_EMAIL}) valide chaque dossier sous 48 h ouvrées et vous contacte pour activer votre espace.`,
  },
] as const;
