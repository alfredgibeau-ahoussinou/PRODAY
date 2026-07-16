/** Contenu inscription sponsor — aligné sur website/src/lib/sponsorContent.ts */

export const SPONSOR_SECTORS = [
  'Équipementier sportif',
  'Alimentation & nutrition',
  'Finance & assurance',
  'Immobilier & construction',
  'Automobile & mobilité',
  'Tech & télécoms',
  'Santé & bien-être',
  'Média & communication',
  'Grande distribution',
  'Autre',
] as const;

export const SPONSOR_BUDGET_RANGES = [
  'Moins de 500 € / mois',
  '500 – 2 000 € / mois',
  '2 000 – 10 000 € / mois',
  '10 000 – 50 000 € / mois',
  'Plus de 50 000 € / mois',
  'À définir ensemble',
] as const;

export const SPONSOR_CAMPAIGN_GOALS = [
  'Notoriété locale',
  'Génération de leads B2B',
  'Financement de clubs',
  'Recrutement / RH',
  'Lancement produit',
  'Événementiel & tournois',
  'Fidélisation communauté',
] as const;

export const SPONSOR_TARGET_AUDIENCES = [
  'Joueurs amateurs (18–35 ans)',
  'Coachs & staff encadrement',
  'Dirigeants & présidents de club',
  'Organisateurs de tournois',
  'Supporters & communauté',
  'Professionnels du sport',
] as const;

export const SPONSOR_REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Occitanie',
  'Nouvelle-Aquitaine',
  'Hauts-de-France',
  'Grand Est',
  'Bretagne',
  'Pays de la Loire',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
  'France entière',
  'International',
] as const;

export const SPONSOR_SPORTS = [
  'Football amateur',
  'Football semi-pro / Régional',
  'Football féminin',
  'Futsal',
  'Football jeunes (U13–U19)',
  'Tournois & événements',
  'Multi-sports',
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
  phone?: string;
  message?: string;
};
